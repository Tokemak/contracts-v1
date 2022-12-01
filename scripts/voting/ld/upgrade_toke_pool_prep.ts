import { ethers, run } from "hardhat";
import { getContractAddress, Environment, Contract } from "utils/config";

//Mainnet
const MANAGER_ADDRESS = getContractAddress(Environment.MAINNET, Contract.MANAGER);
const TOKE_ADDRESS = getContractAddress(Environment.MAINNET, Contract.TOKE);
const VERIFY = true;

async function main() {
	const [deployer] = await ethers.getSigners();

	const poolFactory = await ethers.getContractFactory("TokeVotePool");
	const poolImplementation = await poolFactory.deploy();
	await poolImplementation.deployed();
	await poolImplementation.initialize(TOKE_ADDRESS, MANAGER_ADDRESS, "tokemakAsset", "tAsset");

	const impl = poolImplementation.address;
	console.log(`Pool implementation address: ${impl}`);

	if (VERIFY) {
		await run("verify:verify", {
			address: impl,
			constructorArguments: [],
			contract: "contracts/pools/TokeVotePool.sol:TokeVotePool",
		});
	}
}

main();
