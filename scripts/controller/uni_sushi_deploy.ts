import { ethers, run } from "hardhat";
import {
	ConvexController__factory,
	SushiswapControllerV1__factory,
	SushiswapControllerV2__factory,
	UniswapController__factory,
} from "../../typechain";
import { Contract, Environment, getContractAddress } from "utils/config";

export const main = async (): Promise<void> => {
	const ENV = Environment.MAINNET;

	const MANAGER_ADDRESS = getContractAddress(ENV, Contract.MANAGER);
	const ADDRESS_REGISTRY = getContractAddress(ENV, Contract.ADDRESS_REGISTRY);

	const [deployer] = await ethers.getSigners();

	const UNISWAP_FACTORY_ADDRESS = getContractAddress(Environment.MAINNET, Contract.UNI_FACTORY);
	const UNISWAP_ROUTER_ADDRESS = getContractAddress(Environment.MAINNET, Contract.UNI_ROUTER);
	const uniswapFactory = new UniswapController__factory(deployer);
	const uniswapController = await uniswapFactory.deploy(
		UNISWAP_ROUTER_ADDRESS,
		UNISWAP_FACTORY_ADDRESS,
		MANAGER_ADDRESS,
		ADDRESS_REGISTRY
	);
	await uniswapController.deployed();

	console.log(`Uniswap Controller Address ${uniswapController.address}`);

	const SUSHISWAP_FACTORY_ADDRESS_V1 = getContractAddress(Environment.MAINNET, Contract.SUSHI_FACTORY);
	const SUSHISWAP_ROUTER_ADDRESS_V1 = getContractAddress(Environment.MAINNET, Contract.SUSHI_ROUTER);
	const MASTERCHEF_V1 = getContractAddress(Environment.MAINNET, Contract.MASTERCHEF_V1);
	const sushiv1Factory = new SushiswapControllerV1__factory(deployer);
	const sushiv1Controller = await sushiv1Factory.deploy(
		SUSHISWAP_ROUTER_ADDRESS_V1,
		SUSHISWAP_FACTORY_ADDRESS_V1,
		MASTERCHEF_V1,
		MANAGER_ADDRESS,
		ADDRESS_REGISTRY
	);
	await sushiv1Controller.deployed();

	console.log(`SushiV1 Controller Address ${sushiv1Controller.address}`);

	const SUSHISWAP_FACTORY_ADDRESS_V2 = getContractAddress(Environment.MAINNET, Contract.SUSHI_FACTORY);
	const SUSHISWAP_ROUTER_ADDRESS_V2 = getContractAddress(Environment.MAINNET, Contract.SUSHI_ROUTER); // NOTE: confirmed same as v1 address by design as per codenutt
	const MASTERCHEF_V2 = getAddress(Environment.MAINNET, Contract.MASTERCHEF_V2);
	const sushiv2Factory = new SushiswapControllerV2__factory(deployer);
	const sushiv2Controller = await sushiv2Factory.deploy(
		SUSHISWAP_ROUTER_ADDRESS_V2,
		SUSHISWAP_FACTORY_ADDRESS_V2,
		MASTERCHEF_V2,
		MANAGER_ADDRESS,
		MANAGER_ADDRESS,
		ADDRESS_REGISTRY
	);
	await sushiv2Controller.deployed();

	console.log(`SushiV2 Controller Address ${sushiv2Controller.address}`);

	await new Promise((r) => setTimeout(r, 50000));

	try {
		await run("verify:verify", {
			address: uniswapController.address,
			constructorArguments: [
				UNISWAP_ROUTER_ADDRESS,
				UNISWAP_FACTORY_ADDRESS,
				MANAGER_ADDRESS,
				MANAGER_ADDRESS,
				ADDRESS_REGISTRY,
			],
			contract: `contracts/controllers/UniswapController.sol:UniswapController`,
		});
	} catch (e) {
		console.log("Verify failed, come back to it");
	}

	try {
		await run("verify:verify", {
			address: sushiv1Controller.address,
			constructorArguments: [
				SUSHISWAP_ROUTER_ADDRESS_V1,
				SUSHISWAP_FACTORY_ADDRESS_V1,
				MASTERCHEF_V1,
				MANAGER_ADDRESS,
				MANAGER_ADDRESS,
				ADDRESS_REGISTRY,
			],
			contract: `contracts/controllers/SushiswapControllerV1.sol:SushiswapControllerV1`,
		});
	} catch (e) {
		console.log("Verify failed, come back to it");
	}

	try {
		await run("verify:verify", {
			address: sushiv2Controller.address,
			constructorArguments: [
				SUSHISWAP_ROUTER_ADDRESS_V2,
				SUSHISWAP_FACTORY_ADDRESS_V2,
				MASTERCHEF_V2,
				MANAGER_ADDRESS,
				MANAGER_ADDRESS,
				ADDRESS_REGISTRY,
			],
			contract: `contracts/controllers/SushiSwapControllerV2.sol:SushiswapControllerV2`,
		});
	} catch (e) {
		console.log("Verify failed, come back to it");
	}
};

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});
