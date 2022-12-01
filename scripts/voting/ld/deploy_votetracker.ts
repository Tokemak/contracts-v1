import { BigNumberish } from "ethers";
import { ethers, upgrades, run } from "hardhat";
import dotenv from "dotenv";
import {
	BalanceTracker__factory,
	EventProxy,
	TransparentUpgradeableProxy__factory,
	VoteTracker__factory,
} from "../../../typechain";
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
	const EVENT_PROXY = getContractAddress(Environment.MAINNET, Contract.EVENT_PROXY);
	const BALANCE_TRACKER = getContractAddress(Environment.MAINNET, Contract.BALANCE_TRACKER);
	const CHAIN_ID = 1;

	const VERIFY = true;

	const initialVoteSession: string = ethers.utils.formatBytes32String("1");

	const [deployer] = await ethers.getSigners();

	console.log(`Event Proxy: ${EVENT_PROXY}`);
	console.log(`Balance Tracker: ${BALANCE_TRACKER}`);

	const voteMultipliers = [getTokenMultiplier(TTOKE_ADDRESS, 1)];

	// const voteTrackerFactory = await ethers.getContractFactory("VoteTracker");
	// const voteTrackerImplementation = await voteTrackerFactory.deploy();
	// await voteTrackerImplementation.deployed();
	// const voteTrackerInit = await voteTrackerImplementation
	//   .connect(deployer)
	//   .initialize(
	//     EVENT_PROXY,
	//     initialVoteSession,
	//     BALANCE_TRACKER,
	//     CHAIN_ID,
	//     voteMultipliers
	//   );
	// await voteTrackerInit.wait(5);

	const voteTrackerImpl = "0xbe217C0466e3CCC5a15e4d01da20A0dfe4c7A1eE";
	// console.log(`Vote Tracker Impl: ${voteTrackerImpl}`);

	// //Setup Proxy
	const voteTrackerInterface = VoteTracker__factory.createInterface();
	const voteTrackerInitializedata = voteTrackerInterface.encodeFunctionData("initialize", [
		EVENT_PROXY,
		initialVoteSession,
		BALANCE_TRACKER,
		CHAIN_ID,
		voteMultipliers,
	]);
	// const proxyFactory = new TransparentUpgradeableProxy__factory(deployer);
	// const voteTracker = await proxyFactory.deploy(
	//   voteTrackerImpl,
	//   PROXY_ADMIN,
	//   voteTrackerInitializedata
	// );
	// await voteTracker.deployed();

	const voteTrackerAddress = getContractAddress(Environment.MAINNET, Contract.VOTE_TRACKER_LD);
	// console.log(`Vote Tracker: ${voteTrackerAddress}`);

	// await new Promise((r) => setTimeout(r, 45000));

	if (VERIFY) {
		await run("verify:verify", {
			address: voteTrackerImpl,
			constructorArguments: [],
			contract: "contracts/vote/VoteTracker.sol:VoteTracker",
		});
	}

	if (VERIFY) {
		await run("verify:verify", {
			address: voteTrackerAddress,
			constructorArguments: [voteTrackerImpl, PROXY_ADMIN, voteTrackerInitializedata],
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
