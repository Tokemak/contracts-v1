import { ethers, run, artifacts } from "hardhat";

import dotenv from "dotenv";
import { AccToke, AccToke__factory, ProxyAdmin, Staking, TransparentUpgradeableProxy__factory } from "../../typechain";
import { Contract, Environment, getContractAddress } from "utils/config";

dotenv.config();

const ENV: Environment = Environment.MAINNET;
const PERFORM_STAKING_DEPLOY = false;

const proxyAdminArtifact = artifacts.require("ProxyAdmin");
const stakingArtifact = artifacts.require("Staking");
const accArtifact = artifacts.require("AccToke");
const stakingProxyAddress = getContractAddress(ENV, Contract.STAKING);
const proxyAdminAddress = getContractAddress(ENV, Contract.PROXY_ADMIN);

async function main() {
	const PROXY_ADMIN_ADDRESS = getContractAddress(ENV, Contract.PROXY_ADMIN);
	const MANAGER_ADDRESS = getContractAddress(ENV, Contract.MANAGER);
	const TOKE_ADDRESS = getContractAddress(ENV, Contract.TOKE);

	const MIN_LOCK_CYCLES = 2;
	const MAX_LOCK_CYCLES = 4;
	const MAX_CAP = ethers.utils.parseEther("100");
	const VERIFY = true;

	const [deployer] = await ethers.getSigners();

	// Deploy AccToke Implementation

	const accTokeFactory = await ethers.getContractFactory("AccToke");
	const accImplementation = await accTokeFactory.deploy();
	await accImplementation.deployed();

	const accImplAddress = accImplementation.address;

	console.log(`Acc Impl: ${accImplAddress}`);

	if (VERIFY) {
		await run("verify:verify", {
			address: accImplAddress,
			constructorArguments: [],
			contract: "contracts/acctoke/AccToke.sol:AccToke",
		});
	}

	const accInterface = AccToke__factory.createInterface();
	const initializeData = accInterface.encodeFunctionData("initialize", [
		MANAGER_ADDRESS,
		MIN_LOCK_CYCLES,
		MAX_LOCK_CYCLES,
		TOKE_ADDRESS,
		MAX_CAP,
	]);

	// Deploy AccToke Proxy Contract

	const proxyFactory = new TransparentUpgradeableProxy__factory(deployer);
	const proxy = await proxyFactory.deploy(accImplAddress, PROXY_ADMIN_ADDRESS, initializeData);
	await proxy.deployed();

	console.log(`Acc Proxy ${proxy.address}`);

	if (PERFORM_STAKING_DEPLOY) {
		// Deploy new Staking Implementation

		const stakingFactory = await ethers.getContractFactory("Staking");
		const stakingImpl = await stakingFactory.deploy();
		await stakingImpl.deployed();
		const stakingImplAddress = stakingImpl.address;

		console.log(`Staking Impl: ${stakingImplAddress}`);

		// Verify new Staking Implementation

		if (VERIFY) {
			await run("verify:verify", {
				address: stakingImplAddress,
				constructorArguments: [],
				contract: "contracts/staking/Staking.sol:Staking",
			});
		}

		// Upgrade Staking Contract
		if (ENV == Environment.GOERLI) {
			const proxyAdmin = (await ethers.getContractAt(
				proxyAdminArtifact.abi,
				proxyAdminAddress
			)) as unknown as ProxyAdmin;
			const tx = await proxyAdmin.upgrade(stakingProxyAddress, stakingImplAddress);
			await tx.wait();

			console.log("Upgraded");

			const stakingProxy = (await ethers.getContractAt(
				stakingArtifact.abi,
				stakingProxyAddress
			)) as unknown as Staking;

			await stakingProxy.setAccToke(proxy.address);

			console.log("AccToke Set");

			// Allow Staking to Lock For on AccToke
			const accProxy = (await ethers.getContractAt(accArtifact.abi, proxy.address)) as unknown as AccToke;
			const setRoleTx = await accProxy.grantRole(await accProxy.LOCK_FOR_ROLE(), stakingProxyAddress);
			await setRoleTx.wait();

			console.log("Acc Role Granted");
			console.log("Done");
		}
	}
}

main();
