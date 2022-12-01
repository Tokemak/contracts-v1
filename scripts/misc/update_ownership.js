const { ethers } = require("hardhat");
import { Contract, getContractAddress, Environment } from "utils/config";

async function main() {
	const COORDINATOR_ADDRESS = getContractAddress(Environment.MAINNET, Contract.DEV_COORDINATOR_MULTISIG);
	const TOKE_ADDRESS = getContractAddress(Environment.MAINNET, Contract.TOKE);

	const [deployer] = await ethers.getSigners();

	console.log(`Deployer: ${deployer.address}`);
	console.log(`Coordinator: ${COORDINATOR_ADDRESS}`);

	//TOKE deploy
	const tokeContract = await ethers.getContractAt("Toke", TOKE_ADDRESS);

	let currentOwner = await tokeContract.owner();
	console.log(`Current Owner: ${currentOwner}`);

	const tx = await tokeContract.transferOwnership(COORDINATOR_ADDRESS);
	await tx.wait();

	currentOwner = await tokeContract.owner();
	console.log(`New Owner: ${currentOwner}`);
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});
