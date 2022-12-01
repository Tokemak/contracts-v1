import { ethers, run, artifacts } from "hardhat";
import dotenv from "dotenv";
import { ProxyAdmin } from "../../typechain";
import { getContractAddress, Environment, Contract } from "utils/config";

dotenv.config();

const proxyAdminArtifact = artifacts.require("ProxyAdmin");

function getTokens() {
	const isTestNet = process.env.HARDHAT_NETWORK === "mumbai";
	return {
		TOKE_REACTOR: isTestNet
			? getContractAddress(Environment.GOERLI, Contract.TOKE_POOL)
			: getContractAddress(Environment.MAINNET, Contract.TOKE_POOL),
		UNI_LP_REACTOR: isTestNet
			? getContractAddress(Environment.GOERLI, Contract.UNI_POOL)
			: getContractAddress(Environment.MAINNET, Contract.UNI_POOL),
		SUSHI_LP_REACTOR: isTestNet
			? getContractAddress(Environment.GOERLI, Contract.SUSHI_POOL)
			: getContractAddress(Environment.MAINNET, Contract.SUSHI_POOL),
		PROXY_ADMIN_ADDRESS: isTestNet
			? getContractAddress(Environment.GOERLI, Contract.PROXY_ADMIN_POLYGON)
			: getContractAddress(Environment.MAINNET, Contract.PROXY_ADMIN_POLYGON),
		BALANCE_TRACKER: isTestNet
			? getContractAddress(Environment.GOERLI, Contract.BALANCE_TRACKER)
			: getContractAddress(Environment.MAINNET, Contract.BALANCE_TRACKER),
		STAKING: isTestNet
			? "0xD2b8798bE815a3Cee345dbDCCf263b96FAb0FD15" // goerli one matching mainnet is by design as per @codenutt
			: getContractAddress(Environment.MAINNET, Contract.STAKING),
	};
}

async function main() {
	const { TOKE_REACTOR, UNI_LP_REACTOR, SUSHI_LP_REACTOR, PROXY_ADMIN_ADDRESS, BALANCE_TRACKER, STAKING } =
		getTokens();
	const tokensToSupport = [TOKE_REACTOR, UNI_LP_REACTOR, SUSHI_LP_REACTOR, STAKING];

	const [deployer] = await ethers.getSigners();

	const proxyAdmin = (await ethers.getContractAt(
		proxyAdminArtifact.abi,
		PROXY_ADMIN_ADDRESS,
		deployer
	)) as unknown as ProxyAdmin;

	const balanceTrackerFactory = await ethers.getContractFactory("BalanceTracker");
	const balanceTrackerImplementation = await balanceTrackerFactory.deploy();
	await balanceTrackerImplementation.deployed();

	const balanceTrackerImplAddress = balanceTrackerImplementation.address;

	console.log(`Balance Tracker Impl: ${balanceTrackerImplAddress}`);

	await new Promise((r) => setTimeout(r, 45000));

	await run("verify:verify", {
		address: balanceTrackerImplAddress,
		constructorArguments: [],
		contract: "contracts/balance-tracker/BalanceTracker.sol:BalanceTracker",
	});

	const data = balanceTrackerFactory.interface.encodeFunctionData("addSupportedTokens(address[])", tokensToSupport);

	const tx = await proxyAdmin.connect(deployer).upgradeAndCall(BALANCE_TRACKER, balanceTrackerImplAddress, data);
	await tx.wait();
}

main();
