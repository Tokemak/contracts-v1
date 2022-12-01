import { ethers, artifacts } from "hardhat";
import dotenv from "dotenv";
import { VoteTracker } from "../../typechain";
import { getContractAddress, Environment, Contract } from "utils/config";

dotenv.config();

export interface VoteReactorSetupInput {
	voteTracker: string;
}

export const runVoteReactorSetup = async (input: VoteReactorSetupInput): Promise<void> => {
	const voteArtifact = artifacts.require("VoteTracker");

	const reactors = {
		alcx: getContractAddress(Environment.MAINNET, Contract.ALCX),
		fxs: getContractAddress(Environment.MAINNET, Contract.FXS),
		ohm: getContractAddress(Environment.MAINNET, Contract.OHM),
		sushi: getContractAddress(Environment.MAINNET, Contract.SUSHI),
		tcr: getContractAddress(Environment.MAINNET, Contract.TCR),
	} as Record<string, string>;

	// const remove = {
	//   alcx: getContractAddress(Environment.MAINNET, Contract.ALCX),
	//   fxs: getContractAddress(Environment.MAINNET, Contract.FXS),
	//   ohm: getContractAddress(Environment.MAINNET, Contract.OHM),
	//   sushi: getContractAddress(Environment.MAINNET, Contract.SUSHI),
	//   tcr: getContractAddress(Environment.MAINNET, Contract.TCR),
	// } as Record<string, string>;

	const reactorKeys = Object.keys(reactors).map((x) => getReactorKeyEntry(reactors[x], x));
	// const removeReactorKeys = Object.keys(remove).map((x) =>
	//   getReactorKeyEntry(remove[x], x)
	// );

	const [deployer] = await ethers.getSigners();
	const voteTracker = (await ethers.getContractAt(voteArtifact.abi, input.voteTracker)) as unknown as VoteTracker;

	const yes = await voteTracker.connect(deployer).setReactorKeys(reactorKeys, true);
	await yes.wait();

	// const no = await voteTracker
	//   .connect(deployer)
	//   .setReactorKeys(removeReactorKeys, false);
	// await no.wait();
};

const getReactorKeyEntry = (address: string, key: string) => {
	return {
		token: address,
		key: ethers.utils.formatBytes32String(`${key}-default`),
	};
};
