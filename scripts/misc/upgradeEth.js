const { ethers } = require("hardhat");
const { Contract, getContractAddress, Environment } = require("utils/config");
require("dotenv").config();

const PROXY_ADMIN_ABI = require("@openzeppelin/upgrades-core/artifacts/@openzeppelin/contracts/proxy/transparent/ProxyAdmin.sol/ProxyAdmin");
const PROXY_ABI = require("@openzeppelin/upgrades-core/artifacts/@openzeppelin/contracts/proxy/transparent/TransparentUpgradeableProxy.sol/TransparentUpgradeableProxy");
const ETH_POOL = getContractAddress(Environment.MAINNET, Contract.WETH_POOL);
const PROXY_ADMIN = getContractAddress(Environment.MAINNET, Contract.PROXY_ADMIN); //THE SAME FOR ALL

async function main() {
	const [deployer] = await ethers.getSigners();
	console.log("Deployer: ", deployer.address);

	const proxyAdmin = await ethers.getContractAt(PROXY_ADMIN_ABI.abi, PROXY_ADMIN);
	let ethPoolProxy = await ethers.getContractAt(PROXY_ABI.abi, ETH_POOL);

	//Deployer a the ETH Logic
	const ethLogicFactory = await ethers.getContractFactory("EthPool");
	const ethLogicContract = await ethLogicFactory.deploy();
	await ethLogicContract.deployed();
	console.log("Expected New Logic Contract: ", ethLogicContract.address);

	await proxyAdmin.upgrade(ethPoolProxy.address, ethLogicContract.address);

	const initialized = await ethLogicContract
		.connect(deployer)
		.initialize(
			getContractAddress(Environment.MAINNET, Contract.MANAGER),
			getContractAddress(Environment.MAINNET, Contract.ADDRESS_REGISTRY),
			"tAssetPool",
			"tAsset"
		);
	await initialized.wait();
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});
