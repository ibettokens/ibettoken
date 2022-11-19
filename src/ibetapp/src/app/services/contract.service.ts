declare var require: any;

const IBetBettingV1 = require('../../assets/IBetBettingV1.json');
const IBetArbitrationV1 = require('../../assets/IBetArbitrationV1.json');
const IBetEventOracleV1 = require('../../assets/IBetEventOracleV1.json');
const IBetQueryV1 = require('../../assets/IBetQueryV1.json');
const IBetFaucetV1 = require('../../assets/IBetFaucetV1.json');
import { environment } from '../../environments/environment';
var BigNumber = require('big-number');
import { Injectable } from '@angular/core';
import Web3 from 'web3';
import Web3Modal from 'web3modal';
import WalletConnectProvider from '@walletconnect/web3-provider';
import { Subject } from 'rxjs';
import { Bet } from './shared.model';

@Injectable({
  providedIn: 'root',
})
export class ContractService {
  web3js: any;
  provider: any;
  accounts: any;
  contract: any;
  web3Modal;
  currentStdGasPrice: any = 30;

  private accountStatusSource = new Subject<any>();
  accountStatus$ = this.accountStatusSource.asObservable();

  constructor() {
    const providerOptions = {
      walletconnect: {
        package: WalletConnectProvider, // required
        options: {
          infuraId: 'd41a546a5f1a4ce9a89d26cc19ba5bf4', // required
        },
      },
    };

    this.web3Modal = new Web3Modal({
      network: 'mainnet', // optional
      cacheProvider: true, // optional
      providerOptions, // required
      theme: {
        background: 'rgb(39, 49, 56)',
        main: 'rgb(199, 199, 199)',
        secondary: 'rgb(136, 136, 136)',
        border: 'rgba(195, 195, 195, 0.14)',
        hover: 'rgb(16, 26, 32)',
      },
    });
  }

  async connectAccount() {
    this.provider = await this.web3Modal.connect(); // set provider
    this.web3js = new Web3(this.provider); // create web3 instance
    this.accounts = await this.web3js.eth.getAccounts();
    //let network = await this.web3js.eth.net.getId();
    this.currentStdGasPrice = await this.web3js.eth.getGasPrice();
    console.log("current gas price: " + this.currentStdGasPrice);
    const chainId = await this.web3js.eth.getChainId();
    let network = this.getNetworkFromChainId(chainId);
    //let amount = await this.web3js.eth.getBalance();
    this.accountStatusSource.next({account:this.accounts[0], network: network, chainId: chainId});
    return this.accounts;
  }
  getNetworkFromChainId(chainId: any) {
    if(chainId=="1337") return `Local(${chainId})`;
    if(chainId=="137") return `Polygon(${chainId})`;
    return `Unknown(${chainId})`;
  }

  async createBet(bet: Bet) {
    await this.connectAccount();

    let amountInCoins = BigNumber(bet.amount)
      .multiply(1000000000000000000)
      .toString();
    let betAgainstAmountInCoins = BigNumber(bet.betAgainstAmount)
      .multiply(1000000000000000000)
      .toString();
    let eventinputtime: any = new Date(bet.eventTimeString);
    let eventTime: any = Math.floor(eventinputtime / 1000);
    bet.eventTime = eventTime;
    let properties: any[] = [];
    let formattedCommission = bet.arbitratorCommission * 100000;
    let timestamp: any = Math.floor(Date.now() / 1000);

    //properties
    // properties[0] = string memory eventText,
    // properties[1] = string memory winScenario,
    // properties[2] = string memory loseScenario,
    // properties[3] = string memory cancelScenario,
    // properties[4] = string memory arbitratorName
    // properties[5] = string memory betAgainstAmount;
    // properties[6] = string memory arbitratorAddress;
    // properties[7] = string memory arbitratorCommission;
    properties.push(bet.eventText);
    properties.push(bet.winScenario);
    properties.push(bet.loseScenario);
    properties.push(bet.cancelScenario);
    properties.push(bet.arbitratorName);
    properties.push(betAgainstAmountInCoins);
    properties.push(bet.arbitrator);
    properties.push(formattedCommission);

    // this.provider = await this.web3Modal.connect(); // set provider
    // this.web3js = new Web3(this.provider); // create web3 instance
    // this.accounts = await this.web3js.eth.getAccounts();

    this.contract = new this.web3js.eth.Contract(
      IBetBettingV1.abi,
      environment.betAppAddress,
      {gasPrice: this.currentStdGasPrice, from: this.accounts[0]}
    );

    let self = this;
    return await new Promise(function (resolve, reject) {
        try{
      self.contract.methods
        .createBet(
          timestamp,
          amountInCoins,
          eventTime,
          bet.betType,
          bet.arbitratorType,
          properties
        )
        .send({ from: self.accounts[0] })
        .on('transactionHash', function (hash: any) {
          console.log(hash);
          // Store tx hash, so you can use that to check if tx failed or succedded
          resolve(hash);
          return hash; // send or return hash
        })
        .on('confirmation', function (confirmationNumber: any, receipt: any) {
            console.log('MMM', receipt);
          })
        .on('receipt', function (receipt: any) {
            console.log('DDD', receipt);
          })
        .on('error', function(error: any){
            reject(error);
        });
    }catch(exception){
            console.log(exception);
            reject(exception);
    }
    });

    //return result;
  }

