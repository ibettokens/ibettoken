const config = require('../assets/config-eth-mainnet.json');
export const environment = {
  production: true,
  chain: config.chain,
  iBetAddress : config.iBetAddress,
	dataAddress : config.dataAddress,
	betAppAddress: config.betAppAddress,
	betQueryAddress: config.betQueryAddress,
	arbitrationAppAddress: config.arbitrationAppAddress,
	oracleAddress: config.oracleAddress,
	faucetAddress: config.faucetAddress
};
