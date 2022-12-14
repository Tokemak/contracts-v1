// The purpose of this file is to directly test controllers, specifically the address registry
// functionality and the restricted calling functionality

import { ethers, artifacts, upgrades } from "hardhat";
import { expect } from "chai";
import { deployMockContract, MockContract } from "ethereum-waffle";
import {
	SushiswapControllerV1,
	SushiswapControllerV2,
	UniswapController,
	BalancerController,
	ZeroExController,
	AddressRegistry,
	TransparentUpgradeableProxy,
	IWallet__factory,
	TransferController,
	SushiswapControllerV1__factory,
	SushiswapControllerV2__factory,
	ConvexController,
	ConvexController__factory,
	PoolTransferController,
} from "../typechain";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { getContractAddress, Environment, Contract } from "utils/config";

const MANAGER = getContractAddress(Environment.MAINNET, Contract.MANAGER);
const UNISWAP_ROUTER = getContractAddress(Environment.MAINNET, Contract.UNI_ROUTER);
const UNISWAP_FACTORY = getContractAddress(Environment.MAINNET, Contract.UNI_FACTORY);
const SUSHI_ROUTER = getContractAddress(Environment.MAINNET, Contract.SUSHI_ROUTER);
const SUSHI_FACTORY = getContractAddress(Environment.MAINNET, Contract.SUSHI_FACTORY);
const MASTERCHEF = getContractAddress(Environment.MAINNET, Contract.MASTERCHEF_V1);
const MASTERCHEF_V2 = getContractAddress(Environment.MAINNET, Contract.MASTERCHEF_V2);
const LINK = getContractAddress(Environment.MAINNET, Contract.LINK);
const WETH = getContractAddress(Environment.MAINNET, Contract.WETH);
const ZERO_ADDRESS = ethers.constants.AddressZero;
const CONVEX_BOOSTER = getContractAddress(Environment.MAINNET, Contract.CONVEX_BOOSTER);

let deployer: SignerWithAddress;
let owner: SignerWithAddress;
let notManager: SignerWithAddress;
let to: SignerWithAddress;
let balancerPoolAddress: SignerWithAddress;
let unregisteredToken: SignerWithAddress;
let fundsToken: SignerWithAddress;
let treasury: SignerWithAddress;
let registry: AddressRegistry;
let accessControl: MockContract;
let registryLogic: AddressRegistry;
let uniController: UniswapController;
let sushiControllerV1: SushiswapControllerV1;
let sushiControllerV2: SushiswapControllerV2;
let balancerController: BalancerController;
let transferController: TransferController;
let zeroExController: ZeroExController;
let convexController: ConvexController;
let poolTransferController: PoolTransferController;

const ACCESS_CONTROL = artifacts.require("@openzeppelin/contracts/access/AccessControl.sol");

const wethAddress = getContractAddress(Environment.MAINNET, Contract.WETH);

