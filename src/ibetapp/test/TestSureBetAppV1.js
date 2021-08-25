var IBet = artifacts.require('IBet');
var IBetArbitrationV1 = artifacts.require('IBetArbitrationV1');
var IBetBettingV1 = artifacts.require('IBetBettingV1');
var IBetQueryV1 = artifacts.require('IBetQueryV1');
var IBetEventOracleV1 = artifacts.require('IBetEventOracleV1');
var BigNumber = require('big-number');

contract('TestSureBetAppV1', accounts => {

    const account_owner = accounts[0];
    const account_one = accounts[1];
    const account_two = accounts[2];
    const account_three = accounts[3];
    const account_four = accounts[4];
    const account_five = accounts[5];
    const account_six = accounts[6];
    const account_seven = accounts[7];
    const account_escrow = "0x4ADaFa1738F7e60Db3c0415Eb790eAf70010E291";

    console.log(accounts);

    before(async () => {    //#3
        let sureBet = await IBet.deployed();
        await sureBet.authorizeCaller(account_owner, { from: account_owner });
        await sureBet.reward(account_one, BigNumber(1).multiply(1000000000000000000).toString(), { from: account_owner });
        await sureBet.reward(account_two, BigNumber(1).multiply(1000000000000000000).toString(), { from: account_owner });
        await sureBet.reward(account_three, BigNumber(1).multiply(1000000000000000000).toString(), { from: account_owner });
        await sureBet.reward(account_four, BigNumber(1).multiply(1000000000000000000).toString(), { from: account_owner });
        await sureBet.reward(account_five, BigNumber(1).multiply(1000000000000000000).toString(), { from: account_owner });
        await sureBet.reward(account_six, BigNumber(1).multiply(1000000000000000000).toString(), { from: account_owner });
        await sureBet.reward(account_seven, BigNumber(1).multiply(1000000000000000000).toString(), { from: account_owner });
    });

    describe('match SureBetAppV1 spec', function () {
        beforeEach(async function () {

        })

    });

    describe('have ownership properties', function () {
        beforeEach(async function () {

        })
    });

    describe('create bet end to end', function () {
        beforeEach(async function () {

        })
        it('should create a bet', async function () {
            let bettingContract = await IBetBettingV1.deployed();
            let bettingQueryContract = await IBetQueryV1.deployed();
            let arbitrationContract = await IBetArbitrationV1.deployed();
            let eventOracleContract = await IBetEventOracleV1.deployed();
            let ibetContract = await IBet.deployed();

            /************************************************************** */
            /* CREATE BET
            /************************************************************** */
            let amount = 1;
            let amountInCoins = BigNumber(amount).multiply(1000000000000000000).toString();
            let betAgainstAmount = 1;
            let betAgainstAmountInCoins = BigNumber(betAgainstAmount).multiply(1000000000000000000).toString();
            let eventText = 'Test Event';
            let winScenario = 'Event 1 - Win Scenario';
            let loseScenario = 'Event 2 - Lose Scenario';
            let cancelScenario = 'Event 3 - Cancel Scenario';
            let future5secondsTime = new Date();
            future5secondsTime.setSeconds(future5secondsTime.getSeconds() + 5);
            let eventTime = Math.floor(future5secondsTime / 1000);

            let arbitratorName = "";
            let arbitratorAddress = "";
            let arbitratorCommission = "";
            let betType = 1;
            let arbitrationType = 1;
            let properties = [];

            let formattedCommission = arbitratorCommission * 100000;
            let timestamp = Math.floor(Date.now() / 1000);

            //properties
            // properties[0] = string memory eventText,
            // properties[1] = string memory winScenario,
            // properties[2] = string memory loseScenario,
            // properties[3] = string memory cancelScenario,
            // properties[4] = string memory arbitratorName
            // properties[5] = string memory betAgainstAmount;
            // properties[6] = string memory arbitratorAddress;
            // properties[7] = string memory arbitratorCommission;
            properties.push(eventText);
            properties.push(winScenario);
            properties.push(loseScenario);
            properties.push(cancelScenario);
            properties.push(arbitratorName);
            properties.push(betAgainstAmountInCoins);
            properties.push(arbitratorAddress);
            properties.push(formattedCommission);

            await bettingContract.createBet(
                timestamp,
                amountInCoins,
                eventTime,
                betType,
                arbitrationType,
                properties, { from: account_one });

            let bettorBalance = await ibetContract.balanceOf(account_one, { from: account_one });
            assert.equal('1000000000000000000', bettorBalance.toString(), "Betor is not correct");

            //TODO: check Mybets
            let date = new Date();
            console.log(date.getFullYear().toString() + "-" + (date.getMonth() + 1).toString()  + "-" + date.getDate().toString());
            let openBets = await bettingQueryContract.getOpenBets(date.getUTCFullYear().toString(), (date.getUTCMonth() + 1).toString(), date.getUTCDate().toString(), { from: account_one });
            console.log("Open Bets: " + openBets);
            let bet1 = openBets.split("|")[0].split(",")[0];

            /************************************************************** */
            /* ACCEPT BET
            /************************************************************** */
            await bettingContract.acceptBet(bet1, { from: account_two });

            let beteeBalance = await ibetContract.balanceOf(account_two, { from: account_two });
            assert.equal(0, beteeBalance.toString(), "Betee Balance is not correct");


            let escrowBalance = await ibetContract.balanceOf(account_escrow, { from: account_escrow });
            assert.equal('2000000000000000000' , escrowBalance.toString(), "Betee Balance is not correct");

            
            /************************************************************** */
            /* Awake ARBITRATION after Event Occurs
            /************************************************************** */
            
            await new Promise(resolve => setTimeout(resolve, 5000)); 
            
            await eventOracleContract.awakeArbitrationBet(bet1, { from: account_two });
            let oracleBalance = await ibetContract.balanceOf(account_two, { from: account_two });
            assert.equal('750000000000000000', oracleBalance.toString(), "Oracle Balance is not correct");

            /** Register all arbitrators as arbitrators */    

            
            await arbitrationContract.registerAsArbitrator({ from: account_three });
            await arbitrationContract.registerAsArbitrator({ from: account_four });
            await arbitrationContract.registerAsArbitrator({ from: account_five });
            await arbitrationContract.registerAsArbitrator({ from: account_six });
            await arbitrationContract.registerAsArbitrator({ from: account_seven });

            /************************************************************** */
            /* Arbitrate Event
            /************************************************************** */
            //TODO: use getOpenBets
            let betDetails = await bettingQueryContract.getBetDetails(bet1, { from: account_three });
            console.log(betDetails);

            await arbitrationContract.arbitrateBet(bet1, "CREATOR_LOST", { from: account_three });
            arbitrator1Balance = await ibetContract.balanceOf(account_three, { from: account_three });
            assert.equal('950000000000000000', arbitrator1Balance.toString(), "arbitrator1Balance is not correct");

            await arbitrationContract.arbitrateBet(bet1, "CREATOR_WON", { from: account_four });
            let arbitrator2Balance = await ibetContract.balanceOf(account_four, { from: account_four });
            assert.equal('950000000000000000', arbitrator2Balance.toString(), "arbitrator2Balance is not correct");

            await arbitrationContract.arbitrateBet(bet1, "CREATOR_LOST", { from: account_five });
            let arbitrator3Balance = await ibetContract.balanceOf(account_five, { from: account_five });
            assert.equal('950000000000000000', arbitrator3Balance.toString(), "arbitrator3Balance is not correct");

            await arbitrationContract.arbitrateBet(bet1, "CREATOR_LOST", { from: account_six });
            let arbitrator4Balance = await ibetContract.balanceOf(account_six, { from: account_six });
            assert.equal('950000000000000000', arbitrator4Balance.toString(), "arbitrator4Balance is not correct");
            
            await arbitrationContract.arbitrateBet(bet1, "CREATOR_LOST", { from: account_seven });

            //Post Resolution

            arbitrator2Balance = await ibetContract.balanceOf(account_four, { from: account_four });
            assert.equal('950000000000000000', arbitrator2Balance.toString(), "arbitrator2Balance is not correct post resolution");

            arbitrator4Balance = await ibetContract.balanceOf(account_six, { from: account_six });
            assert.equal('49000000000000000000', arbitrator4Balance.toString(), "arbitrator4Balance is not correct post resolution");
            
            let arbitrator5Balance = await ibetContract.balanceOf(account_seven, { from: account_seven });
            assert.equal('49000000000000000000', arbitrator5Balance.toString(), "arbitrator5Balance is not correct post resolution");

            arbitrator1Balance = await ibetContract.balanceOf(account_three, { from: account_three });
            assert.equal('49000000000000000000', arbitrator1Balance.toString(), "arbitrator1Balance is not correct post resolution");

            arbitrator3Balance = await ibetContract.balanceOf(account_five, { from: account_five });
            assert.equal('49000000000000000000', arbitrator3Balance.toString(), "arbitrator3Balance is not correct post resolution");

            creatorBalance = await ibetContract.balanceOf(account_owner, { from: account_owner });
            assert.equal('6250000000000000000', creatorBalance.toString(), "creatorBalance is not correct post resolution");
            
            let finalEscrowBalance = await ibetContract.balanceOf(account_escrow, { from: account_escrow });
            assert.equal('0' , finalEscrowBalance.toString(), "finalEscrowBalance is not correct post resolution");

        })

    });
})