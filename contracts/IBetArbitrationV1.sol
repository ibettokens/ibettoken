// SPDX-License-Identifier: MIT
pragma solidity >=0.8.6 <0.9.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "./IBetData.sol";
import { Lib, IterableMapping, ConversionUtil } from "./Lib.sol";

contract IBetArbitrationV1 is Ownable, Pausable {
   using SafeMath for uint256;



IBetData private sureBetData;


event BetArbitrated(bytes32 indexed betKey, address indexed arbitrator);

event BetFinalized(bytes32 indexed betKey, string outcome);

event BetInArbitration(bytes32 indexed betKey);

struct ArbitratorQueue {
   bool isSet;
   uint32 queueIndex;
}

mapping(address => ArbitratorQueue) private arbitratorsQueue;

constructor(address sureBetDataContract)
{
   sureBetData = IBetData(sureBetDataContract);
}

function isServiceTokensExhausted() internal view returns (bool) {
   return sureBetData.getServiceTokensDisbursedCount() >= sureBetData.getMaxServiceTokensCount();
}

function arbitrateBet(bytes32 betKey, string memory outcome) public {
  require(arbitratorsQueue[msg.sender].isSet == true, "Arbitrator is not Registered.");

  require(Lib.compareStrings(outcome, "CREATOR_LOST") ||
  Lib.compareStrings(outcome,"CREATOR_WON") ||
  Lib.compareStrings(outcome,"CANCELLED"), "Invalid Outcome");

  Lib.Bet memory bet = sureBetData.getBet(betKey);
  require(bet.status == uint(Lib.BetStatus.INARBITRATION), "Not Ready for Arbitration.");
  if(bet.arbitrationType == uint(Lib.ArbitrationType.PRIVATE))
  {
    require(Lib.compareStrings(ConversionUtil.addressToString(msg.sender), sureBetData.getBetProperty(betKey, Lib.PROPERTIES_ARBITRATOR)),"UnAuthorized.");
  }
  require(bet.creator != msg.sender, "Creator cannot arbitrate.");


  if(bet.arbitrationType == uint(Lib.ArbitrationType.PRIVATE))
  {
      emit BetArbitrated(betKey, msg.sender);
      finalizeBet(betKey,outcome);
  } else {
      require(sureBetData.isOutcomeSubmittedBySubmitter(betKey, msg.sender) == false, "Duplicate Request.");
      require(Lib.compareStrings(ConversionUtil.uintToString(arbitratorsQueue[msg.sender].queueIndex),sureBetData.getBetProperty(betKey, Lib.PROPERTIES_PENDING_QUEUE)), "Wrong Queue. Please Refresh");

      uint256 stakePercentRequiredForBet = ConversionUtil.stringToUint(sureBetData.getBetProperty(betKey, Lib.PROPERTIES_STAKE_PERCENT_REQUIRED));
      uint256 stakeRequired = stakePercentRequiredForBet.mul(bet.amount).div(100).div(100000);
      require(sureBetData.getBalanceOf(msg.sender) >= stakeRequired, "Balance Insufficient for Stake.");
     
      if(sureBetData.getServiceTokensDisbursedCount() > stakeRequired)
      {
         sureBetData.burn(msg.sender, stakeRequired);
      }

      sureBetData.markSubmitterOutcomeSubmitted(betKey, msg.sender);
      bytes32 submittedOutComeKey = keccak256(abi.encodePacked(betKey, msg.sender, outcome));
      sureBetData.addSubmittedOutcome(betKey, Lib.SubmittedOutCome(submittedOutComeKey, msg.sender, outcome, stakeRequired));

      validateIfFinalized(betKey);
  }
}

function validateIfFinalized(bytes32 betKey) private {
   uint256 submittedOutComesCount = sureBetData.getSubmittedOutComesCount(betKey);
   if(submittedOutComesCount>2){
      Lib.SubmittedOutCome[] memory outcomes = sureBetData.getSubmittedOutComes(betKey);
      // last 3 match
         if(Lib.compareStrings(outcomes[submittedOutComesCount-2].outcome, outcomes[submittedOutComesCount-1].outcome, outcomes[submittedOutComesCount-3].outcome))
         {
            finalizeBet(betKey, outcomes[submittedOutComesCount-1].outcome);
         }
   }
}


function finalizeBet(bytes32 betKey, string memory finalOutcome) private {
   Lib.Bet memory bet = sureBetData.getBet(betKey);
   if(bet.arbitrationType == uint(Lib.ArbitrationType.PUBLIC))
   {
       uint256 submittedOutComesCount = sureBetData.getSubmittedOutComesCount(betKey);
        Lib.SubmittedOutCome[] memory outcomes = sureBetData.getSubmittedOutComes(betKey);
        uint256 totalArbitratorCommission = ConversionUtil.stringToUint(sureBetData.getBetProperty(betKey, Lib.PROPERTIES_ARBITRATOR_COMMISSION));
        // arbitartor 32 3each, 3.5 percent to owner, 0.5 for oracle
        for(uint256 i = 0;i<submittedOutComesCount; i++){
            // reward arbitrator with correct outcomes and return stake
            if(Lib.compareStrings(outcomes[i].outcome, finalOutcome)){
               uint256 arbitratorCommission = bet.amount.mul(totalArbitratorCommission).mul(32).div(100).div(100).div(100000);

               // fresh mint burnt stake balance
               sureBetData.reward(outcomes[i].arbitrator, outcomes[i].stake);

               // If service tokens exhausted
               if(isServiceTokensExhausted())
               {
                  // reward from escrow balance
                  sureBetData.transferFromEscrow(outcomes[i].arbitrator, arbitratorCommission);
                  bet.escrowBalance = bet.escrowBalance.sub(arbitratorCommission);
               }
              else {
                  // else reward from servicetokens
                  sureBetData.reward(outcomes[i].arbitrator, arbitratorCommission);
              }
            }
         }
      
         // reward contract owner
         uint256 creatorCommission = bet.amount.mul(totalArbitratorCommission).mul(35).div(1000).div(100).div(100000);
           if(isServiceTokensExhausted())
               {
                  sureBetData.transferFromEscrow(owner(), creatorCommission);
                  bet.escrowBalance = bet.escrowBalance.sub(creatorCommission);
               } else {
                  sureBetData.reward(owner(), creatorCommission);
               }

   } else {

         uint arbitratorCommissionProp = ConversionUtil.stringToUint(sureBetData.getBetProperty(betKey, Lib.PROPERTIES_ARBITRATOR_COMMISSION));
         address arbitrator = ConversionUtil.stringToAddress(sureBetData.getBetProperty(betKey, Lib.PROPERTIES_ARBITRATOR));
         uint256 creatorReward = bet.amount.mul(arbitratorCommissionProp).mul(35).div(1000).div(100).div(100000);
         if(arbitratorCommissionProp>0 && arbitrator != address(0))
         {
            uint256 arbitorReward = bet.amount.mul(arbitratorCommissionProp).mul(96).div(100).div(100).div(100000);
            bet.escrowBalance = bet.escrowBalance.sub(arbitorReward);
            sureBetData.transferFromEscrow(arbitrator, arbitorReward);

            sureBetData.transferFromEscrow(owner(), creatorReward);
            bet.escrowBalance = bet.escrowBalance.sub(creatorReward);
         }

         // If service tokens exhausted
         if(isServiceTokensExhausted() == false && arbitrator != address(0))
         {
            uint256 arbitorReward = bet.amount.mul(arbitratorCommissionProp).mul(32).div(100).div(100).div(100000);
            sureBetData.reward(arbitrator, arbitorReward);
         }

         // reward contract owner
         sureBetData.reward(owner(), creatorReward);
   }

   uint256 reward = bet.escrowBalance;
   bet.escrowBalance = 0;

   bet.status = uint8(Lib.BetStatus.FINALIZED);
   sureBetData.saveBet(bet);
   sureBetData.saveBetProperty(betKey, Lib.PROPERTIES_OUTCOME, finalOutcome);
   uint256 pendingQueue = ConversionUtil.stringToUint(sureBetData.getBetProperty(betKey, Lib.PROPERTIES_PENDING_QUEUE));
   bytes32 queueKey = sureBetData.getPendingArbitrationQueueMapKey(uint32(pendingQueue));
   sureBetData.removePendingArbitrationByValue(queueKey, betKey);

  if(Lib.compareStrings(finalOutcome,Lib.OUTCOME_CANCELLED)) {
      string memory betee = sureBetData.getBetProperty(betKey, Lib.PROPERTIES_BETEE);
      sureBetData.transferFromEscrow(ConversionUtil.stringToAddress(betee), reward.div(2));
      sureBetData.transferFromEscrow(bet.creator, reward.div(2));
   } else if(Lib.compareStrings(finalOutcome,Lib.OUTCOME_CREATOR_WON)){
      sureBetData.transferFromEscrow(bet.creator, reward);
   } else if(Lib.compareStrings(finalOutcome,Lib.OUTCOME_CREATOR_LOST)){
      string memory betee = sureBetData.getBetProperty(betKey, Lib.PROPERTIES_BETEE);
      sureBetData.transferFromEscrow(ConversionUtil.stringToAddress(betee), reward);
   }

   sureBetData.incrementTotalBetCountSoFar();
   emit BetFinalized(betKey, finalOutcome);
}

function registerAsArbitrator() public {

   if(arbitratorsQueue[msg.sender].isSet == false)
   {
      uint32 arbitratorsQueueIndex = getRandomIndex(msg.sender, sureBetData.getArbitrationComplexityIndex());
      arbitratorsQueue[msg.sender].queueIndex = arbitratorsQueueIndex;
      arbitratorsQueue[msg.sender].isSet = true;
      sureBetData.updateActiveArbitratorCounter(sureBetData.getActiveArbitratorCounter() + 1);
      return;
   }

   if(arbitratorsQueue[msg.sender].queueIndex > sureBetData.getArbitrationComplexityIndex()-1)
   {
      uint32 arbitratorsQueueIndex = getRandomIndex(msg.sender, sureBetData.getArbitrationComplexityIndex());
      arbitratorsQueue[msg.sender].queueIndex = arbitratorsQueueIndex;
   }
}

   function getMyPendingArbitrations() public view returns (string memory){
      if(arbitratorsQueue[msg.sender].isSet == false){
         return "NOTREGISTERED";
      }

      string memory betsString;
      bytes32[] memory betsByAddress = sureBetData.getMyBetKeys(msg.sender);
      if(betsByAddress.length > 0)
      {
         for(uint256 index = 0; index < betsByAddress.length; index++){
            bytes32 betKey = betsByAddress[index];
            string memory addrString = ConversionUtil.addressToString(msg.sender);
            string memory arbitrator = sureBetData.getBetProperty(betKey, Lib.PROPERTIES_ARBITRATOR);
            if (Lib.compareStrings(arbitrator, addrString))
            {
               Lib.Bet memory bet = sureBetData.getBet(betKey);
               betsString = Lib.strConcat(betsString, ConversionUtil.bytes32ToString(betKey), ",",ConversionUtil.uintToString(bet.eventTime),",", bet.eventText, ",1","|","");
            }
         }
      }

      uint32 arbitratorsQueueIndex = arbitratorsQueue[msg.sender].queueIndex;
      bytes32 queueKey = sureBetData.getPendingArbitrationQueueMapKey(uint32(arbitratorsQueueIndex));
      uint256 queueCount = sureBetData.getPendingArbitrationCount(queueKey);
      for(uint256 index = 0; index < queueCount; index++){
         bytes32 betKey = sureBetData.getPendingArbitrationAtIndex(queueKey, index);
         Lib.Bet memory bet = sureBetData.getBet(betKey);
         betsString = Lib.strConcat(betsString, ConversionUtil.bytes32ToString(betKey), ",",ConversionUtil.uintToString(bet.eventTime),",", bet.eventText, ",2","|","");
      }
      
      return betsString;
   }

   uint8 private nonce = 0;
   function getRandomIndex(address account, uint32 maxValue) internal returns (uint32)
   {
        // Pseudo random number...
        uint32 random = uint32(uint256(keccak256(abi.encodePacked(blockhash(block.number - nonce++), account))) % maxValue);

        if (nonce > 250) {
            nonce = 0;
        }
        return random;
   }

   function pause() public onlyOwner {
   _pause();
}

   function unpause() public onlyOwner {
   _unpause();
}

}