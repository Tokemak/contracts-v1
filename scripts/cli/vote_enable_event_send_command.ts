import * as yargs from "yargs";
import { Arguments } from "yargs";
import { getContractAddress, Environment, Contract } from "utils/config";
import { runVoteEventSend, VoteEventSendSetupInput } from "../voting/vote_event_send_setup";

const voteEventSendSetup: yargs.CommandModule = {
	command: "vote-enable-event-send",
	describe: "configure the appropriate pools and related contracts to send events",
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
	handler: runVoteEventSendSetup,
};

export default voteEventSendSetup;

const getConfig = (env: Environment) => {
	return [
		{
			address: getContractAddress(env, Contract.TOKE_POOL),
			enable: true,
			fxProxy: getContractAddress(env, Contract.FX_ROOT),
			l2Destination: getContractAddress(env, Contract.EVENT_PROXY),
		},
		{
			address: getContractAddress(env, Contract.UNI_POOL),
			enable: true,
			fxProxy: getContractAddress(env, Contract.FX_ROOT),
			l2Destination: getContractAddress(env, Contract.EVENT_PROXY),
		},
		{
			address: getContractAddress(env, Contract.SUSHI_POOL),
			enable: true,
			fxProxy: getContractAddress(env, Contract.FX_ROOT),
			l2Destination: getContractAddress(env, Contract.EVENT_PROXY),
		},
		{
			address: getContractAddress(env, Contract.MANAGER),
			enable: true,
			fxProxy: getContractAddress(env, Contract.FX_ROOT),
			l2Destination: getContractAddress(env, Contract.EVENT_PROXY),
		},
		{
			address: getContractAddress(env, Contract.STAKING),
			enable: true,
			fxProxy: getContractAddress(env, Contract.FX_ROOT),
			l2Destination: getContractAddress(env, Contract.EVENT_PROXY),
		},
	];
};

const configsByEnv: Record<Environment, VoteEventSendSetupInput[]> = {
	[Environment.GOERLI]: getConfig(Environment.GOERLI),
	[Environment.MAINNET]: getConfig(Environment.MAINNET),
};

export async function runVoteEventSendSetup(args: Arguments): Promise<void> {
	const targetEnv = args.environment as Environment;

	const configs = configsByEnv[targetEnv];

	if (!configs) {
		throw new Error(`unknown target env ${targetEnv}`);
	}

	await runVoteEventSend(configs);
}
