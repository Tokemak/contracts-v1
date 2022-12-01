import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { artifacts, ethers, network } from "hardhat";
import { expect } from "chai";
import { ERC20, EthPool, Manager, Pool, ProxyAdmin, TransparentUpgradeableProxy } from "../typechain";
import timeMachine from "ganache-time-traveler";
import { ContractTransaction } from "@ethersproject/contracts";
import { deployMockContract } from "ethereum-waffle";
import { getContractAddress, Environment, Contract, getWhaleAddress } from "utils/config";

const ETH_POOL_ADDRESS = getContractAddress(Environment.MAINNET, Contract.WETH_POOL);
const USDC_POOL_ADDRESS = getContractAddress(Environment.MAINNET, Contract.USDC_POOL);
const PROXY_ADMIN_ADDRESS = getContractAddress(Environment.MAINNET, Contract.PROXY_ADMIN);
const WETH_ADDRESS = getContractAddress(Environment.MAINNET, Contract.WETH);
const USDC_ADDRESS = getContractAddress(Environment.MAINNET, Contract.USDC);
const MANAGER_ADDRESS = getContractAddress(Environment.MAINNET, Contract.MANAGER);
const WETH_WHALE = getWhaleAddress(Environment.MAINNET, Contract.WETH);
const USDC_WHALE = getWhaleAddress(Environment.MAINNET, Contract.USDC);
const COORDINATOR = getContractAddress(Environment.MAINNET, Contract.DEV_COORDINATOR_MULTISIG);
const ETH_WHALE = getWhaleAddress(Environment.MAINNET, Contract.ETH);
const DEVCOORDINATOR_ADDRESS = getContractAddress(Environment.MAINNET, Contract.DEV_COORDINATOR_MULTISIG);

const MAX_UINT = ethers.constants.MaxUint256;
const ZERO_ADDRESS = ethers.constants.AddressZero;

const poolArtifact = artifacts.require("Pool");
const erc20Artifact = artifacts.require("@openzeppelin/contracts/token/ERC20/ERC20.sol:ERC20");
const ethPoolArtifact = artifacts.require("EthPool");
const managerArtifact = artifacts.require("Manager");
const proxyAdminArtifact = artifacts.require("ProxyAdmin");

let devCoordinator: any; // Cannot find type for wallet? Should just be Wallet based on ethers code
let user1: SignerWithAddress;
let user2: SignerWithAddress;
let user3: SignerWithAddress;
let user4: SignerWithAddress;
let coordinator: SignerWithAddress;
let wethWhale: SignerWithAddress;
let usdcWhale: SignerWithAddress;
let ethWhale: SignerWithAddress;
let proxyAdmin: ProxyAdmin;
let ethPoolLogic: EthPool;
let poolLogic: Pool;
let ethPool: TransparentUpgradeableProxy & EthPool;
let pool: TransparentUpgradeableProxy & Pool;
let usdc: ERC20;
let weth: ERC20;
let manager: Manager;
let snapshotId: string;

