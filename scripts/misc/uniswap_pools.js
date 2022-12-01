const { ethers } = require("hardhat");
const { ChainId, Token, WETH, Pair } = require("@uniswap/sdk");
const dotenv = require("dotenv");
import { getContractAddress, Environment, Contract } from "utils/config";

dotenv.config();

async function main() {
	// eslint-disable-next-line no-unused-vars
	const [deployer] = await ethers.getSigners();

	console.log(ChainId);
	console.log(WETH);

	const wethAddress = WETH[ChainId.MAINNET];
	const tokeContract = new Token(ChainId.MAINNET, getContractAddress(Environment.MAINNET, Contract.TOKE), 18);
	const sushiContract = new Token(ChainId.MAINNET, "0x6b3595068778dd592e39a122f4f5a5cf09c90fe2", 18);

	console.log(wethAddress);
	console.log(tokeContract);

	// NOTE:
	const wethTokePair = Pair.getAddress(wethAddress, tokeContract);
	const wethSushiPair = Pair.getAddress(wethAddress, sushiContract);
	console.log("WETH/TOKE Pair Uniswap:", wethTokePair);
	console.log("WETH/TOKE Pair Sushi:", wethSushiPair);
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});
