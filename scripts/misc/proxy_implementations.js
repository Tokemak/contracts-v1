const { ethers, network } = require("hardhat");
const chalk = require("chalk");
const { Contract, getContractAddress, Environment } = require("utils/config");
require("dotenv").config();

const PROXY_ABI = require("@openzeppelin/upgrades-core/artifacts/@openzeppelin/contracts/proxy/transparent/TransparentUpgradeableProxy.sol/TransparentUpgradeableProxy");

// const PROXY_ABI = artifacts.require('TransparentUpgradeableProxy');

const MANAGER_ADDRESS = getContractAddress(Environment.MAINNET, Contract.MANAGER);

const WETH_POOL_ADDRESS = getContractAddress(Environment.MAINNET, Contract.WETH_POOL);
const USDC_POOL_ADDRESS = getContractAddress(Environment.MAINNET, Contract.USDC_POOL);

const TOKE_POOL_ADDRESS = getContractAddress(Environment.MAINNET, Contract.TOKE_POOL);
const UNI_POOL_ADDRESS = getContractAddress(Environment.MAINNET, Contract.UNI_POOL);
const SUSHI_POOL_ADDRESS = getContractAddress(Environment.MAINNET, Contract.SUSHI_POOL);

const PROXY_ADMIN_1 = getContractAddress(Environment.MAINNET, Contract.PROXY_ADMIN);
const PROXY_ADMIN_2 = getContractAddress(Environment.MAINNET, Contract.PROXY_ADMIN_2);

async function getImplementations() {
	await network.provider.request({
		method: "hardhat_impersonateAccount",
		params: [PROXY_ADMIN_1],
	});
	const proxyAdmin1 = await ethers.getSigner(PROXY_ADMIN_1);

	await network.provider.request({
		method: "hardhat_impersonateAccount",
		params: [PROXY_ADMIN_2],
	});
	const proxyAdmin2 = await ethers.getSigner(PROXY_ADMIN_2);

	// const [deployer] = await ethers.getSigners();
	// console.log(deployer.address);

	let managerProxy = await ethers.getContractAt(PROXY_ABI.abi, MANAGER_ADDRESS);
	let managerImplementation = await managerProxy.connect(proxyAdmin1).callStatic.implementation();
	console.log(`Manager ${chalk.green(MANAGER_ADDRESS)}, Implementation: ${chalk.green(managerImplementation)}`);

	let wethPoolProxy = await ethers.getContractAt(PROXY_ABI.abi, WETH_POOL_ADDRESS);
	let wethPoolImplementation = await wethPoolProxy.connect(proxyAdmin1).callStatic.implementation();
	console.log(`WETH Pool ${chalk.green(WETH_POOL_ADDRESS)}, Implementation: ${chalk.green(wethPoolImplementation)}`);

	let usdcPoolProxy = await ethers.getContractAt(PROXY_ABI.abi, USDC_POOL_ADDRESS);
	let usdcPoolImplementation = await usdcPoolProxy.connect(proxyAdmin1).callStatic.implementation();
	console.log(`USDC Pool ${chalk.green(WETH_POOL_ADDRESS)}, Implementation: ${chalk.green(usdcPoolImplementation)}`);

	let tokePoolProxy = await ethers.getContractAt(PROXY_ABI.abi, TOKE_POOL_ADDRESS);
	let tokePoolImplementation = await tokePoolProxy.connect(proxyAdmin2).callStatic.implementation();
	console.log(`TOKE Pool ${chalk.green(UNI_POOL_ADDRESS)}, Implementation: ${chalk.green(tokePoolImplementation)}`);

	let uniPoolProxy = await ethers.getContractAt(PROXY_ABI.abi, UNI_POOL_ADDRESS);
	let uniPoolImplementation = await uniPoolProxy.connect(proxyAdmin2).callStatic.implementation();
	console.log(`UNI Pool ${chalk.green(UNI_POOL_ADDRESS)}, Implementation: ${chalk.green(uniPoolImplementation)}`);

	let sushiPoolProxy = await ethers.getContractAt(PROXY_ABI.abi, SUSHI_POOL_ADDRESS);
	let sushiPoolImplementation = await sushiPoolProxy.connect(proxyAdmin2).callStatic.implementation();
	console.log(`SUSHI Pool ${chalk.green(UNI_POOL_ADDRESS)}, Implementation: ${chalk.green(sushiPoolImplementation)}`);

	// const ManagerFactory = await ethers.getContractFactory('Manager');
	// const managerContract = await upgrades.upgradeProxy(MANAGER_ADDRESS, ManagerFactory, { unsafeAllow: ['delegatecall'] });
	// await managerContract.deployed();

	// managerImplementation = await managerProxy.connect(proxyAdmin).callStatic.implementation();
	// console.log(managerImplementation);
}

getImplementations();
