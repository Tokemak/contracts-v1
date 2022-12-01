import { BigNumberish } from "ethers";
import { ethers, artifacts, run } from "hardhat";
import dotenv from "dotenv";
// import {EventProxy} from "../typechain";
import { getContractAddress, Environment, Contract } from "utils/config";

import factoryAbi from "../../abis/SushiswapRouter.json";
import pairAbi from "../../abis/SushiswapPair.json";

dotenv.config();

const main = async () => {
	const TOKEN_0_ADDRESS = getContractAddress(Environment.MAINNET, Contract.DAI).toLowerCase();
	const TOKEN_1_ADDRESS = getContractAddress(Environment.MAINNET, Contract.USDC).toLowerCase();

	const SUSHISWAP_FACTORY_ADDRESS = getContractAddress(Environment.MAINNET, Contract.SUSHI_FACTORY);

	const factory = (await ethers.getContractAt(factoryAbi, SUSHISWAP_FACTORY_ADDRESS)) as any;

	const allPairsLength = await factory.allPairsLength();
	for (let i = 0; i < allPairsLength; i++) {
		const addr = await factory.allPairs(i);
		const pairContract = (await ethers.getContractAt(pairAbi, addr)) as any;
		const token0 = (await pairContract.token0()).toLowerCase();
		const token1 = (await pairContract.token1()).toLowerCase();
		if (
			(TOKEN_1_ADDRESS == token0 || TOKEN_1_ADDRESS == token1) &&
			(TOKEN_0_ADDRESS == token0 || TOKEN_0_ADDRESS == token1)
		) {
			console.log(`Pair Address ${addr}`);
			console.log(`Pool Id ${i}`);
		}
	}
};

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});
