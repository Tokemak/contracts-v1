import * as yargs from "yargs";
import { Arguments } from "yargs";
import { getContractAddress, contractAddressByEnvironment, Environment, Contract } from "utils/config";
import {
	EventType,
	DelegationDesinationSetupInput,
	runDelegationDestinationSetup,
} from "../delegation/delegation_destination_setup";

const delegationDestinationSetup: yargs.CommandModule = {
	command: "delegation-destination-setup",
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
	handler: delegationDestinationSetupHandler,
};

export default delegationDestinationSetup;

const EVENTS = [EventType.DELEGATE_DISABLED, EventType.DELEGATE_ENABLED];

const getDelegationDestinations = (env: Environment) => {
	return [getContractAddress(env, Contract.BALANCE_TRACKER), getContractAddress(env, Contract.VOTE_TRACKER_LD)];
};

const getConfig = (env: Environment) => {
	const destinations = getDelegationDestinations(env);
	return [
		{
			sender: getContractAddress(env, Contract.DELEGATE),
			events: EVENTS,
			destinations: destinations,
		},
	];
};

const configsByEnv: Record<Environment, DelegationDesinationSetupInput[]> = {
	[Environment.GOERLI]: {} as any,
	[Environment.MAINNET]: getConfig(Environment.MAINNET),
};

export async function delegationDestinationSetupHandler(args: Arguments): Promise<void> {
	const targetEnv = args.environment as Environment;
	const configs = configsByEnv[targetEnv];
	const contractAddressByName = contractAddressByEnvironment[targetEnv];

	if (!configs || !contractAddressByName) {
		throw new Error(`unknown target env ${targetEnv}`);
	}

	for (const config of configs) {
		await runDelegationDestinationSetup(config, contractAddressByName[Contract.EVENT_PROXY]);
	}
}
