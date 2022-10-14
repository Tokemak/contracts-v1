import * as dotenv from "dotenv";
import "solidity-coverage";
import "hardhat-gas-reporter";
import "@nomiclabs/hardhat-ethers";
import "@nomiclabs/hardhat-waffle";
import "@nomiclabs/hardhat-truffle5";
import "@nomiclabs/hardhat-etherscan";
import "@openzeppelin/hardhat-upgrades";
import "@typechain/hardhat";
import "hardhat-contract-sizer";
import "./src/hardhat/curve-build-plugin";

import {HardhatUserConfig} from "hardhat/config";
type ContractSizer = {
    contractSizer: {
        runOnCompile: boolean;
    };
};
type HardhatConfig = HardhatUserConfig & ContractSizer;

dotenv.config();

const config: HardhatConfig = {
    networks: {
        hardhat: {
            // Default mnemonic:
            // "test test test test test test test test test test test junk"
            //accounts: [{privateKey: process.env.DEGENESIS_DEPLOYER!, balance: '10000000000000000000000'}],
            chainId: 1,
            forking: {
                blockNumber: 15461475,
                url: "https://eth-mainnet.alchemyapi.io/v2/" + process.env.ALCHEMY_API_KEY,
            },
            hardfork: "london",
            // accounts: {
            //   mnemonic: process.env.MNEMONIC,
            // },
        },
        localhost: {
            url: process.env.HARDHAT_LOCALHOST || "http://127.0.0.1:8545",
            timeout: 1000000,
        },
        goerli: {
            url: "https://eth-goerli.alchemyapi.io/v2/" + process.env.ALCHEMY_API_KEY_GOERLI,
            gas: 2100000,
            gasPrice: 8000000000,
        },
        mumbai: {
            url: "https://polygon-mumbai.g.alchemy.com/v2/" + process.env.ALCHEMY_API_KEY_MUMBAI,
            gas: 2100000,
            gasPrice: 8000000000,
            chainId: 80001,
        },
        polygon: {
            url: "https://polygon-mainnet.g.alchemy.com/v2/" + process.env.ALCHEMY_API_KEY_POLYGON,
            gasPrice: 100e9,
            chainId: 137,
            accounts: {
                mnemonic: process.env.MNEMONIC || "",
            },
        },
        mainnet: {
            url: "https://eth-mainnet.alchemyapi.io/v2/" + process.env.ALCHEMY_API_KEY,
            gasPrice: 100e9,
            accounts: {
                mnemonic: process.env.MNEMONIC || "",
            },
            timeout: 1000000,
        },
    },
    curveBuild: {
        coins: [2, 3, 4],
        debug: false,
    },
    solidity: {
        compilers: [
            {
                version: "0.6.11",
                settings: {
                    optimizer: {
                        enabled: true,
                        runs: 999,
                    },
                },
            },
            {
                version: "0.6.12", // For MasterChef contract
                settings: {
                    optimizer: {
                        enabled: true,
                        runs: 999999,
                    },
                },
            },
            {
                version: "0.7.6", // Voting
                settings: {
                    optimizer: {
                        enabled: true,
                        runs: 999999,
                    },
                },
            },
        ],
    },
    contractSizer: {
        runOnCompile: true,
    },
    mocha: {
        timeout: 1000000,
    },
    etherscan: {
        apiKey: process.env.ETHERSCAN_API_KEY || "",
    },
};

const goerliKey = process.env.GOERLI_PRIVATEKEY;
if (goerliKey && config.networks && config.networks.goerli && config.networks.mumbai) {
    config.networks.goerli.accounts = [goerliKey];
    config.networks.mumbai.accounts = [goerliKey];
}

const localhostDeployerAccount = process.env.HARDHAT_LOCALHOST_DEPLOYER_MNEMONIC;
if (localhostDeployerAccount) {
    if (config.networks?.localhost?.accounts)
        config.networks.localhost.accounts = {
            mnemonic: localhostDeployerAccount,
        };
}

const envMnemonic = process.env.MNEMONIC;
if (envMnemonic) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore: Object is possibly 'null'.
    config.networks.hardhat.accounts = {mnemonic: envMnemonic};
}

if (process.env.HARDHAT_FORK_URL) {
    if (config.networks?.hardhat?.forking) config.networks.hardhat.forking.url = process.env.HARDHAT_FORK_URL;
}
if (process.env.HARDHAT_CHAIN_ID) {
    if (config.networks?.hardhat?.chainId) config.networks.hardhat.chainId = parseInt(process.env.HARDHAT_CHAIN_ID);
}
if (process.env.HARDHAT_FORKING_BLOCK_NUMBER) {
    if (config.networks?.hardhat?.forking)
        config.networks.hardhat.forking.blockNumber = parseInt(process.env.HARDHAT_FORKING_BLOCK_NUMBER);
}
if (process.env.HARDHAT_ALLOW_UNLIMITED_CONTRACT_SIZE) {
    if (config.networks?.hardhat) {
        config.networks.hardhat.allowUnlimitedContractSize = true;
    }
}

export default config;
