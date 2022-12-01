import * as yargs from "yargs";
import { Arguments } from "yargs";
import { getContractAddress, contractAddressByEnvironment, Environment, Contract } from "utils/config";
import {
	EventType,
	runDestinationSetup,
	DesinationSetupInput,
} from "../cycle_rollover_tracker/cycle_rollover_tracker_setup";

const destinationSetup: yargs.CommandModule = {
	command: "cycle-rollover-tracker-setup",
	describe:
		"configure polygon event proxy to forward messages to target contracts (using preconfigured environments)",
	builder: (argv) => {
		argv.option("environment", {
			alias: "env",
			type: "string",
			describe: "target environment",
			demandOption: true,
			requiresArg: true,
			choices: Object.values(Environment),
		});
		return argv;
	},
	handler: destinationSetupHandler,
};

export default destinationSetup;

const getConfig = (env: Environment) => {
	return [
		{
			sender: getContractAddress(env, Contract.MANAGER),
			events: [EventType.CYCLE_ROLLOVER_START],
			destinations: [getContractAddress(env, Contract.CYCLE_ROLLOVER_TRACKER)],
		},
		{
			sender: getContractAddress(env, Contract.MANAGER),
			events: [EventType.CYCLE_ROLLOVER_COMPLETE],
			destinations: [
				getContractAddress(env, Contract.CYCLE_ROLLOVER_TRACKER),
				getContractAddress(env, Contract.VOTE_TRACKER_LD),
			],
		},
	];
};

const configsByEnv: Record<Environment, DesinationSetupInput[]> = {
	[Environment.GOERLI]: getConfig(Environment.GOERLI),
	[Environment.MAINNET]: getConfig(Environment.MAINNET),
};

export async function destinationSetupHandler(args: Arguments): Promise<void> {
	const targetEnv = args.environment as Environment;

	const configs = configsByEnv[targetEnv];
	const contractAddressByName = contractAddressByEnvironment[targetEnv];

	if (!configs || !contractAddressByName) {
		throw new Error(`unknown target env ${targetEnv}`);
	}

	for (const config of configs) {
		await runDestinationSetup(config, contractAddressByName[Contract.EVENT_PROXY]);
	}
}
