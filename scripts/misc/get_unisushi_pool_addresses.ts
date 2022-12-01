import dotenv from "dotenv";
import { getCreate2Address } from "@ethersproject/address";
import { pack, keccak256 } from "@ethersproject/solidity";
import { getContractAddress, Environment, Contract } from "utils/config";

dotenv.config();
const UNI_FACTORY_ADDRESS = getContractAddress(Environment.MAINNET, Contract.UNI_FACTORY);
const SUSHI_FACTORY_ADDRESS = getContractAddress(Environment.MAINNET, Contract.SUSHI_FACTORY);

const UNI_INIT_HASH = "0x96e8ac4277198ff8b6f785478aa9a39f403cb768dd02cbee326c3e7da348845f";
const SUSHI_INIT_HASH = "0xe18a34eb0e04b04f7a0ac29a6e80748dca96319b42c54d679cb821dca90c6303";
const WETH = getContractAddress(Environment.MAINNET, Contract.WETH);

const main = async () => {
	find("ALCX", getContractAddress(Environment.MAINNET, Contract.ALCX), WETH, false);
	find("FOX", getContractAddress(Environment.MAINNET, Contract.FOX), WETH, true);
	find("SUSHI", getContractAddress(Environment.MAINNET, Contract.SUSHI), WETH, false);
};

const find = (desc: string, tokenA: string, tokenB: string, uni: boolean) => {
	const [token0, token1] = tokenA.toLowerCase() < tokenB.toLowerCase() ? [tokenA, tokenB] : [tokenB, tokenA];

	const address = getCreate2Address(
		uni ? UNI_FACTORY_ADDRESS : SUSHI_FACTORY_ADDRESS,
		keccak256(["bytes"], [pack(["address", "address"], [token0, token1])]),
		uni ? UNI_INIT_HASH : SUSHI_INIT_HASH
	);

	console.log("");
	console.log("--------------------------");
	console.log(`${desc} @ ${uni ? "Uniswap" : "Sushiswap"}`);
	console.log(`TokenA: ${tokenA}`);
	console.log(`TokenB: ${tokenB}`);
	console.log(`Pair ${address}`);
	console.log("--------------------------");
	console.log("");
};

const exit = (code: number) => {
	console.log("");
	process.exit(code);
};

main()
	.then(() => exit(0))
	.catch((error) => {
		console.error(error);
		exit(1);
	});