  async getBetDetails(betkey: string) {
    await this.connectAccount();

    // --- temporarily re-initializating these for the effect file
    // this.provider = await this.web3Modal.connect(); // set provider
    // this.web3js = new Web3(this.provider); // create web3 instance
    // this.accounts = await this.web3js.eth.getAccounts();

    this.contract = new this.web3js.eth.Contract(
      IBetQueryV1.abi,
      environment.betQueryAddress
    );

    const result = await this.contract.methods
      .getBetDetails(betkey)
      .call({ from: this.accounts[0] });
    console.log(result);
    let bet: any = {};
    bet.betKey = betkey;
    bet.creator = result[0];
    bet.eventText = result[1];
    bet.eventTime = new Date(result[2] * 1000);
    bet.betType = result[3];
    bet.arbitratorType = result[4];
    bet.amount = result[5] / 1000000000000000000;
    bet.escrowBalance = result[6] / 1000000000000000000;
    bet.arbitrator = result[7];
    bet.arbitratorName = result[8];
    bet.winScenario = result[9];
    bet.loseScenario = result[10];
    bet.cancelScenario = result[11];
    bet.arbitratorCommission = result[12] / 100000;
    bet.betAgainstAmount = result[13] / 1000000000000000000;
    bet.stakePercentRequired = result[14] / 100000;
    return bet;
  }

  async acceptBet(betKey: string) {
    await this.connectAccount();

    // this.provider = await this.web3Modal.connect(); // set provider
    // this.web3js = new Web3(this.provider); // create web3 instance
    // this.accounts = await this.web3js.eth.getAccounts();

    this.contract = new this.web3js.eth.Contract(
      IBetBettingV1.abi,
      environment.betAppAddress,
      {gasPrice: this.currentStdGasPrice, from: this.accounts[0]}
    );
    this.contract.options.handleRevert = true;

    let self = this;
    return await new Promise(function (resolve, reject) {
      self.contract.methods
        .acceptBet(betKey)
        .send({ from: self.accounts[0] })
        .on('transactionHash', function (hash: any) {
          console.log(hash);
          // Store tx hash, so you can use that to check if tx failed or succedded
          resolve(hash);
          return hash; // send or return hash
        })
        .on('confirmation', function (confirmationNumber: any, receipt: any) {
          console.log('MMM', receipt);
        })
        .on('receipt', function (receipt: any) {
          console.log('DDD', receipt);
        })
        .on('error', function(error: any){
            reject(error);
        });
    });
  }

  async arbitrateBet(betKey: string, decisionOutcome: string) {
    await this.connectAccount();

    // this.provider = await this.web3Modal.connect(); // set provider
    // this.web3js = new Web3(this.provider); // create web3 instance
    // this.accounts = await this.web3js.eth.getAccounts();

    this.contract = new this.web3js.eth.Contract(
      IBetArbitrationV1.abi,
      environment.arbitrationAppAddress,
      {gasPrice: this.currentStdGasPrice, from: this.accounts[0]}
    );

    let self = this;
    return await new Promise(function (resolve, reject) {
      self.contract.methods
        .arbitrateBet(betKey, decisionOutcome)
        .send({ from: self.accounts[0] })
        .on('transactionHash', function (hash: any) {
          console.log(hash);
          // Store tx hash, so you can use that to check if tx failed or succedded
          resolve(hash);
        })
        .on('confirmation', function (confirmationNumber: any, receipt: any) {
          console.log('MMM', receipt);
        })
        .on('receipt', function (receipt: any) {
          console.log('DDD', receipt);
        })
        .on('error', function(error: any){
            reject(error);
        });
    });
  }

