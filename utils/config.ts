export enum Environment {
	MAINNET = "mainnet",
	GOERLI = "goerli",
}

export enum ManagerRoles {
	ADD_LIQUIDITY_ROLE = "ADD_LIQUIDITY_ROLE",
	REMOVE_LIQUIDITY_ROLE = "REMOVE_LIQUIDITY_ROLE",
	MISC_OPERATION_ROLE = "MISC_OPERATION_ROLE",
}

export enum Contract {
	VOTE_TRACKER_CORE = "vote-tracker-core",
	CORE3_VOTE_TRACKER = "core3-vote-tracker",
	CORE3_ON_CHAIN_VOTE = "core3-on-chain-vote",
	VOTE_TRACKER_LD = "vote-tracker-ld",
	BALANCE_TRACKER = "balance-tracker",
	EVENT_PROXY = "event-proxy",
	WETH_POOL = "eth-pool",
	TOKE_POOL = "toke-pool",
	MANAGER = "manager",
	UNI_POOL = "uni-pool",
	SUSHI_POOL = "sushi-pool",
	USDC_POOL = "usdc-pool",
	FX_ROOT = "fx-root",
	POLYGON_STATE_SENDER = "polygon-state-sender",
	STAKING = "staking",
	POOL_IMPLEMENTATION = "pool-implementation",
	PROXY_ADMIN = "proxy-admin",
	PROXY_ADMIN_2 = "proxy-admin-2", // not sure why 2?
	ON_CHAIN_VOTE_L1_CORE = "on-chain-vote-l1-core",
	ON_CHAIN_VOTE_L1_LD = "on-chain-vote-l1-ld",
	FX_CHILD = "fx-child",
	PROXY_ADMIN_POLYGON = "proxy-admin-polygon",
	DEV_COORDINATOR_MULTISIG = "dev-coordinator-multisig",
	ADDRESS_REGISTRY = "address-registry",
	THIRDPARTY_CURVE_ADDRESS_PROVIDER = "thirdparty-curve-address-provider",
	REWARDS = "rewards",
	CYCLE_ROLLOVER_TRACKER = "cycle-rollover-tracker",
	TREASURY = "treasury",
	DELEGATE = "delegate",
	REWARDS_SIGNER_WETH = "rewards-signer-weth",
	ACC_TOKE = "acc-toke",
	WETH_REWARDS = "weth-rewards",
	WETH_REWARDS_HASH = "weth-rewards-hash",

	UNI_FACTORY = "uni-factory",
	UNI_ROUTER = "uni-router",
	SUSHI_FACTORY = "sushi-factory",
	SUSHI_ROUTER = "sushi-router",
	MASTERCHEF_V1 = "masterchef-v1",
	MASTERCHEF_V2 = "masterchef-v2",
	CURVE_POOL_FACTORY = "curve-pool-factory",

	CONVEX_BOOSTER = "convex-booster",

	// erc20
	TOKE = "toke",
	WBTC = "wbtc",
	WETH = "weth",
	USDC = "usdc",
	DAI = "dai",
	FRAX = "frax",
	USDT = "usdt",
	RULER = "ruler",
	AAVE = "aave",
	LINK = "link",
	SUSHI = "sushi",
	CURVE_TOKEN = "curve",
	CONVEX_TOKEN = "convex",
	FXS = "fxs",
	BAL = "bal",
	ALCX = "alcx",
	OHM = "ohm",
	TCR = "tcr",
	FOX = "fox",

	// misc
	CURVE_3_POOL_LP = "curve-3pool-lp",
	CURVE_3_POOL_LP_V2 = "curve-3pool-lp-v2",
	LUSD3CRV = "lusd3crv",
	CRVFRAX = "crvfrax",

	ETH = "eth",
	ETH_REGISTRY = "eth-registry",

	DEPLOYER = "deployer",
	DEFI_ADDRESS = "defiaddress",
}

export type ContractAddressByName = Partial<Record<Contract, string>>;

export type ContractAddressByEnvironment = Record<Environment, ContractAddressByName>;

