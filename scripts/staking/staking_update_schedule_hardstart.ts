import { ethers, network } from "hardhat";

import dotenv from "dotenv";
import { Contract, Environment, getContractAddress } from "utils/config";
import { BigNumber } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { assert } from "console";

dotenv.config();

const ENV = Environment.MAINNET;

async function main() {
	const NEW_VESTING_HARDSTART_SCHEDULE = 1643648400;
	const EXAMPLE_ADDRESS = "0x0198a7304842dE87bf4137d24961A7c47F001915".toLowerCase();
	const STAKING_ADDRESS = getContractAddress(ENV, Contract.STAKING);
	const SCHEDULE_ONE = BigNumber.from(1);

	const stakingContract = await ethers.getContractAt("Staking", STAKING_ADDRESS);

	// Get the payload to set the new vesting hardstart

	const setStartData = await stakingContract.interface.encodeFunctionData("setScheduleHardStart", [
		1,
		NEW_VESTING_HARDSTART_SCHEDULE,
	]);

	// Find all users who've had a schedule 1 deposit

	let startBlock = 13311540;
	const blockJump = 12000;
	let endBlock = 0;

	const users: Set<string> = new Set<string>([]);
	const filter = stakingContract.filters.Deposited();
	const currentBlock = await ethers.provider.getBlockNumber();

	do {
		endBlock = Math.min(currentBlock, startBlock + blockJump);
		const e = await retry(() => stakingContract.queryFilter(filter, startBlock, endBlock));
		e.filter((x) => x.args.scheduleIx.eq(SCHEDULE_ONE))
			.map((x) => x.args.account)
			.forEach((a) => {
				users.add(a);
			});
		startBlock = endBlock + 1;
		console.log(`Events - ${startBlock}`);
	} while (endBlock < currentBlock);

	console.log(`Deposits Events Done: ${users.entries.length}`);

	// Get the example payload

	const exampleUpdateData = await stakingContract.interface.encodeFunctionData("updateScheduleStart", [
		[EXAMPLE_ADDRESS],
		SCHEDULE_ONE,
	]);

	// Get the payload to set all the vestings

	const updateData = await stakingContract.interface.encodeFunctionData("updateScheduleStart", [
		Array.from(users).filter((x) => x.toLowerCase() != EXAMPLE_ADDRESS),
		SCHEDULE_ONE,
	]);

	// Test Run

	const devCoordinator = await getImpersonatedSigner(getContractAddress(ENV, Contract.DEV_COORDINATOR_MULTISIG));
	const testtx1 = await devCoordinator.sendTransaction({
		to: STAKING_ADDRESS,
		data: setStartData,
	});
	await testtx1.wait();
	const testtx2 = await devCoordinator.sendTransaction({
		to: STAKING_ADDRESS,
		data: exampleUpdateData,
	});
	await testtx2.wait();
	const query = await stakingContract.getStakes(EXAMPLE_ADDRESS);
	console.log("\n\n\n");
	console.log("Example after update\n=========================");
	console.log(query);

	assert(query[0].started.eq(NEW_VESTING_HARDSTART_SCHEDULE), "DNE");

	// Output

	console.log("\n\n\n");
	console.log("Start Data\n=========================");
	console.log(setStartData);
	console.log("\n\n");
	console.log("Example Update Data\n=========================");
	console.log(exampleUpdateData);
	console.log("\n\n");
	console.log("Update Data\n=========================");
	console.log(updateData);
	console.log("\n\n\n");
}

const getImpersonatedSigner = async (address: string): Promise<SignerWithAddress> => {
	await network.provider.request({
		method: "hardhat_impersonateAccount",
		params: [address],
	});

	await network.provider.send("hardhat_setBalance", [
		address,
		"0x3635c9adc5dea00000", // 1000 eth
	]);

	return ethers.getSigner(address);
};

const retry = async <T>(run: () => Promise<T>) => {
	let tries = 0;
	while (tries < 5) {
		try {
			return await run();
		} catch {
			tries++;
			await new Promise((resolve) => setTimeout(resolve, 1000 * tries));
		}
	}

	throw "Failed";
};

main();