  async awakeArbitrationBet(betKey: string) {
    console.log(betKey);
    await this.connectAccount();

    // this.provider = await this.web3Modal.connect(); // set provider
    // this.web3js = new Web3(this.provider); // create web3 instance
    // this.accounts = await this.web3js.eth.getAccounts();

    this.contract = new this.web3js.eth.Contract(
        IBetEventOracleV1.abi,
        environment.oracleAddress,
        {gasPrice: this.currentStdGasPrice, from: this.accounts[0]}
    );

    let self = this;
    return await new Promise(function (resolve, reject) {
      self.contract.methods
        .awakeArbitrationBet(betKey)
        .send({ from: self.accounts[0] })
        .on('transactionHash', function (hash: any) {
          console.log(hash);
          // Store tx hash, so you can use that to check if tx failed or succedded
          resolve(hash);
        })
        .on('confirmation', function (confirmationNumber: any, receipt: any) {
          console.log('MMM', receipt);
        })
        .on('receipt', function (receipt: any) {
          console.log('DDD', receipt);
        })
        .on('error', function(error: any){
            reject(error);
        });
    });
  }
  async cancelBet(betKey: string) {
    console.log(betKey);
    await this.connectAccount();

    // this.provider = await this.web3Modal.connect(); // set provider
    // this.web3js = new Web3(this.provider); // create web3 instance
    // this.accounts = await this.web3js.eth.getAccounts();

    this.contract = new this.web3js.eth.Contract(
      IBetBettingV1.abi,
      environment.betAppAddress,
      {gasPrice: this.currentStdGasPrice, from: this.accounts[0]}
    );
    


    let self = this;
    return await new Promise(function (resolve, reject) {
      self.contract.methods
        .cancelBet(betKey)
        .send({ from: self.accounts[0] })
        .on('transactionHash', function (hash: any) {
          console.log(hash);
          // Store tx hash, so you can use that to check if tx failed or succedded
          resolve(hash);
        })
        .on('confirmation', function (confirmationNumber: any, receipt: any) {
          console.log('MMM', receipt);
        })
        .on('receipt', function (receipt: any) {
          console.log('DDD', receipt);
        })
        .on('error', function(error: any){
            reject(error);
        });
    });
  }

  async getMyPendingArbitrations() {
    // this.provider = await this.web3Modal.connect(); // set provider
    // this.web3js = new Web3(this.provider); // create web3 instance
    // this.accounts = await this.web3js.eth.getAccounts();
    await this.connectAccount();

    let contract = new this.web3js.eth.Contract(
      IBetArbitrationV1.abi,
      environment.arbitrationAppAddress
    );

    const result = await contract.methods
      .getMyPendingArbitrations()
      .call({ from: this.accounts[0] });

    console.log('getMyPendingArbitrations Result', result);
    if(result == "NOTREGISTERED"){
      throw new Error(result);
    }
    let pendingArbitrations = [];
    let arbitrationStrings = result.split('|');
    for (let i = 0; i < arbitrationStrings.length; i++) {
      if (i == arbitrationStrings.length - 1) continue;
      let arbitrationString = arbitrationStrings[i];
      let arbitrationArray = arbitrationString.split(',');
      let arbitrationType = '';
      if (arbitrationArray[3] == '2') {
        arbitrationType = 'Public';
      } else if (arbitrationArray[3] == '1') {
        arbitrationType = 'Private';
      }
      pendingArbitrations.push({
        betKey: arbitrationArray[0],
        arbitrationType: arbitrationType,
        eventText: arbitrationArray[2],
        eventTime: new Date(arbitrationArray[1] * 1000),
      });
    }
    return pendingArbitrations;
  }

  
  async registerAsArbitrator() {
    // this.provider = await this.web3Modal.connect(); // set provider
    // this.web3js = new Web3(this.provider); // create web3 instance
    // this.accounts = await this.web3js.eth.getAccounts();

    await this.connectAccount();

    this.contract = new this.web3js.eth.Contract(
      IBetArbitrationV1.abi,
      environment.arbitrationAppAddress,
      {gasPrice: this.currentStdGasPrice, from: this.accounts[0]}
    );

    let self = this;
    return await new Promise(function (resolve, reject) {
      self.contract.methods
        .registerAsArbitrator()
        .send({ from: self.accounts[0] })
        .on('transactionHash', function (hash: any) {
          console.log(hash);
          // Store tx hash, so you can use that to check if tx failed or succedded
          resolve(hash);
        })
        .on('confirmation', function (confirmationNumber: any, receipt: any) {
          console.log('MMM', receipt);
        })
        .on('receipt', function (receipt: any) {
          console.log('DDD', receipt);
        })
        .on('error', function(error: any){
            reject(error);
        });
    });
  }