export const contractAddressByEnvironment: ContractAddressByEnvironment = {
	[Environment.MAINNET]: {
		[Contract.VOTE_TRACKER_CORE]: "0x63368f34B84C697d9f629F33B5CAdc22cb00510E",
		[Contract.VOTE_TRACKER_LD]: "0x7A9A3395afB32F923a142dBC56467Ae5675Ce5ec",
		[Contract.BALANCE_TRACKER]: "0xBC822318284aD00cDc0aD7610d510C20431e8309",
		[Contract.EVENT_PROXY]: "0x7f4fb56b9C85bAB8b89C8879A660f7eAAa95a3A8",
		[Contract.WETH_POOL]: "0xD3D13a578a53685B4ac36A1Bab31912D2B2A2F36",
		[Contract.TOKE_POOL]: "0xa760e26aA76747020171fCF8BdA108dFdE8Eb930",
		[Contract.MANAGER]: "0xA86e412109f77c45a3BC1c5870b880492Fb86A14",
		[Contract.UNI_POOL]: "0x1b429e75369ea5cd84421c1cc182cee5f3192fd3",
		[Contract.SUSHI_POOL]: "0x8858A739eA1dd3D80FE577EF4e0D03E88561FaA3",
		[Contract.USDC_POOL]: "0x04bDA0CF6Ad025948Af830E75228ED420b0e860d",
		[Contract.FX_ROOT]: "0xfe5e5D361b2ad62c541bAb87C45a0B9B018389a2",
		[Contract.STAKING]: "0x96F98Ed74639689C3A11daf38ef86E59F43417D3",
		[Contract.TOKE]: "0x2e9d63788249371f1DFC918a52f8d799F4a38C94",
		[Contract.POOL_IMPLEMENTATION]: "0xd899ac9283a44533c36BC8373F5c898b0d5fC03E",
		[Contract.PROXY_ADMIN]: "0xc89F742452F534EcE603C7B62dF76102AAcF00Df",
		[Contract.PROXY_ADMIN_2]: "0xd813b2a8a0c206dC2E5Ff7A44E11fd0396C51A21",
		[Contract.ON_CHAIN_VOTE_L1_CORE]: "0xc6807BB6F498337e0DC388D6507666aF7566E0BB",
		[Contract.ON_CHAIN_VOTE_L1_LD]: "0x43094eD6D6d214e43C31C38dA91231D2296Ca511",
		[Contract.FX_CHILD]: "0x8397259c983751DAf40400790063935a11afa28a",
		[Contract.POLYGON_STATE_SENDER]: "0x28e4F3a7f651294B9564800b2D01f35189A5bFbE",
		[Contract.PROXY_ADMIN_POLYGON]: "0x2650D4e7Cb4402c6B999EED1AA920A939072e28f",
		[Contract.DEV_COORDINATOR_MULTISIG]: "0x90b6C61B102eA260131aB48377E143D6EB3A9d4B",
		[Contract.ADDRESS_REGISTRY]: "0x28cB0DE9c70ba1B5116Df57D0c421770B5f44D45",
		[Contract.THIRDPARTY_CURVE_ADDRESS_PROVIDER]: "0x0000000022D53366457F9d5E68Ec105046FC4383",
		[Contract.REWARDS]: "0x79dD22579112d8a5F7347c5ED7E609e60da713C5",
		[Contract.CYCLE_ROLLOVER_TRACKER]: "0x394a646b7becc8972b531cDEb9055D4057E31f85",
		[Contract.TREASURY]: "0x8b4334d4812C530574Bd4F2763FcD22dE94A969B",
		[Contract.DELEGATE]: "0x3bc59A43d82C1acF3a597652eaDD3a02082D3671",
		[Contract.CORE3_VOTE_TRACKER]: "0xE06229F72124C7936E42C6Fbd645EE688419D5e5",
		[Contract.CORE3_ON_CHAIN_VOTE]: "0xa1A7ECE4d54F1403187f81880346962f667721Dd",

		[Contract.WETH]: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
		[Contract.FRAX]: "0x853d955aCEf822Db058eb8505911ED77F175b99e",
		[Contract.USDC]: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
		[Contract.WBTC]: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
		[Contract.DAI]: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
		[Contract.USDT]: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
		[Contract.RULER]: "0x2aECCB42482cc64E087b6D2e5Da39f5A7A7001f8",
		[Contract.AAVE]: "0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9",
		[Contract.LINK]: "0x514910771AF9Ca656af840dff83E8264EcF986CA",
		[Contract.SUSHI]: "0x6B3595068778DD592e39A122f4f5a5cF09C90fE2",
		[Contract.CURVE_TOKEN]: "0xD533a949740bb3306d119CC777fa900bA034cd52",
		[Contract.CONVEX_TOKEN]: "0x4e3FBD56CD56c3e72c1403e103b45Db9da5B9D2B",
		[Contract.FXS]: "0x3432B6A60D23Ca0dFCa7761B7ab56459D9C964D0",
		[Contract.BAL]: "0xba100000625a3754423978a60c9317c58a424e3D",
		[Contract.ALCX]: "0xdBdb4d16EdA451D0503b854CF79D55697F90c8DF",
		[Contract.OHM]: "0x383518188C0C6d7730D91b2c03a03C837814a899",
		[Contract.TCR]: "0x9C4A4204B79dd291D6b6571C5BE8BbcD0622F050",
		[Contract.FOX]: "0xc770EEfAd204B5180dF6a14Ee197D99d808ee52d",

		[Contract.CURVE_3_POOL_LP]: "0x6c3F90f043a72FA612cbac8115EE7e52BDe6E490",
		[Contract.CURVE_3_POOL_LP_V2]: "0xcA3d75aC011BF5aD07a98d02f18225F9bD9A6BDF",
		[Contract.CURVE_POOL_FACTORY]: "0xB9fC157394Af804a3578134A6585C0dc9cc990d4",
		[Contract.LUSD3CRV]: "0xEd279fDD11cA84bEef15AF5D39BB4d4bEE23F0cA",

		[Contract.CONVEX_BOOSTER]: "0xF403C135812408BFbE8713b5A23a04b3D48AAE31",

		[Contract.CRVFRAX]: "0x3175Df0976dFA876431C2E9eE6Bc45b65d3473CC",

		[Contract.UNI_FACTORY]: "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f",
		[Contract.UNI_ROUTER]: "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
		[Contract.SUSHI_FACTORY]: "0xC0AEe478e3658e2610c5F7A4A2E1777cE9e4f2Ac",
		[Contract.SUSHI_ROUTER]: "0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F",
		[Contract.MASTERCHEF_V1]: "0xc2EdaD668740f1aA35E4D8f227fB8E17dcA888Cd",
		[Contract.MASTERCHEF_V2]: "0xEF0881eC094552b2e128Cf945EF17a6752B4Ec5d",

		[Contract.ETH_REGISTRY]: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",

		[Contract.DEPLOYER]: "0x9e0bcE7ec474B481492610eB9dd5D69EB03718D5",
		[Contract.DEFI_ADDRESS]: "0xc803737D3E12CC4034Dde0B2457684322100Ac38",

		[Contract.REWARDS_SIGNER_WETH]: "0x1e9911562ebe2c6f3b487d1065a2ad6a31b50aa3",
		[Contract.ACC_TOKE]: "0xA374A62DdBd21e3d5716cB04821CB710897c0972",
		[Contract.WETH_REWARDS_HASH]: "0x3cCE05568008916d739479958f7a1AF5f67661DD",
		[Contract.WETH_REWARDS]: "0x086B9734D33783Bbe4fBc8249DF4C686aAe27054",
	},
	[Environment.GOERLI]: {
		[Contract.VOTE_TRACKER_CORE]: "0xBbB7279B5716bd9a8FFD010B6f9A79fE7A104720",
		[Contract.VOTE_TRACKER_LD]: "0x19E39678B2369089bCCD43780049D70ad6926BBE",
		[Contract.BALANCE_TRACKER]: "0x3917dE833541d4da3B228C1D1F87681B144f12c1",
		[Contract.EVENT_PROXY]: "0xd8A2E435BE384482816e6f922a4553E03bd71A35",
		[Contract.TOKE_POOL]: "0x156dE8C7e1EC3bBF4f62a3E30fe248Fe6505e56f",
		[Contract.MANAGER]: "0xe5dB5477F7787862116ff92E7d33A244A4ca35E0",
		[Contract.UNI_POOL]: "0xdE526D5A5123f99E7132b5De59024B2aF244299A",
		[Contract.SUSHI_POOL]: "0xC83CEDEA62e9d0B07da3D9e31b12c172dB7Cad41",
		[Contract.FX_ROOT]: "0x3d1d3e34f7fb6d26245e6640e1c50710efff15ba",
		[Contract.STAKING]: "0x925fa127FFADD451E02834434794b2B29a2eA353",
		[Contract.TOKE]: "0xdcC9439Fe7B2797463507dD8669717786E51a014",
		[Contract.POOL_IMPLEMENTATION]: "0x1A41B43B7Ce5207DB7388aA34cDB5d990Bf03b45",
		[Contract.PROXY_ADMIN]: "0x34aF6F5783c6C31680E49cEA7ABbCd4e5BD67117",
		[Contract.ON_CHAIN_VOTE_L1_CORE]: "0x89f472E710Bcf1781b9741240CeF4Ca79DAa810F",
		[Contract.ON_CHAIN_VOTE_L1_LD]: "0xFCe73bEa4Aa7FC8220Bb4C676a4D7Ad499ccb2cF",
		[Contract.FX_CHILD]: "0xCf73231F28B7331BBe3124B907840A94851f9f11",
		[Contract.PROXY_ADMIN_POLYGON]: "0x31535A105a23731a0eF3ff8C19C6389F98bB796c",
		[Contract.DEV_COORDINATOR_MULTISIG]: "0x3d146A937Ddada8AfA2536367832128F3F967E29",
		[Contract.ADDRESS_REGISTRY]: "0x93eC546fdcae65B10f2a409115612b2A21f53919",
		[Contract.THIRDPARTY_CURVE_ADDRESS_PROVIDER]: "0x668611fa31BdD556A03Aa57f934CC47cf076f560",
		[Contract.REWARDS]: "0x6e4F49C6A38b1eDb790Aa1E5cFe1732b9f0BC412",
		[Contract.CYCLE_ROLLOVER_TRACKER]: "0xE37013f2288F8a80DD81341d8F5C70099F245f4b",
		[Contract.TREASURY]: "0xf150b381a0eecc51f41014e488b1886e090f9a04",
		[Contract.DELEGATE]: "",
		[Contract.CORE3_VOTE_TRACKER]: "0xbaF050f8C4752A6AbAFbd5a7199694f7733c5be0",
		[Contract.CORE3_ON_CHAIN_VOTE]: "0xEc504056611db6e81Aec972547B30C0d2c5F90D7",

		[Contract.WETH]: "0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6",
		[Contract.USDC]: "0xCD5ce2Db0C92686820ec5Ce1c6294628dFeF38Cc",

		[Contract.REWARDS_SIGNER_WETH]: "0x572652a9bf635e92b245b16149f9a8b3fb1e0694",
		[Contract.ACC_TOKE]: "0x3E3858F5b81B7d4AcD749385D90d32e809922059",
		[Contract.WETH_REWARDS_HASH]: "0x14fBDc44a43b6D242752b8Bf27c3752cd43eB1b4",
		[Contract.WETH_REWARDS]: "0x13f7072B65c17b3D9C6Dd8d688529cC7bB87f5E8",
	},
};

