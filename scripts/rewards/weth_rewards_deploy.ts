import { ethers, run } from "hardhat";

import dotenv from "dotenv";
import { Contract, Environment, getChainIdByEnv, getContractAddress } from "utils/config";

dotenv.config();

const ENV = Environment.MAINNET;
const VERIFY = true;

const wethAddress = getContractAddress(ENV, Contract.WETH);
const rewardsSignerWeth = getContractAddress(ENV, Contract.REWARDS_SIGNER_WETH);

async function main() {
	const CHAIN_INFO = getChainIdByEnv(ENV);
	const chainValidation = (await ethers.provider.getNetwork()).chainId;
	if (CHAIN_INFO.l1 != chainValidation) throw "Mismatch Chain";

	// Deploy Rewards

	const rewardsFactory = await ethers.getContractFactory("Rewards");
	const rewardsContract = await rewardsFactory.deploy(wethAddress, rewardsSignerWeth);
	await rewardsContract.deployed();

	console.log(`Rewards Contract: ${rewardsContract.address}`);

	if (VERIFY) {
		await new Promise((r) => setTimeout(r, 60000));
		await run("verify:verify", {
			address: rewardsContract.address,
			constructorArguments: [wethAddress, rewardsSignerWeth],
			contract: "contracts/rewards/Rewards.sol:Rewards",
		});
		console.log("Verified");
	} else {
		console.log("Skip Verification");
	}

	// Deploy Rewards Hash

	const rewardsHashFactory = await ethers.getContractFactory("RewardHash");
	const rewardsHashContract = await rewardsHashFactory.deploy();
	await rewardsHashContract.deployed();

	console.log(`Rewards Hash Contract: ${rewardsHashContract.address}`);

	if (VERIFY) {
		await new Promise((r) => setTimeout(r, 60000));
		await run("verify:verify", {
			address: rewardsHashContract.address,
			constructorArguments: [],
			contract: "contracts/rewards/RewardHash.sol:RewardHash",
		});
		console.log("Verified");
	} else {
		console.log("Skip Verification");
	}
}

main();