  async requestFromFaucet() {
    // this.provider = await this.web3Modal.connect(); // set provider
    // this.web3js = new Web3(this.provider); // create web3 instance
    // this.accounts = await this.web3js.eth.getAccounts();

    await this.connectAccount();

    this.contract = new this.web3js.eth.Contract(
      IBetFaucetV1.abi,
      environment.faucetAddress,
      {gasPrice: this.currentStdGasPrice, from: this.accounts[0]}
    );

    let self = this;
    return await new Promise(function (resolve, reject) {
      self.contract.methods
        .requestFromFaucet()
        .send({ from: self.accounts[0] })
        .on('transactionHash', function (hash: any) {
          console.log(hash);
          // Store tx hash, so you can use that to check if tx failed or succedded
          resolve(hash);
        })
        .on('confirmation', function (confirmationNumber: any, receipt: any) {
          console.log('MMM', receipt);
        })
        .on('receipt', function (receipt: any) {
          console.log('DDD', receipt);
        })
        .on('error', function(error: any){
            reject(error);
        });
    });
  }

  async getOpenBetsWithTimeStamp(startDate : any, endDate : any) {
    // this.provider = await this.web3Modal.connect(); // set provider
    // this.web3js = new Web3(this.provider); // create web3 instance
    // this.accounts = await this.web3js.eth.getAccounts();

    await this.connectAccount();

    

    this.contract = new this.web3js.eth.Contract(
      IBetQueryV1.abi,
      environment.betQueryAddress
    );
 
    let eventTimeStart: any = Math.floor(startDate / 1000);
    let eventTimeEnd: any = Math.floor(endDate / 1000);
    const result = await this.contract.methods
      .getOpenBetsWithTimeStamp(eventTimeStart, eventTimeEnd)
      .call({ from: this.accounts[0] });

    let openBets = [];
    let resultArray = result.split('|');
    for (let i = 0; i < resultArray.length; i++) {
      if (i == resultArray.length - 1) continue;
      let eventStr = resultArray[i];
      let bet = eventStr.split(',');
      openBets.push({
        betKey: bet[0],
        eventText: bet[2],
        eventTime: new Date(bet[1] * 1000),
        amount: bet[3] / 1000000000000000000
      });
    }
    return openBets;
  }

  async getOpenBets(year : number, month : number, day: number) {
    // this.provider = await this.web3Modal.connect(); // set provider
    // this.web3js = new Web3(this.provider); // create web3 instance
    // this.accounts = await this.web3js.eth.getAccounts();

    await this.connectAccount();

    

    this.contract = new this.web3js.eth.Contract(
      IBetQueryV1.abi,
      environment.betQueryAddress
    );
    this.contract.options.handleRevert = true;

    const result = await this.contract.methods
      .getOpenBets(year, (month+1), day)
      .call({ from: this.accounts[0] });

    let openBets = [];
    let resultArray = result.split('|');
    for (let i = 0; i < resultArray.length; i++) {
      if (i == resultArray.length - 1) continue;
      let eventStr = resultArray[i];
      let bet = eventStr.split(',');
      openBets.push({
        betKey: bet[0],
        eventText: bet[2],
        eventTime: new Date(bet[1] * 1000),
        amount: bet[3] / 1000000000000000000
      });
    }
    return openBets;
  }

  getUTCDate(date: Date): Date {
    return new Date(date.valueOf() + date.getTimezoneOffset() * 60000);
  }

  getLocalDate(date: Date): Date {
    return new Date(date.valueOf() - date.getTimezoneOffset() * 60000);
  }

  async getMyBets() {
    await this.connectAccount();

    // --- temporarily re-initializating these for the effect file
    // this.provider = await this.web3Modal.connect(); // set provider
    // this.web3js = new Web3(this.provider); // create web3 instance
    // this.accounts = await this.web3js.eth.getAccounts();

    this.contract = new this.web3js.eth.Contract(
      IBetQueryV1.abi,
      environment.betQueryAddress
    );

    const result = await this.contract.methods
      .getMyBets()
      .call({ from: this.accounts[0] });

    let mybets = [];
    let betsAndRole = result.split('|');
    for (let i = 0; i < betsAndRole.length; i++) {
      if (betsAndRole[i].length == 0) continue;
      let bet = betsAndRole[i].split(',');

      let role = '';
      if (bet[3] == 1) {
        role = 'Creator';
      } else if (bet[3] == 2) {
        role = 'Betee';
      } else if (bet[3] == 3) {
        role = 'Arbitrator';
      }

      let status = '';
      if (bet[4] == 0) {
        status = 'Created';
      } else if (bet[4] == 1) {
        status = 'Accepted';
      } else if (bet[4] == 2) {
        status = 'WaitingArbitration';
      } else if (bet[4] == 3) {
        status = 'InArbitration';
      } else if (bet[4] == 4) {
        status = 'Finalized';
      } else if (bet[4] == 5) {
        status = 'Cancelled';
      }
      mybets.push({
        betKey: bet[0],
        role: role,
        status: status,
        eventText: bet[2],
        eventTime: new Date(bet[1] * 1000),
        eventTimePassed: new Date(bet[1] * 1000)< new Date(Date.now())
      });
    }

    return mybets;
  }
}
