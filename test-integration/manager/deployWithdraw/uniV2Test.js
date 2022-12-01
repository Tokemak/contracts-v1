const UniV2Base = require("./uniV2Base");
const { Contract, Environment, getContractAddress } = require("utils/config");

const { artifacts } = require("hardhat");

const UniswapController = artifacts.require("UniswapController");
const IUniswapV2Factory = artifacts.require(
	"@uniswap/v2-core/contracts/interfaces/IUniswapV2Factory.sol:IUniswapV2Factory"
);
const IUniswapV2ERC20 = artifacts.require("@uniswap/v2-core/contracts/interfaces/IUniswapV2ERC20.sol:IUniswapV2ERC20");
const IUniswapV2Router02 = artifacts.require(
	"@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol:IUniswapV2Router02"
);

const UNISWAP_FACTORY_ADDRESS = getContractAddress(Environment.MAINNET, Contract.UNI_FACTORY);
const UNISWAP_ROUTER_ADDRESS = getContractAddress(Environment.MAINNET, Contract.UNI_ROUTER);

class UniV2Test extends UniV2Base {
	constructor(daiAddress, usdcAddress, manager, registry) {
		super(
			UniswapController,
			IUniswapV2Factory,
			IUniswapV2ERC20,
			IUniswapV2Router02,
			UNISWAP_FACTORY_ADDRESS,
			UNISWAP_ROUTER_ADDRESS,
			"UniswapController",
			"uniswap",
			daiAddress,
			usdcAddress,
			manager,
			registry
		);
	}
}

module.exports = UniV2Test;
