const { ethers, artifacts } = require("hardhat");
const dotenv = require("dotenv");

import { getContractAddress, Environment, Contract } from "utils/config";

const initializeSignature = "initialize";
const proxyAdminArtfact = artifacts.require("ProxyAdmin");

dotenv.config();

let proxyAdmin;

async function main() {
	const [deployer] = await ethers.getSigners();

	//PROD
	// const tokenAddress = getContractAddress(Environment.MAINNET, Contract.TOKE);
	// const managerAddress = getContractAddress(Environment.MAINNET, Contract.MANAGER);
	// const treasuryAddress = getContractAddress(Environment.MAINNET, Contract.TREASURY);
	// const PROXY_ADMIN = getContractAddress(Environment.MAINNET, Contract.PROXY_ADMIN);

	//Goerli
	const PROXY_ADMIN = "0xC851CC8bf0ED0E5B3A7247b750451E9b75dd5f3A";
	const tokenAddress = getContractAddress(Environment.GOERLI, Contract.TOKE);
	const managerAddress = getContractAddress(Environment.GOERLI, Contract.MANAGER);
	const treasuryAddress = getContractAddress(Environment.GOERLI, Contract.TREASURY);

	const scheduleZeroNotional = "0x605C9B6f969A27982Fe1Be16e3a24F6720A14beD";

	console.log(`Deployer: ${deployer.address}`);
	console.log(`Token Address ${tokenAddress}`);
	console.log(`Manager Address ${managerAddress}`);
	console.log(`Treasury Address ${treasuryAddress}`);

	const stakingFactory = await ethers.getContractFactory("Staking");
	const stakingContract = await stakingFactory.deploy();
	await stakingContract.deployed();

	let tx = await stakingContract.initialize(tokenAddress, managerAddress, treasuryAddress, scheduleZeroNotional);
	await tx.wait();

	proxyAdmin = await ethers.getContractAt(proxyAdminArtfact.abi, PROXY_ADMIN);

	const verifyTokenAddress = await stakingContract.tokeToken();
	const verifyManager = await stakingContract.manager();
	const verifyTreasury = await stakingContract.treasury();

	console.log(`\nStaking Contract ${stakingContract.address}`);
	console.log(`Verify Token Address ${verifyTokenAddress}`);
	console.log(`Verify Manager ${verifyManager}`);
	console.log(`Verify Treasury ${verifyTreasury}`);

	const initializeEncodedParams = stakingContract.interface.encodeFunctionData(initializeSignature, [
		tokenAddress,
		managerAddress,
		treasuryAddress,
		scheduleZeroNotional,
	]);

	const proxyFactory = await ethers.getContractFactory("TransparentUpgradeableProxy");

	const proxy = await proxyFactory.deploy(stakingContract.address, deployer.address, initializeEncodedParams);
	await proxy.deployed();

	console.log(`Proxy Address: ${proxy.address}`);

	const adminBeforeChange = await proxy.connect(deployer).callStatic.admin();
	console.log(`\nDeployer address" ${deployer.address}`);
	console.log(`Signer before change: ${adminBeforeChange}`);
	tx = await proxy.connect(deployer).changeAdmin(PROXY_ADMIN);
	await tx.wait();

	const adminAfterChange = await proxyAdmin.getProxyAdmin(proxy.address);
	console.log(`Signer after change: ${adminAfterChange}`);

	console.log("Verifying implementation");
	await run("verify:verify", {
		address: stakingContract.address,
		constructorArguments: [],
		contract: "contracts/staking/Staking.sol:Staking",
	});

	console.log("Verifying proxy");
	await run("verify:verify", {
		address: proxy.address,
		constructorArguments: [stakingContract.address, deployer.address, initializeEncodedParams],
		contract: "@openzeppelin/contracts/proxy/TransparentUpgradeableProxy.sol:TransparentUpgradeableProxy",
	});
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});
