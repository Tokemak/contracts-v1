import { ethers, config } from "hardhat";

function _getHardhatWallet(accountIndex: number) {
	const accounts: any = config.networks.hardhat.accounts;
	return ethers.Wallet.fromMnemonic(accounts.mnemonic, accounts.path + `/${accountIndex}`);
}

export const getPrivateHardhatSignerAddress = (accountIndex: number): string => {
	const wallet = _getHardhatWallet(accountIndex);
	return wallet?.address;
};

export const getPrivateHardhatSignerKey = (accountIndex: number): string => {
	const wallet = _getHardhatWallet(accountIndex);

	return wallet?.privateKey;
};
