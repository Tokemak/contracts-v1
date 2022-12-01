const { upgrades, ethers } = require("hardhat");
const { getContractFactory } = ethers;
import { getContractAddress, Environment, Contract } from "utils/config";

const LINK = getContractAddress(Environment.MAINNET, Contract.LINK);
const WETH = getContractAddress(Environment.MAINNET, Contract.WETH);

const DeployerAddress = getContractAddress(Environment.MAINNET, Contract.DEPLOYER);
const TOKEAddress = getContractAddress(Environment.MAINNET, Contract.TOKE);
const DefiAddress = getContractAddress(Environment.MAINNET, Contract.DEFI_ADDRESS);
const ManagerAddress = getContractAddress(Environment.MAINNET, Contract.MANAGER);
const WETHPoolAddress = getContractAddress(Environment.MAINNET, Contract.WETH_POOL);
const USDCPoolAddress = getContractAddress(Environment.MAINNET, Contract.USDC_POOL);
const CoordinatorAddress = getContractAddress(Environment.MAINNET, Contract.DEV_COORDINATOR_MULTISIG);
const TreasuryAddress = getContractAddress(Environment.MAINNET, Contract.TREASURY);

async function main() {
	const managerContract = await ethers.getContractAt("Manager", ManagerAddress);
	const defiContract = await ethers.getContractAt("DefiRound", DefiAddress);
	const tokeContract = await ethers.getContractAt("Toke", TOKEAddress);

	const defaultAdminId = await managerContract.DEFAULT_ADMIN_ROLE();
	const adminId = await managerContract.ADMIN_ROLE();
	const rolloverId = await managerContract.ROLLOVER_ROLE();
	const midCycleId = await managerContract.MID_CYCLE_ROLE();
	const hasDefaultAdminRole = await managerContract.hasRole(defaultAdminId, DeployerAddress);
	const hasAdminRole = await managerContract.hasRole(adminId, DeployerAddress);
	const hasRolloverRole = await managerContract.hasRole(rolloverId, DeployerAddress);
	const hasCycleRole = await managerContract.hasRole(midCycleId, DeployerAddress);

	const defiOwner = await defiContract.owner();
	const tokeOwner = await tokeContract.owner();

	console.log(`Default Admin Id: ${defaultAdminId}, ${hasDefaultAdminRole}`);
	console.log(`Admin Id: ${adminId}, ${hasAdminRole}`);
	console.log(`Rollover Id: ${rolloverId}, ${hasRolloverRole}`);
	console.log(`Mid Cycle Id: ${midCycleId}, ${hasCycleRole}`);
	console.log(`Defi Owner: ${defiOwner}`);
	console.log(`Toke Owner: ${tokeOwner}`);
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});
