var IBet = artifacts.require('IBet');
var BigNumber = require('big-number');

contract('TestIBet', accounts => {

    const account_owner = accounts[0];
    const account_one = accounts[1];
    const account_two = accounts[2];
    const account_three = accounts[3];
    const account_four = accounts[4];
    const account_five = accounts[5];


    describe('match SureBet spec', function () {
        beforeEach(async function () { 
            this.contract = await IBet.new({from: account_owner});
        })

        it('should return total supply', async function () { 
            let totalSupply = await this.contract.totalSupply.call();
            assert.equal(totalSupply.toString(), '1000000000000000000', "Total supply is not correct")
        })
    });

    describe('have ownership properties', function () {
        beforeEach(async function () { 
            this.contract = await IBet.new({from: account_owner});
        })

      
    });
})