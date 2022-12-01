import { getContractAddress, Environment, Contract } from "utils/config";
const { upgrades, ethers } = require("hardhat");
const { getContractFactory } = ethers;

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
	const [deployer] = await ethers.getSigners();
	console.log(`Deployer: ${deployer.address}`);

	const managerContract = await ethers.getContractAt("Manager", ManagerAddress);
	const defiContract = await ethers.getContractAt("DefiRound", DefiAddress);

	const defaultAdminId = await managerContract.DEFAULT_ADMIN_ROLE();
	const adminId = await managerContract.ADMIN_ROLE();
	const rolloverId = await managerContract.ROLLOVER_ROLE();
	const midCycleId = await managerContract.MID_CYCLE_ROLE();

	const hasDefaultAdminRoleDeployer = await managerContract.hasRole(defaultAdminId, DeployerAddress);
	const hasAdminRoleDeployer = await managerContract.hasRole(adminId, DeployerAddress);
	const hasRolloverRoleDeployer = await managerContract.hasRole(rolloverId, DeployerAddress);
	const hasCycleRoleDeployer = await managerContract.hasRole(midCycleId, DeployerAddress);

	let tx;
	// GRANT Coordinator default, admin, rollover, cycle roles
	tx = await managerContract.connect(deployer).grantRole(defaultAdminId, CoordinatorAddress);
	await tx.wait();
	tx = await managerContract.connect(deployer).grantRole(adminId, CoordinatorAddress);
	await tx.wait();
	tx = await managerContract.connect(deployer).grantRole(rolloverId, CoordinatorAddress);
	await tx.wait();
	tx = await managerContract.connect(deployer).grantRole(midCycleId, CoordinatorAddress);
	await tx.wait();
	//Deployer Renounce Roles
	tx = await managerContract.connect(deployer).renounceRole(defaultAdminId, DeployerAddress);
	await tx.wait();
	tx = await managerContract.connect(deployer).renounceRole(adminId, DeployerAddress);
	await tx.wait();
	// await managerContract.connect(deployer).renounceRole(rolloverId, DeployerAddress);
	// await tx.wait()
	tx = await managerContract.connect(deployer).renounceRole(midCycleId, DeployerAddress);
	await tx.wait();

	const hasDefaultAdminRoleDeployerAfter = await managerContract.hasRole(defaultAdminId, DeployerAddress);
	const hasAdminRoleDeployerAfter = await managerContract.hasRole(adminId, DeployerAddress);
	const hasRolloverRoleDeployerAfter = await managerContract.hasRole(rolloverId, DeployerAddress);
	const hasCycleRoleDeployerAfter = await managerContract.hasRole(midCycleId, DeployerAddress);

	const hasDefaultAdminRoleController = await managerContract.hasRole(defaultAdminId, CoordinatorAddress);
	const hasAdminRoleController = await managerContract.hasRole(adminId, CoordinatorAddress);
	const hasRolloverRoleController = await managerContract.hasRole(rolloverId, CoordinatorAddress);
	const hasCycleRoleController = await managerContract.hasRole(midCycleId, CoordinatorAddress);

	console.log("Deployer Roles:");
	console.log(`Default Admin Role: ${hasDefaultAdminRoleDeployer}, ${hasDefaultAdminRoleDeployerAfter}`);
	console.log(`Admin Role: ${hasAdminRoleDeployer}, ${hasAdminRoleDeployerAfter}`);
	console.log(`Rollover Role: ${hasRolloverRoleDeployer}, ${hasRolloverRoleDeployerAfter}`);
	console.log(`Cycle Role: ${hasCycleRoleDeployer}, ${hasCycleRoleDeployerAfter}`);

	console.log();

	console.log("Controller Roles:");
	console.log(`Default Admin Role: ${hasDefaultAdminRoleController}`);
	console.log(`Admin Role: ${hasAdminRoleController}`);
	console.log(`Rollover Role: ${hasRolloverRoleController}`);
	console.log(`Cycle Role: ${hasCycleRoleController}`);
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});
