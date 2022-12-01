const { ethers, artifacts } = require("hardhat");
const dotenv = require("dotenv");
const chalk = require("chalk");
const { Contract, getContractAddress, Environment } = require("utils/config");

dotenv.config();

const MANAGER_ADDRESS = getContractAddress(Environment.MAINNET, Contract.MANAGER);
const ADDRESS_REGISTRY_ADDRESS = getContractAddress(Environment.MAINNET, Contract.ADDRESS_REGISTRY);
const ETH_POOL_ADDRESS = getContractAddress(Environment.MAINNET, Contract.WETH_POOL);
const UNI_POOL_ADDRESS = getContractAddress(Environment.MAINNET, Contract.UNI_POOL);
const SUSHI_POOL_ADDRESS = getContractAddress(Environment.MAINNET, Contract.SUSHI_POOL);
const TOKE_POOL_ADDRESS = getContractAddress(Environment.MAINNET, Contract.TOKE_POOL);
const PROXY_ADMIN_ADDRESS = getContractAddress(Environment.MAINNET, Contract.PROXY_ADMIN);

const proxyAdminArtifact = artifacts.require("ProxyAdmin");
const proxyArtifact = artifacts.require("TransparentUpgradeableProxy");
const managerArtifact = artifacts.require("Manager");

async function main() {
	const deployer = new ethers.Wallet(process.env.DEGENESIS_DEPLOYER, ethers.provider);

	const proxyAdmin = await ethers.getContractAt(proxyAdminArtifact.abi, PROXY_ADMIN_ADDRESS, deployer);
	const manager = await ethers.getContractAt(managerArtifact.abi, MANAGER_ADDRESS, deployer);
	let poolFactory = await ethers.getContractFactory("Pool");
	let poolImplementation = await poolFactory.deploy();
	await poolImplementation.deployed();
	await poolImplementation.initialize(
		getContractAddress(Environment.MAINNET, Contract.UNI_POOL), //TODO: Change What should underlyer be here?
		MANAGER_ADDRESS,
		"tokemakAsset",
		"tAsset"
	);

	let ethPoolFactory = await ethers.getContractFactory("EthPool");
	let ethPoolImplementation = await ethPoolFactory.deploy();
	await ethPoolImplementation.deployed();
	await ethPoolImplementation.initialize(MANAGER_ADDRESS, ADDRESS_REGISTRY_ADDRESS, "tokemakWeth", "tWeth");

	console.log(`Pool implementation address: ${chalk.greenBright(poolImplementation.address)}`);
	console.log(`EthPool implementation address: ${chalk.greenBright(ethPoolImplementation.address)}`);

	let poolAddressArr = await manager.getPools();
	poolAddressArr = Object.assign([], poolAddressArr); // Won't push without this
	poolAddressArr.push(SUSHI_POOL_ADDRESS, UNI_POOL_ADDRESS, TOKE_POOL_ADDRESS); // Add addresses that are not registered with manager here
	console.log(poolAddressArr);

	for (let i = 0; i < poolAddressArr.length; i++) {
		let poolProxyAddr = poolAddressArr[i];
		let poolProxy = await ethers.getContractAt(proxyArtifact.abi, poolProxyAddr);

		console.log(`Pool proxy address: ${chalk.blueBright(poolProxyAddr)}`);
		console.log(
			`Implementation before, ${chalk.yellowBright(await proxyAdmin.getProxyImplementation(poolProxy.address))}`
		);

		let implementationAddr;
		if (poolProxyAddr.toLowerCase() === ETH_POOL_ADDRESS.toLowerCase()) {
			implementationAddr = ethPoolImplementation.address;
		} else {
			implementationAddr = poolImplementation.address;
		}

		await proxyAdmin.connect(deployer).upgrade(poolProxyAddr, implementationAddr);
		console.log(
			`Implementation after, ${chalk.yellowBright(await proxyAdmin.getProxyImplementation(poolProxy.address))}`
		);
	}
}

main();
