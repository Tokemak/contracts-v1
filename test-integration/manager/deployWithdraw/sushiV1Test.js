const SushiBase = require("./sushiBase");
const { getContractAddress, Environment, Contract } = require("utils/config");

const { artifacts } = require("hardhat");

const SushiswapController = artifacts.require("SushiswapControllerV2");
const ISushiswapV2Factory = artifacts.require(
	"@sushiswap/core/contracts/uniswapv2/interfaces/IUniswapV2Factory.sol:IUniswapV2Factory"
);
const ISushiswapV2ERC20 = artifacts.require(
	"@sushiswap/core/contracts/uniswapv2/interfaces/IUniswapV2ERC20.sol:IUniswapV2ERC20"
);
const ISushiswapV2Router02 = artifacts.require(
	"@sushiswap/core/contracts/uniswapv2/interfaces/IUniswapV2Router02.sol:IUniswapV2Router02"
);

const SUSHISWAP_FACTORY_ADDRESS = getContractAddress(Environment.MAINNET, Contract.SUSHI_FACTORY);
const SUSHISWAP_ROUTER_ADDRESS = getContractAddress(Environment.MAINNET, Contract.SUSHI_ROUTER);
const MASTERCHEF_V1 = getContractAddress(Environment.MAINNET, Contract.MASTERCHEF_V1);

class SushiV1Test extends SushiBase {
	constructor(daiAddress, usdcAddress, manager, registry, poolId, deposit, depositAll, treasury) {
		super(
			SushiswapController,
			ISushiswapV2Factory,
			ISushiswapV2ERC20,
			ISushiswapV2Router02,
			SUSHISWAP_FACTORY_ADDRESS,
			SUSHISWAP_ROUTER_ADDRESS,
			"SushiswapControllerV1",
			"sushiswapv1",
			daiAddress,
			usdcAddress,
			manager,
			registry,
			MASTERCHEF_V1,
			poolId,
			deposit,
			depositAll,
			treasury
		);
	}
}

module.exports = SushiV1Test;
