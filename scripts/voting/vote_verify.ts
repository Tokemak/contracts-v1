import { BigNumberish } from "ethers";
import { ethers, run } from "hardhat";
import dotenv from "dotenv";
import { Contract, getContractAddress, Environment } from "utils/config";
// import {EventProxy} from "../typechain";

dotenv.config();

const main = async () => {
	// const FX_PORTAL_CHILD_ADDRESS = getContractAddress(Environment.GOERLI, Contract.FX_CHILD); //Mumbai
	const TTOKE_ADDRESS = "0xa20Ec9554CD4C2d4594ECb7fa0138aBD4Ec8bbb4"; //Goerli
	const VERIFY = true;

	const initialVoteSession: string = ethers.utils.formatBytes32String("1");

	if (VERIFY) {
		await run("verify:verify", {
			address: getContractAddress(Environment.GOERLI, Contract.TOKE),
			constructorArguments: [],
			contract: "contracts/event-proxy/EventProxy.sol:EventProxy",
		});
	}

	if (VERIFY) {
		await run("verify:verify", {
			address: "0x753025da15bf4F5AB92860d83Bd08658672d00f4",
			constructorArguments: [getContractAddress(Environment.GOERLI, Contract.EVENT_PROXY)],
			contract: "contracts/balance-tracker/BalanceTracker.sol:BalanceTracker",
		});
	}

	const voteMultipliers = [getTokenMultiplier(TTOKE_ADDRESS, 1)];

	if (VERIFY) {
		await run("verify:verify", {
			address: "0xc735f75aBf8662326d9bCC7B6eEB6b9dF6352Ff3",
			constructorArguments: [
				getContractAddress(Environment.GOERLI, Contract.EVENT_PROXY),
				initialVoteSession,
				"0x753025da15bf4F5AB92860d83Bd08658672d00f4",
				voteMultipliers,
			],
			contract: "contracts/vote/VoteTracker.sol:VoteTracker",
		});
	}

	if (VERIFY) {
		await run("verify:verify", {
			address: "0x4043111e09A2dF72F79E1C901dc966Ca66F5C1f3",
			constructorArguments: ["xAAVE", "xAAVE"],
			contract: "contracts/testnet/TestnetToken.sol:TestnetToken",
		});
	}

	if (VERIFY) {
		await run("verify:verify", {
			address: "0x1a9e6C3123cA74249537a57ABBBD5FF52Ded8F25",
			constructorArguments: ["xSNX", "xSNX"],
			contract: "contracts/testnet/TestnetToken.sol:TestnetToken",
		});
	}

	if (VERIFY) {
		await run("verify:verify", {
			address: "0x2680bD32C2D6f50f44010203691D016a2d4D1F78",
			constructorArguments: ["xCRV", "xCRV"],
			contract: "contracts/testnet/TestnetToken.sol:TestnetToken",
		});
	}
};

const getTokenMultiplier = (tokenAddress: string, multiplier: number): VoteTokenMultiplier => {
	return {
		token: tokenAddress,
		multiplier: ethers.utils.parseUnits(multiplier.toString(), 18),
	};
};

type VoteTokenMultiplier = {
	token: string;
	multiplier: BigNumberish;
};

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});
