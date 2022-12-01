import { artifacts, ethers, run } from "hardhat";
import { Pool, Pool__factory, ProxyAdmin, TransparentUpgradeableProxy__factory } from "../../typechain";
import { Contract, getContractAddress, Environment } from "utils/config";

//Testnet
const MANAGER_ADDRESS = getContractAddress(Environment.GOERLI, Contract.MANAGER);
const TOKE_POOL_ADDRESS = getContractAddress(Environment.GOERLI, Contract.TOKE_POOL);
const PROXY_ADMIN_ADDRESS = getContractAddress(Environment.GOERLI, Contract.PROXY_ADMIN);
const TOKE_ADDRESS = getContractAddress(Environment.GOERLI, Contract.TOKE);

//Mainnet
// const MANAGER_ADDRESS = getContractAddress(Environment.MAINNET, Contract.MANAGER);
// const TOKE_POOL_ADDRESS = getContractAddress(Environment.MAINNET, Contract.TOKE_POOL);
// const PROXY_ADMIN_ADDRESS = getContractAddress(Environment.MAINNET, Contract.PROXY_ADMIN);
//const TOKE_ADDRESS = "";

const proxyAdminArtifact = artifacts.require("ProxyAdmin");
const proxyArtifact = artifacts.require("TransparentUpgradeableProxy");

async function main() {
	// console.log(
	//   await ethers.provider.getStorageAt(
	//     TOKE_POOL_ADDRESS,
	//     "0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103"
	//   )
	// );

	// return;

	const [deployer] = await ethers.getSigners();

	const proxyAdmin = (await ethers.getContractAt(
		proxyAdminArtifact.abi,
		PROXY_ADMIN_ADDRESS,
		deployer
	)) as unknown as ProxyAdmin;

	// const poolFactory = await ethers.getContractFactory("TokeMigrationPool");
	// const poolImplementation = await poolFactory.deploy();
	// await poolImplementation.deployed();
	// await poolImplementation.initialize(
	//   TOKE_ADDRESS,
	//   MANAGER_ADDRESS,
	//   "tokemakAsset",
	//   "tAsset"
	// );

	//console.log(`Pool implementation address: ${poolImplementation.address}`);

	const poolProxy = await ethers.getContractAt(proxyArtifact.abi, TOKE_POOL_ADDRESS);

	console.log(`Implementation before, ${await proxyAdmin.getProxyImplementation(poolProxy.address)}`);

	const tx = await proxyAdmin
		.connect(deployer)
		.upgrade(poolProxy.address, "0x3d1b902413AA684C823845DEbFb9D0096C440E12");
	await tx.wait(5);

	console.log(`Implementation after, ${await proxyAdmin.getProxyImplementation(poolProxy.address)}`);

	// await run("verify:verify", {
	//   address: "0x3d1b902413AA684C823845DEbFb9D0096C440E12",
	//   constructorArguments: [],
	//   contract: "contracts/pools/TokeMigrationPool.sol:TokeMigrationPool",
	// });
}

main();
