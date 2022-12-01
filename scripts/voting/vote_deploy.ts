import { BigNumberish } from "ethers";
import { ethers, upgrades, run } from "hardhat";
import dotenv from "dotenv";
import {
	BalanceTracker__factory,
	EventProxy,
	TransparentUpgradeableProxy__factory,
	VoteTracker__factory,
} from "../../typechain";
import { Contract, getContractAddress, Environment } from "utils/config";

dotenv.config();

const main = async () => {
	//Testnet
	// const FX_PORTAL_CHILD_ADDRESS = getContractAddress(Environment.GOERLI, Contract.FX_CHILD); //Mumbai
	// const TTOKE_ADDRESS = "0xa20Ec9554CD4C2d4594ECb7fa0138aBD4Ec8bbb4"; //Goerli
	// const PROXY_ADMIN = getContractAddress(Environment.GOERLI, Contract.PROXY_ADMIN_POLYGON);

	//Mainnet
	const FX_PORTAL_CHILD_ADDRESS = getContractAddress(Environment.MAINNET, Contract.FX_CHILD); //Polygon
	const TTOKE_ADDRESS = getContractAddress(Environment.MAINNET, Contract.TOKE_POOL); //Mainnet
	const PROXY_ADMIN = getContractAddress(Environment.MAINNET, Contract.PROXY_ADMIN_POLYGON); //Polygon

	const VERIFY = true;

	const initialVoteSession: string = ethers.utils.formatBytes32String("1");

	const [deployer] = await ethers.getSigners();

	// const eventProxyFactory = await ethers.getContractFactory("EventProxy");
	// const eventProxy = (await upgrades.deployProxy(eventProxyFactory, [
	//   FX_PORTAL_CHILD_ADDRESS,
	// ])) as EventProxy;
	// await eventProxy.deployed();

	// if (VERIFY) {
	//   await run("verify:verify", {
	//     address: eventProxy.address,
	//     constructorArguments: [FX_PORTAL_CHILD_ADDRESS],
	//     contract: "contracts/event-proxy/EventProxy.sol:EventProxy",
	//   });
	// }

	//const eventProxyAddress = getContractAddress(Environment.GOERLI, Contract.EVENT_PROXY); //Goerli
	const eventProxyAddress = getContractAddress(Environment.MAINNET, Contract.EVENT_PROXY); //Mainnet

	console.log(`Event Proxy: ${eventProxyAddress}`);

	const balanceTrackerFactory = await ethers.getContractFactory("BalanceTracker");

	//Deploy BalanceTracker implementation
	// const balanceTrackerImplementation = await balanceTrackerFactory.deploy();
	// await balanceTrackerImplementation.deployed();
	// const balTrackerInit = await balanceTrackerImplementation
	//   .connect(deployer)
	//   .initialize(eventProxyAddress);
	// await balTrackerInit.wait(5);

	// const balanceTrackerImplAddress = balanceTrackerImplementation.address;
	// console.log(`Balance Tracker Implementation: ${balanceTrackerImplAddress}`);

	// if (VERIFY) {
	//   await run("verify:verify", {
	//     address: balanceTrackerImplAddress,
	//     constructorArguments: [],
	//     contract: "contracts/balance-tracker/BalanceTracker.sol:BalanceTracker",
	//   });
	// }

	//Deploy BalanceTracker Proxy
	// const balanceTrackerInterface = BalanceTracker__factory.createInterface();
	// const balanceTrackerInitializeData =
	//   balanceTrackerInterface.encodeFunctionData("initialize", [
	//     eventProxyAddress,
	//   ]);
	// const proxyFactory = new TransparentUpgradeableProxy__factory(deployer);
	// const balanceTracker = await proxyFactory.deploy(
	//   balanceTrackerImplAddress,
	//   PROXY_ADMIN,
	//   balanceTrackerInitializeData
	// );
	// await balanceTracker.deployed();

	const balanceTrackerAddress = getContractAddress(Environment.MAINNET, Contract.BALANCE_TRACKER);
	console.log(`Balance Tracker: ${balanceTrackerAddress}`);

	// await new Promise((r) => setTimeout(r, 45000));

	// if (VERIFY) {
	//   await run("verify:verify", {
	//     address: balanceTrackerAddress,
	//     constructorArguments: [
	//       balanceTrackerImplAddress,
	//       PROXY_ADMIN,
	//       balanceTrackerInitializeData,
	//     ],
	//     contract:
	//       "@openzeppelin/contracts/proxy/TransparentUpgradeableProxy.sol:TransparentUpgradeableProxy",
	//   });
	// }

	const voteMultipliers = [getTokenMultiplier(TTOKE_ADDRESS, 1)];

	// const voteTrackerFactory = await ethers.getContractFactory("VoteTracker");
	// const voteTrackerImplementation = await voteTrackerFactory.deploy();
	// await voteTrackerImplementation.deployed();
	// const voteTrackerInit = await voteTrackerImplementation
	//   .connect(deployer)
	//   .initialize(
	//     eventProxyAddress,
	//     initialVoteSession,
	//     balanceTrackerAddress,
	//     //5, //Goerli
	//     1, //Mainnet
	//     voteMultipliers
	//   );
	// await voteTrackerInit.wait(5);

	const voteTrackerImplAddress = "0x9635D82De3659D57c2e7337D61e18B6081670D28";

	// console.log(`Vote Tracker Impl: ${voteTrackerImplAddress}`);

	// await new Promise((r) => setTimeout(r, 45000));

	// if (VERIFY) {
	//   await run("verify:verify", {
	//     address: voteTrackerImplAddress,
	//     constructorArguments: [],
	//     contract: "contracts/vote/VoteTracker.sol:VoteTracker",
	//   });
	// }

	const voteTrackerInterface = VoteTracker__factory.createInterface();
	const voteTrackerInitializedata = voteTrackerInterface.encodeFunctionData("initialize", [
		eventProxyAddress,
		initialVoteSession,
		balanceTrackerAddress,
		//5, //Goerli
		1, //Mainnet
		voteMultipliers,
	]);
	// const voteTracker = await proxyFactory.deploy(
	//   voteTrackerImplAddress,
	//   PROXY_ADMIN,
	//   voteTrackerInitializedata
	// );
	// await voteTracker.deployed();

	// const voteTrackerAddress = voteTracker.address;
	// console.log(`Vote Tracker: ${voteTrackerAddress}`);

	// await new Promise((r) => setTimeout(r, 45000));

	if (VERIFY) {
		await run("verify:verify", {
			address: getContractAddress(Environment.MAINNET, Contract.VOTE_TRACKER_CORE),
			constructorArguments: [voteTrackerImplAddress, PROXY_ADMIN, voteTrackerInitializedata],
			contract: "@openzeppelin/contracts/proxy/TransparentUpgradeableProxy.sol:TransparentUpgradeableProxy",
		});
	}
};

const getTokenMultiplier = (tokenAddress: string, multiplier: number): VoteTokenMultiplier => {
	return {
		token: tokenAddress,
		multiplier: ethers.utils.parseUnits(multiplier.toString(), 18),
	};
};

type VoteTokenMultiplier = {
	token: string;
	multiplier: BigNumberish;
};

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});
