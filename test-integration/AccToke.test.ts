import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { deployMockContract, MockContract } from "ethereum-waffle";
import * as timeMachine from "ganache-time-traveler";
import { artifacts, ethers, network, upgrades } from "hardhat";
import { AccToke, ERC20, IStateReceiver, BalanceTracker, EventProxy } from "../typechain";
import { Contract, getContractAddress, Environment } from "utils/config";

import PolygonStateSenderAbi from "../abis/PolygonStateSender.json";
import { PolygonChain } from "./utilities/polygonChain";

const POLYGON_FX_ROOT = getContractAddress(Environment.MAINNET, Contract.FX_ROOT);
const POLYGON_FX_CHILD = getContractAddress(Environment.MAINNET, Contract.FX_CHILD);
const POLYGON_STATE_SENDER = getContractAddress(Environment.MAINNET, Contract.POLYGON_STATE_SENDER);

import { fundAccount } from "./utilities/fundAccount";

import { BigNumber, BaseContract } from "ethers";

const ERC20Artifact = artifacts.require("@openzeppelin/contracts/token/ERC20/ERC20.sol:ERC20");
const IManager = artifacts.require("contracts/acctoke/interfaces/IManager.sol:IManager");

describe("Test AccToke", () => {
	let accToke: AccToke;

	let snapshotId: string;
	let snapshotId_individual: string;
	let deployer: SignerWithAddress;
	let manager: MockContract;
	let user: SignerWithAddress;
	let treasury: SignerWithAddress;

	let startingBlock: number;

	// -- polygon - //
	let polygonChain!: PolygonChain;
	let polygonDeployer: SignerWithAddress;

	let stateSender: BaseContract;
	let stateReceiver: IStateReceiver;
	let eventProxy: EventProxy;
	let balanceTracker: BalanceTracker;
	// -- end of polygon -- //

	const minLockCycles = 2;
	const maxLockCycles = 8;
	const minLockCycleID = BigNumber.from(200);
	let currentCycleID: BigNumber;
	let maxLockCycleID = minLockCycleID.add(maxLockCycles);

	let toke: ERC20;
	const TOKE_ADDRESS = getContractAddress(Environment.MAINNET, Contract.TOKE);

	const zero = BigNumber.from(0);
	const tokeAmount = ethers.utils.parseEther("100");

	before(async () => {
		snapshotId = (await timeMachine.takeSnapshot())["result"];

		[deployer, user, treasury] = await ethers.getSigners();

		// init mock current cycle
		manager = await deployMockContract(deployer, IManager.abi);
		await manager.mock.getCurrentCycleIndex.returns(minLockCycleID);
		await manager.mock.getRolloverStatus.returns(false);

		const accTokeFactory = await ethers.getContractFactory("AccToke");
		accToke = (await upgrades.deployProxy(
			accTokeFactory,
			[manager.address, minLockCycles, maxLockCycles, TOKE_ADDRESS, tokeAmount.mul(10)],
			{ unsafeAllow: ["constructor"] }
		)) as AccToke;
		await accToke.deployed();

		await network.provider.request({ method: "hardhat_impersonateAccount", params: [accToke.address] });

		let etherBal = ethers.utils.parseEther("5000").toHexString();
		if (etherBal.startsWith("0x0")) etherBal = "0x" + etherBal.substring(3);

		await ethers.provider.send("hardhat_setBalance", [accToke.address, etherBal]);

		toke = (await ethers.getContractAt(ERC20Artifact.abi, TOKE_ADDRESS)) as ERC20;

		// fund asset account
		await fundAccount("TOKE", deployer.address, 10000); // 10x tokeAmount that's used in tests / supports multiple locks scenario

		// get cycle IDs
		currentCycleID = await accToke.getCurrentCycleID();
		maxLockCycleID = currentCycleID.add(maxLockCycles);

		///////////////////////////
		// Deploy balancetracker on polygon to test receiving L2 messages
		// TODO: remove key!!!
		polygonChain = new PolygonChain(
			47853,
			"https://polygon-mainnet.g.alchemy.com/v2/" + process.env.ALCHEMY_API_KEY_POLYGON,
			137
		);
		await polygonChain.start();

		// Get L1 state sender
		stateSender = await ethers.getContractAt(PolygonStateSenderAbi, POLYGON_STATE_SENDER);

		// Get L2 state receiver
		const stateReceiverArtifact = polygonChain.hre.artifacts.require("IStateReceiver");
		stateReceiver = (await polygonChain.ethers.getContractAt(
			stateReceiverArtifact.abi,
			POLYGON_FX_CHILD
		)) as unknown as IStateReceiver;

		// Set up polygon bridge
		await polygonChain.setupBridge(stateReceiver, stateSender);

		[polygonDeployer] = await polygonChain.ethers.getSigners();

		// Set up Event Proxy on L2
		const eventProxyFactory = await polygonChain.ethers.getContractFactory("EventProxy");
		eventProxy = (await polygonChain.hre.upgrades.deployProxy(eventProxyFactory, [POLYGON_FX_CHILD])) as EventProxy;

		// Deploy mock of BalanceTracker
		// const IBalanceTracker = polygonChain.hre.artifacts.require("IBalanceTracker");
		// balanceTracker = await deployMockContract(polygonDeployer, IBalanceTracker.abi);
		// Deploy real BalanceTracker
		const balanceTrackerFactory = await polygonChain.ethers.getContractFactory("BalanceTracker");
		balanceTracker = (await polygonChain.hre.upgrades.deployProxy(balanceTrackerFactory, [
			eventProxy.address,
		])) as BalanceTracker;

		await balanceTracker.addSupportedTokens([accToke.address]);

		await eventProxy.connect(polygonDeployer).setSenderRegistration(accToke.address, true);

		const destinations: any = [];
		["Deposit", "Withdrawal Request"].forEach((sig) =>
			destinations.push({
				sender: accToke.address,
				eventType: ethers.utils.formatBytes32String(sig),
				destinations: [balanceTracker.address],
			})
		);

		await eventProxy.registerDestinations(destinations);

		accToke.connect(deployer);
		await accToke.setDestinations(POLYGON_FX_ROOT, eventProxy.address);
		await accToke.setEventSend(true);
		// -- end of L2 deployment -- //
	});

	after(async () => {
		await timeMachine.revertToSnapshot(snapshotId);
		await polygonChain.stop();
	});

	const takeSnapshot = async () => {
		//Get a new block so we can be sure the next command in the only event in there
		await ethers.provider.send("evm_mine", []);
		// set startingblock
		startingBlock = (await ethers.provider.getBlock("latest")).number;
		// reset manager
		await setCurrentCycle(minLockCycleID);
		await setIsInRollover(false);
		// take snapshots
		snapshotId_individual = (await timeMachine.takeSnapshot())["result"];
		// take polygon snapshot
		await polygonChain.snapshot();
	};

	const restoreSnapshot = async () => {
		// revert snapshot
		await timeMachine.revertToSnapshot(snapshotId_individual);
		// revert polygon snapshot
		await polygonChain.revertSnapshot();
	};

	describe("Initialization", () => {
		it("Should not allow calling initializer on implementation contract", async () => {
			const accTokeFactory = await ethers.getContractFactory("AccToke");
			const accTokeContract = await accTokeFactory.deploy();
			await accTokeContract.deployed();

			await expect(
				accTokeContract.initialize(
					manager.address,
					minLockCycles,
					maxLockCycles,
					TOKE_ADDRESS,
					tokeAmount.mul(10)
				)
			).to.be.revertedWith("Initializable: contract is already initialized");
		});
	});

	describe("Lock Toke tests", async () => {
		beforeEach(async () => {
			accToke.connect(deployer);
			await takeSnapshot();
		});
		afterEach(async () => await restoreSnapshot());

		it("should fail / multiple tests with invalid locking data", async () => {
			/////////////////////
			// get balances prior
			const tokeBalanceBefore = await toke.balanceOf(deployer.address);
			const accTokeBalanceBefore = await accToke.balanceOf(deployer.address);
			const l2BalanceBefore = await getL2Balance(deployer.address);

			// unapproved to spend toke
			await expect(lockTokeRequest(tokeAmount, maxLockCycles)).to.be.revertedWith(
				"ERC20: transfer amount exceeds allowance"
			);
			// lockCycles < minCycles
			await toke.connect(deployer).approve(accToke.address, tokeAmount);
			await expect(lockTokeRequest(tokeAmount, minLockCycles - 1)).to.be.revertedWith("INVALID_LOCK_CYCLES");
			// lockCycles > maxCycles
			await expect(lockTokeRequest(tokeAmount, maxLockCycles + 1)).to.be.revertedWith("INVALID_LOCK_CYCLES");
			// amount > cap
			await accToke.setMaxCap(tokeAmount.div(2));
			await expect(lockTokeRequest(tokeAmount, maxLockCycles)).to.be.revertedWith("MAX_CAP_EXCEEDED");

			await polygonChain.transferEvent(startingBlock);

			// make sure the balances didn't change
			expect(await toke.balanceOf(deployer.address)).to.equal(tokeBalanceBefore);
			expect(await accToke.balanceOf(deployer.address)).to.equal(accTokeBalanceBefore);
			expect(await getL2Balance(deployer.address)).to.equal(l2BalanceBefore);
		});

		it("should succeed with valid duration", async () => {
			await lockToke(maxLockCycles, tokeAmount);
		});
	});

	describe("Unlock Toke tests", async () => {
		beforeEach(async () => {
			accToke.connect(deployer);

			await takeSnapshot();
			await lockToke();
		});
		afterEach(async () => await restoreSnapshot());

		it("should fail / multiple tests with invalid unlocking data", async () => {
			// /////////////////////
			// // get balances prior
			const tokeBalanceBefore = await toke.balanceOf(deployer.address);
			// const accTokeBalanceBefore = await accToke.balanceOf(deployer.address);
			// const l2BalanceBefore = await getL2Balance(deployer.address);

			// unlock without lock request
			await expect(accToke.withdraw(tokeAmount)).to.be.revertedWith("NO_WITHDRAWAL_REQUEST");

			// create proper lock request for subsequent tests
			//	 - forward to unlock cycle
			await setCurrentCycle(maxLockCycleID);
			//	 - create proper request
			await expect(accToke.requestWithdrawal(tokeAmount))
				.to.emit(accToke, "WithdrawalRequestedEvent")
				.withArgs(deployer.address, tokeAmount);
			//	 - transfer L2 updates
			await _forwardL2Message();

			// unlock too early
			await expect(accToke.withdraw(tokeAmount)).to.be.revertedWith("WITHDRAWAL_NOT_YET_AVAILABLE");

			// go to proper withdraw cycle to isolate next steps
			await manager.mock.getCurrentCycleIndex.returns(maxLockCycleID.add(1));

			// unlock too much
			await expect(accToke.withdraw(tokeAmount.add(1))).to.be.revertedWith("INSUFFICIENT_BALANCE");

			// unlock too little (0)
			await expect(accToke.withdraw(0)).to.be.revertedWith("INVALID_AMOUNT");

			// unlock in the middle of next lock period
			// NOTE: as per requirements once withdrawalRequest.minCycle hits this can be done anytime after
			await manager.mock.getCurrentCycleIndex.returns(maxLockCycleID.add(2));
			await expect(accToke.withdraw(tokeAmount)).to.not.be.reverted;

			await _forwardL2Message();

			// make sure it's clean slate after full cycle
			expect(await toke.balanceOf(deployer.address)).to.equal(tokeBalanceBefore.add(tokeAmount));
			expect(await accToke.balanceOf(deployer.address)).to.equal(0);
			expect(await getL2Balance(deployer.address)).to.equal(0);
		});

		it("should succeed / valid data", async () => {
			// forward to unlock cycle
			await setCurrentCycle(maxLockCycleID);
			// create withdrawalRequest
			await requestWithdrawal(tokeAmount);
			// verify l2 balance disappearance after withdrawal request
			await expectedL2Balance(zero);
			// forward to past the unlock cycle to enable withdrawal
			await setCurrentCycle(maxLockCycleID.add(1));
			// call withdraw
			await withdraw(tokeAmount);
			// make sure everything was withdrawn
			await expectedBalance(zero);
			await expectedL2Balance(zero);
		});
	});

	describe("Edge cases", async () => {
		beforeEach(async () => {
			accToke.connect(deployer);
			await takeSnapshot();
		});
		afterEach(async () => await restoreSnapshot());

		it("lock pushed out  in rollover", async () => {
			await setIsInRollover(true);
			await lockToke(maxLockCycles, tokeAmount);
			await setCurrentCycle(maxLockCycleID);
			await expect(requestWithdrawal(tokeAmount)).to.be.revertedWith("INVALID_CYCLE_FOR_WITHDRAWAL_REQUEST");
			await advanceLockCycle();
			await requestWithdrawal(tokeAmount);
			await advanceLockCycle(2);
			await withdraw(tokeAmount);
			await expectedBalance(zero);
		});

		it("unlock pushed out when requested in rollover", async () => {
			await lockToke(maxLockCycles, tokeAmount);
			await setCurrentCycle(maxLockCycleID);
			await setIsInRollover(true);
			await requestWithdrawal(tokeAmount);
			await setCurrentCycle(maxLockCycleID.add(1));
			await expect(withdrawRequest(tokeAmount)).to.be.revertedWith("WITHDRAWAL_NOT_YET_AVAILABLE");
			await advanceLockCycle();
			await withdraw(tokeAmount);
			await expectedBalance(zero);
		});

		it("blocked from shorter timeframe", async () => {
			await lockToke(maxLockCycles / 2, tokeAmount);
			await setCurrentCycle(minLockCycleID.add(1));
			await expect(lockTokeRequest(tokeAmount, minLockCycles)).to.be.revertedWith(
				"LOCK_LENGTH_MUST_BE_GTE_EXISTING"
			);
			await expectedBalance(tokeAmount);
		});

		it("longer timeframe allowed", async () => {
			await lockToke(minLockCycles, tokeAmount.mul(2));
			await advanceLockCycle();
			await lockToke(minLockCycles * 2, tokeAmount);
			await advanceLockCycle(minLockCycles * 2);
			await requestWithdrawal(tokeAmount.mul(3));
			await advanceLockCycle();
			await withdraw(tokeAmount.mul(3));
			await expectedBalance(zero);
		});

		it("single lock duration per user", async () => {
			await lockToke(2, tokeAmount.mul(2));
			await advanceLockCycle();
			await lockToke(4, tokeAmount);
			await advanceLockCycle();
			// try the first lock (should fail)
			await expect(requestWithdrawalRequest(tokeAmount.mul(2))).to.be.revertedWith(
				"INVALID_CYCLE_FOR_WITHDRAWAL_REQUEST"
			);
			// move to 2nd, and try that one (should be able to do the whole amount)
			await advanceLockCycle(3);
			await requestWithdrawal(tokeAmount.mul(3));
			await expectedBalance(tokeAmount.mul(3));
		});

		it("partial withdrawal", async () => {
			await lockToke(maxLockCycles, tokeAmount.mul(4));
			await setCurrentCycle(maxLockCycleID);
			await requestWithdrawal(tokeAmount);
			await setCurrentCycle(maxLockCycleID.add(1));
			await withdraw(tokeAmount);
			await expectedBalance(tokeAmount.mul(3));
		});

		it("stale withdrawal request", async () => {
			await lockToke(maxLockCycles, tokeAmount.mul(4));
			await setCurrentCycle(maxLockCycleID);
			await requestWithdrawal(tokeAmount);
			await advanceLockCycle(3); // past first available lock cycle
			await withdraw(tokeAmount);
		});

		it("withdrawal request gap and re-deposit", async () => {
			await lockToke(4, tokeAmount.mul(4));
			await advanceLockCycle(4);
			await requestWithdrawal(tokeAmount.mul(2));
			await advanceLockCycle(2);
			await lockToke(4, tokeAmount.mul(3));
			await advanceLockCycle();
			await withdraw(tokeAmount.mul(2));
			await advanceLockCycle(3);
			await requestWithdrawal(tokeAmount.mul(5));
			await advanceLockCycle();
			await withdraw(tokeAmount.mul(5));
		});

		it("multiple withdrawal requests", async () => {
			await lockToke(maxLockCycles, tokeAmount.mul(10));
			await setCurrentCycle(maxLockCycleID);
			await requestWithdrawal(tokeAmount);
			await requestWithdrawal(tokeAmount.mul(3));
			await requestWithdrawal(tokeAmount.mul(2));
			await advanceLockCycle();
			await expect(withdrawRequest(tokeAmount.mul(3))).to.be.revertedWith("AMOUNT_GT_MAX_WITHDRAWAL");
			await withdraw(tokeAmount.mul(2));
		});
	});

	describe("Misc getter tests", () => {
		beforeEach(async () => {
			accToke.connect(deployer);
			await takeSnapshot();
		});
		afterEach(async () => await restoreSnapshot());

		it("minLockCycles", async () => {
			await accToke.setMinLockCycles(3);
			expect(await accToke.minLockCycles()).to.equal(3);
		});

		it("maxLockCycles", async () => {
			await accToke.setMaxLockCycles(5);
			expect(await accToke.maxLockCycles()).to.equal(5);
		});

		it("maxCap", async () => {
			await accToke.setMaxCap(1000);
			expect(await accToke.maxCap()).to.equal(1000);
		});

		// NOTE: the two tests below still figuring out proper return matching
		// 		it("getDepositInfo", async () => {
		// 			await lockToke(2, tokeAmount);
		// 			console.log('depositInfo: ', await accToke.getDepositInfo(deployer.address));
		// 			expect(await accToke.getDepositInfo(deployer.address)).to.deep.equal([
		// 				minLockCycleID,
		// 				2,
		// 				tokeAmount]);
		// 		});
		//
		// 		it("getWithdrawalInfo", async () => {
		// 			await lockToke(2, tokeAmount);
		// 			await advanceLockCycle();
		// 			await requestWithdrawal(tokeAmount);
		// 			console.log('withdrawalInfo: ', await accToke.getWithdrawalInfo(deployer.address));
		// 			expect(await accToke.getWithdrawalInfo(deployer.address)).to.deep.equal([
		// 				minLockCycleID.add(3),
		// 				tokeAmount
		// 			]);
		// 		});

		it("name", async () => {
			expect(await accToke.name()).to.be.eq("accTOKE");
		});

		it("symbol", async () => {
			expect(await accToke.symbol()).to.be.eq("accTOKE");
		});

		it("decimals", async () => {
			expect(await accToke.decimals()).to.be.eq(18);
		});

		it("totalSupply", async () => {
			await lockToke(maxLockCycles, tokeAmount);
			expect(await accToke.totalSupply()).to.eq(tokeAmount);
		});
	});

	//////////////////////////////////////
	//
	//  Helper functions
	//

	const setCurrentCycle = async (cycle: BigNumber) => {
		await manager.mock.getCurrentCycleIndex.returns(cycle);
	};

	const advanceLockCycle = async (numCycles = 1) => {
		const currentLockCycle = await accToke.getCurrentCycleID();
		await setCurrentCycle(currentLockCycle.add(numCycles));
	};

	const setIsInRollover = async (inRollover: boolean) => {
		await manager.mock.getRolloverStatus.returns(inRollover);
	};

	// helper function to prepare for unlock/relock tests by providing locked toke
	async function lockToke(numLockCycles = maxLockCycles, amount = tokeAmount, user = deployer) {
		// record prev amount
		const prevTokeAmount = await toke.balanceOf(user.address);
		const prevAccTokeAmount = await accToke.balanceOf(user.address);
		const l2BalanceBefore = await getL2Balance(user.address);

		// lock up for max duration
		let expectedLockCycleID = await accToke.getCurrentCycleID();
		if (await manager.getRolloverStatus()) expectedLockCycleID = expectedLockCycleID.add(1);

		await toke.connect(user).approve(accToke.address, amount);
		await expect(lockTokeRequest(amount, numLockCycles))
			.to.emit(accToke, "TokeLockedEvent")
			.withArgs(user.address, user.address, numLockCycles, expectedLockCycleID, amount);

		// transfer msg
		await _forwardL2Message();

		// verify that the balance moved to target cycle
		expect(await toke.balanceOf(user.address)).to.be.eq(prevTokeAmount.sub(amount));
		expect(await accToke.balanceOf(user.address)).to.be.eq(prevAccTokeAmount.add(amount));
		expect(await getL2Balance(user.address)).to.be.eq(l2BalanceBefore.add(amount));
	}

	async function lockTokeRequest(amount = tokeAmount, numLockCycles = maxLockCycles, user = deployer) {
		return accToke.connect(user).lockToke(amount, numLockCycles);
	}

	async function requestWithdrawal(amount = tokeAmount, user = deployer) {
		// create request
		await expect(accToke.connect(user).requestWithdrawal(amount))
			.to.emit(accToke, "WithdrawalRequestedEvent")
			.withArgs(user.address, amount);
		//	 - transfer L2 updates
		await _forwardL2Message();
	}

	async function requestWithdrawalRequest(amount = tokeAmount, user = deployer) {
		return accToke.connect(user).requestWithdrawal(amount);
	}

	const withdraw = async (amount = tokeAmount, user = deployer) => {
		await expect(withdrawRequest(amount, user)).to.emit(accToke, "WithdrawalEvent").withArgs(user.address, amount);
	};

	const withdrawRequest = async (amount = tokeAmount, user = deployer) => {
		return accToke.connect(user).withdraw(amount);
	};

	const expectedBalance = async (amount: BigNumber, user = deployer) => {
		const balanceOf = await accToke.connect(user).balanceOf(user.address);
		expect(balanceOf).to.eq(amount);
	};
	const expectedL2Balance = async (amount: BigNumber, user = deployer) => {
		const balanceOf = await getL2Balance(user.address);
		expect(balanceOf).to.eq(amount);
	};

	async function _forwardL2Message() {
		// forward msg to l2
		await polygonChain.transferEvent(startingBlock);
		//Get a new block so we can be sure the next command in the only event in there
		await ethers.provider.send("evm_mine", []);
		startingBlock = (await ethers.provider.getBlock("latest")).number;
	}
	//
	// 	async function getL2Balances(address: string, cycleIDs: BigNumber[]) {
	// 		const l2Balances = [];
	// 		for (let i = 0; i < cycleIDs.length; i++) {
	// 			l2Balances.push(await getL2Balance(address, cycleIDs[i]));
	// 		}
	// 		return l2Balances;
	// 	}
	async function getL2Balance(address: string) {
		const l2Balance = (await balanceTracker.getBalance(address, [accToke.address]))[0].amount;

		return l2Balance;
	}
});