describe("Pool upgraded implementation tests", () => {
	before(async () => {
		await network.provider.request({
			method: "hardhat_impersonateAccount",
			params: [DEVCOORDINATOR_ADDRESS],
		});
		devCoordinator = await ethers.getSigner(DEVCOORDINATOR_ADDRESS);
		[user1, user2, user3, user4] = await ethers.getSigners();

		let etherBal = ethers.utils.parseEther(`500000`).toHexString();
		if (etherBal.startsWith("0x0")) etherBal = "0x" + etherBal.substring(3);

		await ethers.provider.send("hardhat_setBalance", [DEVCOORDINATOR_ADDRESS, etherBal]);

		wethWhale = await impersonateAccount(WETH_WHALE);
		usdcWhale = await impersonateAccount(USDC_WHALE);
		coordinator = await impersonateAccount(COORDINATOR);
		ethWhale = await impersonateAccount(ETH_WHALE);

		const addressRegistryArtifact = artifacts.require("AddressRegistry");
		const addressRegistry = await deployMockContract(coordinator, addressRegistryArtifact.abi);
		await addressRegistry.mock.weth.returns(WETH_ADDRESS);

		// Condense these five
		proxyAdmin = (await getContract(proxyAdminArtifact.abi, PROXY_ADMIN_ADDRESS, devCoordinator)) as ProxyAdmin;
		ethPool = (await getContract(ethPoolArtifact.abi, ETH_POOL_ADDRESS)) as TransparentUpgradeableProxy & EthPool;
		pool = (await getContract(poolArtifact.abi, USDC_POOL_ADDRESS)) as TransparentUpgradeableProxy & Pool;
		weth = (await getContract(erc20Artifact.abi, WETH_ADDRESS)) as ERC20;
		usdc = (await getContract(erc20Artifact.abi, USDC_ADDRESS)) as ERC20;
		manager = (await getContract(managerArtifact.abi, MANAGER_ADDRESS)) as Manager;

		const ethPoolFactory = await ethers.getContractFactory("EthPool");
		const poolFactory = await ethers.getContractFactory("Pool");

		ethPoolLogic = await ethPoolFactory.deploy();
		poolLogic = await poolFactory.deploy();
		await ethPoolLogic.deployed();
		await poolLogic.deployed();

		await proxyAdmin.connect(devCoordinator).upgrade(ethPool.address, ethPoolLogic.address);
		await proxyAdmin.connect(devCoordinator).upgrade(pool.address, poolLogic.address);

		await weth.connect(wethWhale).transfer(user2.address, 1000);
		await usdc.connect(usdcWhale).transfer(user2.address, 1000);
		await weth.connect(user2).approve(ethPool.address, MAX_UINT);
		await usdc.connect(user2).approve(pool.address, MAX_UINT);
		await ethWhale.sendTransaction({
			to: coordinator.address,
			value: parseEther(2),
		});
		await manager.connect(coordinator).setCycleDuration(120);
	});

	beforeEach(async () => {
		const snapshot = await timeMachine.takeSnapshot();
		snapshotId = snapshot["result"];
	});

	afterEach(async () => {
		await timeMachine.revertToSnapshot(snapshotId);
	});

	it("Check implementation addresses", async () => {
		const ethPoolImplementation = await proxyAdmin.getProxyImplementation(ethPool.address);
		const poolImplementation = await proxyAdmin.getProxyImplementation(pool.address);

		expect(ethPoolImplementation).to.equal(ethPoolLogic.address);
		expect(poolImplementation).to.equal(poolLogic.address);
	});

	describe("Testing deposits on both pools", () => {
		before(async () => {
			await usdc.connect(user2).approve(pool.address, MAX_UINT);
			await weth.connect(user2).approve(ethPool.address, MAX_UINT);
		});

		it("Balances are correct after deposit into pools", async () => {
			await ethPool.connect(user2).deposit(10);
			await pool.connect(user2).deposit(20);

			const user1EthPoolBalance = await ethPool.balanceOf(user2.address);
			const user1PoolBalance = await pool.balanceOf(user2.address);

			expect(user1EthPoolBalance).to.equal(10);
			expect(user1PoolBalance).to.equal(20);
		});

		it("Correct events are emitted on deposit", async () => {
			const txEth = await ethPool.connect(user2).deposit(10);
			const txPool = await pool.connect(user2).deposit(20);
			const receiptEth = await txEth.wait();
			const receiptPool = await txPool.wait();

			const eventEth = receiptEth.events![0];
			const eventPool = receiptPool.events![0];

			expect(eventEth!.event).to.equal("Transfer");
			expect(eventEth.args!.from).to.equal(ZERO_ADDRESS);
			expect(eventEth.args!.to).to.equal(user2.address);
			expect(eventEth.args!.value).to.equal(10);
			expect(eventPool!.event).to.equal("Transfer");
			expect(eventPool.args!.from).to.equal(ZERO_ADDRESS);
			expect(eventPool.args!.to).to.equal(user2.address);
			expect(eventPool.args!.value).to.equal(20);
		});
	});

	// Testing added event
	describe("Testing withdrawal request", async () => {
		it("Correct event emitted", async () => {
			await ethPool.connect(user2).deposit(10);
			await pool.connect(user2).deposit(20);
			const txEth = await ethPool.connect(user2).requestWithdrawal(3);
			const txPool = await pool.connect(user2).requestWithdrawal(13);
			const receiptEth = await txEth.wait();
			const receiptPool = await txPool.wait();

			const eventEth = receiptEth.events![0];
			const eventPool = receiptPool.events![0];

			expect(eventEth!.event).to.equal("WithdrawalRequested");
			expect(eventEth.args!.requestor).to.equal(user2.address);
			expect(eventEth.args!.amount).to.equal(3);
			expect(eventPool!.event).to.equal("WithdrawalRequested");
			expect(eventPool.args!.requestor).to.equal(user2.address);
			expect(eventPool.args!.amount).to.equal(13);
		});
	});

	describe("Testing withdrawals", async () => {
		before(async () => {
			await ethPool.connect(user2).deposit(10);
			await pool.connect(user2).deposit(20);
			await ethPool.connect(user2).requestWithdrawal(3);
			await pool.connect(user2).requestWithdrawal(12);

			await executeRollover();
		});

		it("Correct balances on withdrawal", async () => {
			await ethPool.connect(user2).withdraw(3, false);
			await pool.connect(user2).withdraw(12);

			const user1EthPoolBalance = await ethPool.balanceOf(user2.address);
			const user1PoolBalance = await pool.balanceOf(user2.address);

			expect(user1EthPoolBalance).to.equal(7);
			expect(user1PoolBalance).to.equal(8);
		});

		it("Emits event with correct args", async () => {
			const txEth = await ethPool.connect(user2).withdraw(3, false);
			const txPool = await pool.connect(user2).withdraw(12);
			const receiptEth = await txEth.wait();
			const receiptPool = await txPool.wait();

			const eventEth = receiptEth.events![0];
			const eventPool = receiptPool.events![0];

			expect(eventEth!.event).to.equal("Transfer");
			expect(eventEth.args!.from).to.equal(user2.address);
			expect(eventEth.args!.to).to.equal(ZERO_ADDRESS);
			expect(eventEth.args!.value).to.equal(3);
			expect(eventPool!.event).to.equal("Transfer");
			expect(eventPool.args!.from).to.equal(user2.address);
			expect(eventPool.args!.to).to.equal(ZERO_ADDRESS);
			expect(eventPool.args!.value).to.equal(12);
		});
	});

	describe("Testing transfers", () => {
		before(async () => {
			// Gets rid of leftover balance
			const user1EthPoolBalance = await ethPool.balanceOf(user2.address);
			const user1PoolBalance = await pool.balanceOf(user2.address);
			await ethPool.connect(user2).transfer(COORDINATOR, user1EthPoolBalance);
			await pool.connect(user2).transfer(COORDINATOR, user1PoolBalance);

			await ethPool.connect(user2).deposit(10);
			await pool.connect(user2).deposit(20);
		});

		it("Correct balances for transfer", async () => {
			await ethPool.connect(user2).transfer(user3.address, 4);
			await pool.connect(user2).transfer(user3.address, 6);

			expect(await ethPool.balanceOf(user2.address)).to.equal(6);
			expect(await ethPool.balanceOf(user3.address)).to.equal(4);
			expect(await pool.balanceOf(user2.address)).to.equal(14);
			expect(await pool.balanceOf(user3.address)).to.equal(6);
		});

		it("Emits event with correct args", async () => {
			const txEth = await ethPool.connect(user2).transfer(user3.address, 3);
			const txPool = await pool.connect(user2).transfer(user3.address, 4);
			const receiptEth = await txEth.wait();
			const receiptPool = await txPool.wait();

			const eventEth = receiptEth.events![0];
			const eventPool = receiptPool.events![0];

			expect(eventEth!.event).to.equal("Transfer");
			expect(eventEth.args!.from).to.equal(user2.address);
			expect(eventEth.args!.to).to.equal(user3.address);
			expect(eventEth.args!.value).to.equal(3);
			expect(eventPool!.event).to.equal("Transfer");
			expect(eventPool.args!.from).to.equal(user2.address);
			expect(eventPool.args!.to).to.equal(user3.address);
			expect(eventPool.args!.value).to.equal(4);
		});
	});

	describe("Test transferFrom", () => {
		before(async () => {
			// Gets rid of leftover balance
			const user1EthPoolBalance = await ethPool.balanceOf(user2.address);
			const user1PoolBalance = await pool.balanceOf(user2.address);
			await ethPool.connect(user2).transfer(COORDINATOR, user1EthPoolBalance);
			await pool.connect(user2).transfer(COORDINATOR, user1PoolBalance);

			await ethPool.connect(user2).deposit(10);
			await pool.connect(user2).deposit(20);
			await ethPool.connect(user2).approve(user3.address, 10);
			await pool.connect(user2).approve(user3.address, 20);
		});

		it("Correct balances for transferFrom", async () => {
			await ethPool.connect(user3).transferFrom(user2.address, user4.address, 3);
			await pool.connect(user3).transferFrom(user2.address, user4.address, 12);

			expect(await ethPool.balanceOf(user2.address)).to.equal(7);
			expect(await ethPool.balanceOf(user3.address)).to.equal(0);
			expect(await ethPool.balanceOf(user4.address)).to.equal(3);
			expect(await pool.balanceOf(user2.address)).to.equal(8);
			expect(await pool.balanceOf(user3.address)).to.equal(0);
			expect(await pool.balanceOf(user4.address)).to.equal(12);
		});

		it("Emits event with correct args", async () => {
			const txEth = await ethPool.connect(user3).transferFrom(user2.address, user4.address, 4);
			const txPool = await pool.connect(user3).transferFrom(user2.address, user4.address, 5);
			const receiptEth = await txEth.wait();
			const receiptPool = await txPool.wait();

			const eventEth = receiptEth.events![0];
			const eventPool = receiptPool.events![0];

			expect(eventEth!.event).to.equal("Transfer");
			expect(eventEth.args!.from).to.equal(user2.address);
			expect(eventEth.args!.to).to.equal(user4.address);
			expect(eventEth.args!.value).to.equal(4);
			expect(eventPool!.event).to.equal("Transfer");
			expect(eventPool.args!.from).to.equal(user2.address);
			expect(eventPool.args!.to).to.equal(user4.address);
			expect(eventPool.args!.value).to.equal(5);
		});
	});
});

