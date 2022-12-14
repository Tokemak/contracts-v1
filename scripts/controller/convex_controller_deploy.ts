import { ethers, run } from "hardhat";
import { ConvexController__factory } from "../../typechain";
import { Contract, Environment, getContractAddress } from "utils/config";

export const main = async (): Promise<void> => {
	const ENV = Environment.MAINNET;

	const MANAGER_ADDRESS = getContractAddress(ENV, Contract.MANAGER);
	const ADDRESS_REGISTRY = getContractAddress(ENV, Contract.ADDRESS_REGISTRY);

	if (ENV != Environment.MAINNET) throw "Specify a CONVEX BOOSTER on not-mainnet";

	const CONVEX_BOOSTER = getContractAddress(ENV, Contract.CONVEX_BOOSTER);

	const [deployer] = await ethers.getSigners();

	const controllerFactory = new ConvexController__factory(deployer);
	const controller = await controllerFactory.deploy(
		MANAGER_ADDRESS,
		MANAGER_ADDRESS,
		ADDRESS_REGISTRY,
		CONVEX_BOOSTER
	);
	await controller.deployed();

	console.log(`Convex Controller Address ${controller.address}`);

	await new Promise((r) => setTimeout(r, 50000));

	try {
		await run("verify:verify", {
			address: controller.address,
			constructorArguments: [MANAGER_ADDRESS, MANAGER_ADDRESS, ADDRESS_REGISTRY, CONVEX_BOOSTER],
			contract: `contracts/controllers/ConvexController.sol:ConvexController`,
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
