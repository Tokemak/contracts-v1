function serverReadyHandler(config) {
    process.env.HARDHAT_ALLOW_UNLIMITED_CONTRACT_SIZE = true;
}

module.exports = {
    skipFiles: [
        "airdrop/AirdropPush.sol",
        "redeem/Redeem.sol",
        "rewards/RewardsManager.sol",
        "defi-round/DefiRound.sol",
        "core/CoreEvent.sol",
        "testnet/TestnetToken.sol",
        "testnet/TestOracle.sol",
        "openzeppelin/mocks/ERC1271WalletMock.sol",
    ],
    onServerReady: serverReadyHandler,
};