const impersonateAccount = async (address: string) => {
	await network.provider.request({
		method: "hardhat_impersonateAccount",
		params: [address],
	});

	let etherBal = ethers.utils.parseEther(`500000`).toHexString();
	if (etherBal.startsWith("0x0")) etherBal = "0x" + etherBal.substring(3);

	await ethers.provider.send("hardhat_setBalance", [address, etherBal]);
	return await ethers.getSigner(address);
};

const executeRollover = async (): Promise<ContractTransaction> => {
	const [nextCycleStartTime] = await Promise.all([manager.nextCycleStartTime()]);

	const nextTimestamp = nextCycleStartTime.toNumber();
	const now = Date.now();
	await timeMachine.advanceTime(Math.abs(nextTimestamp - now) + 10000);
	await timeMachine.advanceBlock();

	const rolloverRole = await manager.ROLLOVER_ROLE();
	const rolloverAccount = await manager.getRoleMember(rolloverRole, 0);
	const signer = await impersonateAccount(rolloverAccount);

	return await manager.connect(signer).completeRollover("hashyhashhash");
};

const parseEther = (ether: number) => {
	return ethers.utils.parseEther(ether.toString());
};

const getContract = async (abi: string, address: string, signer?: SignerWithAddress | undefined) => {
	return await ethers.getContractAt(abi, address, signer);
};
