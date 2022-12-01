import { BigNumberish } from "ethers";
import { ethers, upgrades, run, artifacts } from "hardhat";
import dotenv from "dotenv";
import { ProxyAdmin } from "../../typechain";
import {
	Contract,
	Environment,
	getContractAddress,
	getStakingNotionalAddress,
	StakingScheduleType,
} from "utils/config";

dotenv.config();

const proxyAdminArtifact = artifacts.require("ProxyAdmin");

async function main() {
	const ENV = Environment.MAINNET;

	const PROXY_ADMIN_ADDRESS = getContractAddress(ENV, Contract.PROXY_ADMIN);
	const CONTRACT_NAME = "Staking";
	const FILE_PATH = "contracts/staking/Staking.sol:Staking";
	const VERIFY = false;

	const TOKE = getContractAddress(ENV, Contract.TOKE);
	const MANAGER = getContractAddress(ENV, Contract.MANAGER);
	const STAKING = getContractAddress(ENV, Contract.STAKING);
	const TREASURY = getContractAddress(ENV, Contract.TREASURY);
	const SCHEDULE_ZERO_NOTIONAL = getStakingNotionalAddress(StakingScheduleType.DEFAULT);

	const [deployer] = await ethers.getSigners();

	const factory = await ethers.getContractFactory(CONTRACT_NAME);
	const implementation = await factory.deploy();
	await implementation.deployed();

	const init = await implementation.connect(deployer).initialize(TOKE, MANAGER, TREASURY, SCHEDULE_ZERO_NOTIONAL);
	await init.wait();

	const implementationAddress = implementation.address;
	console.log(`${CONTRACT_NAME} Implementation: ${implementationAddress}`);

	if (VERIFY) {
		await new Promise((r) => setTimeout(r, 45000));

		await run("verify:verify", {
			address: implementationAddress,
			constructorArguments: [],
			contract: FILE_PATH,
		});
	}

	console.log("");
	console.log("");
	console.log(`Proxy Admin: ${PROXY_ADMIN_ADDRESS}`);
	console.log(`Staking Proxy: ${STAKING}`);
	console.log(`New Staking Implementation: ${implementation.address}`);

	const call = implementation.interface.encodeFunctionData("setNotionalAddresses", [
		[0, 1],
		[
			getStakingNotionalAddress(StakingScheduleType.DEFAULT),
			getStakingNotionalAddress(StakingScheduleType.INVESTOR),
		],
	]);

	console.log(`Call: ${call}`);
	console.log("");
	console.log("");
}

main();
