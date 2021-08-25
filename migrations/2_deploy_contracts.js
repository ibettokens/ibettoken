const Lib = artifacts.require("Lib");
const IterableMapping = artifacts.require("IterableMapping");
const DateTime = artifacts.require("DateTime");
const ConversionUtil = artifacts.require("ConversionUtil");
const IBetBettingV1 = artifacts.require("IBetBettingV1");
const IBetQueryV1 = artifacts.require("IBetQueryV1");
const IBetArbitrationV1 = artifacts.require("IBetArbitrationV1");
const IBetEventOracleV1 = artifacts.require("IBetEventOracleV1");
const IBet = artifacts.require("IBet");
const IBetData = artifacts.require("IBetData");
const IBetFaucetV1 = artifacts.require("IBetFaucetV1");
var BigNumber = require('big-number');

const fs = require('fs');

module.exports = async (deployer) => {
    await deployer.deploy(Lib,  {gas: 8000000000});
    await deployer.deploy(IterableMapping,  {gas: 8000000000});
    await deployer.deploy(DateTime,  {gas: 8000000000});
    await deployer.deploy(ConversionUtil,  {gas: 8000000000});

    await deployer.link(Lib, IBet);
    await deployer.link(Lib, IBetData);
    await deployer.link(Lib, IBetBettingV1);
    await deployer.link(Lib, IBetArbitrationV1);
    await deployer.link(Lib, IBetEventOracleV1);
    await deployer.link(Lib, IBetQueryV1);

    await deployer.link(ConversionUtil, IBetBettingV1);
    await deployer.link(ConversionUtil, IBetArbitrationV1);
    await deployer.link(ConversionUtil, IBetEventOracleV1);
    await deployer.link(ConversionUtil, IBetQueryV1);
    
    
    await deployer.link(DateTime, IBetBettingV1);

    await deployer.link(IterableMapping, IBetData);

    await deployer.deploy(IBet,  {gas: 8000000000});
    await deployer.deploy(IBetFaucetV1, IBet.address, {gas: 8000000000});    
    await deployer.deploy(IBetData, IBet.address,  {gas: 8000000000});
    await deployer.deploy(IBetBettingV1, IBetData.address,  {gas: 8000000000});
    await deployer.deploy(IBetQueryV1, IBetData.address,  {gas: 8000000000});
    await deployer.deploy(IBetArbitrationV1, IBetData.address,  {gas: 8000000000});
    await deployer.deploy(IBetEventOracleV1, IBetData.address,  {gas: 8000000000});
    let config = {
        
            iBetAddress: IBet.address,
            dataAddress: IBetData.address,
            betAppAddress: IBetBettingV1.address,
            betQueryAddress: IBetQueryV1.address,
            arbitrationAppAddress: IBetArbitrationV1.address,
            oracleAddress: IBetEventOracleV1.address,
            faucetAddress: IBetFaucetV1.address
    }
    
    // Initial Setup
    let IBetInstance = await IBet.deployed();
    await IBetInstance.authorizeCaller(IBetData.address);
    await IBetInstance.authorizeCaller(IBetFaucetV1.address);

    let IBetDataInstance = await IBetData.deployed();
    await IBetDataInstance.authorizeCaller(IBetBettingV1.address);
    await IBetDataInstance.authorizeCaller(IBetArbitrationV1.address);
    await IBetDataInstance.authorizeCaller(IBetEventOracleV1.address);
    await IBetDataInstance.authorizeCaller(IBetQueryV1.address);

    fs.writeFileSync(__dirname + '/../src/ibetapp/src/assets/config.json',JSON.stringify(config, null, '\t'), 'utf-8');
    fs.copyFileSync(__dirname + '/../build/contracts/IBetBettingV1.json', __dirname + '/../src/ibetapp/src/assets/IBetBettingV1.json');
    fs.copyFileSync(__dirname + '/../build/contracts/IBetArbitrationV1.json', __dirname + '/../src/ibetapp/src/assets/IBetArbitrationV1.json');
    fs.copyFileSync(__dirname + '/../build/contracts/IBetEventOracleV1.json', __dirname + '/../src/ibetapp/src/assets/IBetEventOracleV1.json');
    fs.copyFileSync(__dirname + '/../build/contracts/IBetQueryV1.json', __dirname + '/../src/ibetapp/src/assets/IBetQueryV1.json');
    fs.copyFileSync(__dirname + '/../build/contracts/IBetFaucetV1.json', __dirname + '/../src/ibetapp/src/assets/IBetFaucetV1.json');
};