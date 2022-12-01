import { BigNumber } from "ethers";
import { ethers, artifacts } from "hardhat";
import { Contract, getContractAddress, Environment, getChainIdByEnv } from "utils/config";

const ERC20 = artifacts.require("@openzeppelin/contracts/token/ERC20/ERC20.sol");

export const FundToken = {
	FRAX: Contract.FRAX.toUpperCase(),
	WETH: Contract.WETH.toUpperCase(),
	WBTC: Contract.WBTC.toUpperCase(),
	USDC: Contract.USDC.toUpperCase(),
	DAI: Contract.DAI.toUpperCase(),
	USDT: Contract.USDT.toUpperCase(),
	TOKE: Contract.TOKE.toUpperCase(),
};

export const FundTokenDecimals: Record<
	keyof typeof FundToken,
	{
		decimals: number;
		slot: number;
		address: string;
	}
> = {
	FRAX: {
		decimals: 18,
		slot: 0,
		address: getContractAddress(Environment.MAINNET, Contract.FRAX),
	},
	WETH: {
		decimals: 18,
		slot: 3,
		address: getContractAddress(Environment.MAINNET, Contract.WETH),
	},
	WBTC: {
		decimals: 8,
		slot: 0,
		address: getContractAddress(Environment.MAINNET, Contract.WBTC),
	},
	USDC: {
		decimals: 6,
		slot: 9,
		address: getContractAddress(Environment.MAINNET, Contract.USDC),
	},
	DAI: {
		decimals: 18,
		slot: 2,
		address: getContractAddress(Environment.MAINNET, Contract.DAI),
	},
	USDT: {
		decimals: 6,
		slot: 2,
		address: getContractAddress(Environment.MAINNET, Contract.USDT),
	},
	TOKE: {
		decimals: 18,
		slot: 0,
		address: getContractAddress(Environment.MAINNET, Contract.TOKE),
	},
};

export const tokenAmount = (token: keyof typeof FundToken, amount: number): BigNumber => {
	return ethers.utils.parseUnits(amount.toString(), FundTokenDecimals[token].decimals);
};

export const getTokenBalance = async (token: keyof typeof FundToken, forAddress: string): Promise<BigNumber> => {
	const contract = await ethers.getContractAt(ERC20.abi, FundTokenDecimals[token].address);

	return await contract.balanceOf(forAddress);
};

export const fundAccount = async (token: keyof typeof FundToken, toAddress: string, amount: number): Promise<void> => {
	const locallyManipulatedBalance = ethers.utils.parseUnits(amount.toString(), FundTokenDecimals[token].decimals);

	// Get storage slot index
	const index = ethers.utils.hexStripZeros(
		ethers.utils.solidityKeccak256(
			["uint256", "uint256"],
			[toAddress, FundTokenDecimals[token].slot] // key, slot
		)
	);

	// Manipulate local balance (needs to be bytes32 string)
	await setStorageAt(
		FundTokenDecimals[token].address,
		index.toString(),
		toBytes32(locallyManipulatedBalance).toString()
	);
};

export const getLpTokenBalance = async (account: string, tokenAddress: string): Promise<BigNumber> => {
	const contract = await ethers.getContractAt(ERC20.abi, tokenAddress);
	return await contract.balanceOf(account);
};

export const pad = (value: BigNumber, pad: number): BigNumber => {
	return ethers.utils.parseUnits(value.toString(), pad);
};

export const toNumber = (value: BigNumber, pad: number): number => {
	return parseInt(ethers.utils.formatUnits(value, pad));
};

export const Amount = (num: number) => {
	return ethers.utils.parseUnits(num.toString(), 18);
};

const setStorageAt = async (address: string, index: string, value: string) => {
	await ethers.provider.send("hardhat_setStorageAt", [address, index, value]);
	await ethers.provider.send("evm_mine", []); // Just mines to the next block
};

const toBytes32 = (bn: BigNumber) => {
	return ethers.utils.hexlify(ethers.utils.zeroPad(bn.toHexString(), 32));
};