describe("Test Controllers", () => {
	const notManagerRevertReason = "NOT_MANAGER_ADDRESS";

	before(async () => {
		[deployer, owner, notManager, to, balancerPoolAddress, unregisteredToken, treasury, fundsToken] =
			await ethers.getSigners();

		accessControl = await deployMockContract(deployer, ACCESS_CONTROL.abi);
		await accessControl.mock.hasRole.returns(true);

		const registryFactory = await ethers.getContractFactory("AddressRegistry");
		registry = (await upgrades.deployProxy(registryFactory, [], {
			constructorArgs: [getContractAddress(Environment.MAINNET, Contract.WETH)],
			unsafeAllow: ["state-variable-assignment", "state-variable-immutable", "constructor"],
		})) as AddressRegistry;
		await registry.deployed();

		const uniFactory = await ethers.getContractFactory("UniswapController");
		uniController = await uniFactory.deploy(
			UNISWAP_ROUTER,
			UNISWAP_FACTORY,
			deployer.address,
			accessControl.address,
			registry.address
		);
		await uniController.deployed();

		const sushiV1Factory = await ethers.getContractFactory("SushiswapControllerV1");
		sushiControllerV1 = await sushiV1Factory.deploy(
			SUSHI_ROUTER,
			SUSHI_FACTORY,
			MASTERCHEF,
			deployer.address,
			accessControl.address,
			registry.address,
			treasury.address
		);
		await sushiControllerV1.deployed();

		const sushiV2Factory = await ethers.getContractFactory("SushiswapControllerV2");
		sushiControllerV2 = await sushiV2Factory.deploy(
			SUSHI_ROUTER,
			SUSHI_FACTORY,
			MASTERCHEF_V2,
			deployer.address,
			accessControl.address,
			registry.address,
			treasury.address
		);
		await sushiControllerV2.deployed();

		const balancerFactory = await ethers.getContractFactory("BalancerController");
		balancerController = await balancerFactory.deploy(MANAGER, accessControl.address, registry.address);
		await balancerController.deployed();

		const wallet = IWallet__factory.connect(deployer.address, ethers.provider);

		const zeroExFactory = await ethers.getContractFactory("ZeroExController");
		zeroExController = await zeroExFactory.deploy(
			wallet.address,
			deployer.address,
			accessControl.address,
			registry.address
		);
		await zeroExController.deployed();

		const transferFactory = await ethers.getContractFactory("TransferController");
		transferController = await transferFactory.deploy(
			MANAGER,
			accessControl.address,
			registry.address,
			treasury.address
		);
		await transferController.deployed();

		await registry.connect(deployer).addToRegistry([LINK, WETH], 0);

		const convexFactory = (await ethers.getContractFactory("ConvexController")) as ConvexController__factory;
		convexController = await convexFactory.deploy(MANAGER, accessControl.address, registry.address, CONVEX_BOOSTER);

		const poolTransferFactory = await ethers.getContractFactory("PoolTransferController");
		poolTransferController = await poolTransferFactory.deploy(MANAGER, MANAGER, registry.address);
		await poolTransferController.deployed();
	});

	describe("Test call from non-manager address", () => {
		it("Rejects for all controllers", async () => {
			await expect(uniController.connect(notManager).deploy(uniData(LINK, WETH))).to.be.revertedWith(
				notManagerRevertReason
			);
			await expect(uniController.connect(notManager).withdraw(uniData(LINK, WETH))).to.be.revertedWith(
				notManagerRevertReason
			);
			await expect(
				sushiControllerV1.connect(notManager).deploy(LINK, WETH, 1, 1, 1, 1, to.address, 1, 1, false, false)
			).to.be.revertedWith(notManagerRevertReason);
			await expect(
				sushiControllerV1.connect(notManager).withdraw(LINK, WETH, 1, 1, 1, to.address, 1, 1, false)
			).to.be.revertedWith(notManagerRevertReason);
			await expect(
				sushiControllerV2.connect(notManager).deploy(LINK, WETH, 1, 1, 1, 1, to.address, 1, 1, false, false)
			).to.be.revertedWith(notManagerRevertReason);
			await expect(
				sushiControllerV1.connect(notManager).withdraw(LINK, WETH, 1, 1, 1, to.address, 1, 1, false)
			).to.be.revertedWith(notManagerRevertReason);
			await expect(
				balancerController
					.connect(notManager)
					.deploy(balancerPoolAddress.address, [LINK, WETH], [1, 1], balancerData())
			).to.be.revertedWith(notManagerRevertReason);
			await expect(
				balancerController.connect(notManager).withdraw(balancerPoolAddress.address, balancerData())
			).to.be.revertedWith(notManagerRevertReason);
			await expect(
				zeroExController.connect(notManager).deploy(zeroExData([LINK, WETH], [1, 1]))
			).to.be.revertedWith(notManagerRevertReason);
			await expect(
				zeroExController.connect(notManager).withdraw(zeroExData([LINK, WETH], [1, 1]))
			).to.be.revertedWith(notManagerRevertReason);
			await expect(
				transferController.connect(notManager).transferFunds(fundsToken.address, 10)
			).to.be.revertedWith(notManagerRevertReason);

			await expect(
				convexController.depositAndStake(ethers.constants.AddressZero, ethers.constants.AddressZero, 0, 1)
			).to.be.revertedWith(notManagerRevertReason);

			await expect(
				convexController.withdrawStake(ethers.constants.AddressZero, ethers.constants.AddressZero, 1)
			).to.be.revertedWith(notManagerRevertReason);

			await expect(convexController.claimRewards(ethers.constants.AddressZero, [])).to.be.revertedWith(
				notManagerRevertReason
			);

			await expect(poolTransferController.connect(notManager).transferToPool([LINK], [80])).to.be.revertedWith(
				notManagerRevertReason
			);
		});
	});

	describe("Testing zero address for Sushi controllers", () => {
		let sushiV1: SushiswapControllerV1__factory;
		let sushiV2: SushiswapControllerV2__factory;

		beforeEach(async () => {
			sushiV1 = await ethers.getContractFactory("SushiswapControllerV1");
			sushiV2 = await ethers.getContractFactory("SushiswapControllerV2");
		});

		it("Reverts on masterchef address being zero address on construction", async () => {
			await expect(
				sushiV1.deploy(
					SUSHI_ROUTER,
					SUSHI_FACTORY,
					ZERO_ADDRESS,
					MANAGER,
					accessControl.address,
					registry.address,
					treasury.address
				)
			).to.be.revertedWith("INVALID_MASTERCHEF");

			await expect(
				sushiV2.deploy(
					SUSHI_ROUTER,
					SUSHI_FACTORY,
					ZERO_ADDRESS,
					MANAGER,
					accessControl.address,
					registry.address,
					treasury.address
				)
			).to.be.revertedWith("INVALID_MASTERCHEF");
		});
	});
});

// Contract data
const uniData = (tokenA: string, tokenB: string): string => {
	return ethers.utils.defaultAbiCoder.encode(
		["string", "string", "uint", "uint", "uint", "uint", "string", "uint"],
		[tokenA, tokenB, 1, 1, 1, 1, to.address, 1]
	);
};

const sushiData = (tokenA: string, tokenB: string): string => {
	return ethers.utils.defaultAbiCoder.encode(
		["string", "string", "uint", "uint", "uint", "uint", "string", "uint", "uint", "bool"],
		[tokenA, tokenB, 1, 1, 1, 1, to.address, 1, 1, false]
	);
};

const zeroExData = (tokens: string[], amounts: number[]): string => {
	return ethers.utils.defaultAbiCoder.encode(["string[]", "uint256[]"], [tokens, amounts]);
};

const balancerData = (): string => {
	return ethers.utils.defaultAbiCoder.encode(["uint256", "uint256[]"], [1, [1, 1]]);
};