export function getContractAddress(environment: Environment, name: Contract): string {
	const address = contractAddressByEnvironment?.[environment]?.[name];
	if (!address) {
		throw new Error(`unknown environment/contract for env = ${environment} and contract = ${name}`);
	}

	return address;
}

export enum StakingScheduleType {
	DEFAULT,
	INVESTOR,
}

export const getStakingNotionalAddress = (stakingScheduleType: StakingScheduleType): string => {
	switch (stakingScheduleType) {
		case StakingScheduleType.DEFAULT:
			return "0x1954d90213fdA53D35e76DB8f075a6216b8743A1";
		case StakingScheduleType.INVESTOR:
			return "0x96F98Ed74639689C3A11daf38ef86E59F43417D3"; //Same as prod Staking contract address so balances transfer
		default:
			throw "No notional";
	}
};

export const getChainIdByEnv = (
	env: Environment
): {
	l1: number;
	vote: number;
} => {
	switch (env) {
		case Environment.GOERLI:
			return { l1: 5, vote: 80001 };
		case Environment.MAINNET:
			return { l1: 1, vote: 137 };
		default:
			throw "Invalid Chain";
	}
};

const _whales: ContractAddressByEnvironment = {
	[Environment.MAINNET]: {
		[Contract.USDC]: "0x0548F59fEE79f8832C299e01dCA5c76F034F558e", // alternate: 0x6262998ced04146fa42253a5c0af90ca02dfd2a3 // alternate: 0x195E8cD1Cca12FD18643000C6D4e21B766d92A10
		[Contract.ETH]: "0xBE0eB53F46cd790Cd13851d5EFf43D12404d33E8",
		[Contract.WETH]: "0x06920c9fc643de77b99cb7670a944ad31eaaa260", // alternate2: 0x4f868c1aa37fcf307ab38d215382e88fca6275e2 alternate3: 0x2fEb1512183545f48f6b9C5b4EbfCaF49CfCa6F3
		[Contract.RULER]: "0x6BeF09F99Bf6d92d6486889Bdd8A374af151461D",
		[Contract.AAVE]: "0x26a78D5b6d7a7acEEDD1e6eE3229b372A624d8b7",
		[Contract.LINK]: "0x0D4f1ff895D12c34994D6B65FaBBeEFDc1a9fb39",
		[Contract.SUSHI]: "0x80845058350B8c3Df5c3015d8a717D64B3bF9267",
		[Contract.BAL]: "0x53a87B98E38cF1FE906422e624C6954421391f44",
		[Contract.ALCX]: "0x6bb8bc41e668b7c8ef3850486c9455b5c86830b3",

		[Contract.CURVE_3_POOL_LP]: "0x8174b025f8ab32708a85d036ce9e74a5b21727f7",
	},
	[Environment.GOERLI]: {},
};

export const getWhaleAddress = (environment: Environment, name: Contract): string => {
	const address = _whales?.[environment]?.[name];
	if (!address) {
		throw new Error(`unknown whale environment/contract for env = ${environment} and contract = ${name}`);
	}

	return address;
};
