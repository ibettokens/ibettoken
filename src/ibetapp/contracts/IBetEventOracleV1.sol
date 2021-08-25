// SPDX-License-Identifier: MIT
pragma solidity >=0.8.6 <0.9.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "./IBetData.sol";
import { Lib, ConversionUtil } from "./Lib.sol";

contract IBetEventOracleV1 is Ownable, Pausable {
   using SafeMath for uint256;
   using SafeMath for uint32;

   IBetData private sureBetData;

event BetInArbitration(bytes32 indexed betKey);

constructor(address sureBetDataContract)
{
   sureBetData = IBetData(sureBetDataContract);
}

function isServiceTokensExhausted() internal view returns (bool) {
   return sureBetData.getServiceTokensDisbursedCount() >= sureBetData.getMaxServiceTokensCount();
}

function awakeArbitrationBet(bytes32 betKey) public {
  Lib.Bet memory bet = sureBetData.getBet(betKey);
  require(block.timestamp > (bet.eventTime), "Event Time has not passed");
  require(bet.status ==  uint8(Lib.BetStatus.WAITINGARBITRATION), "Event Time has not passed");

   uint arbitratorCommissionProp = ConversionUtil.stringToUint(sureBetData.getBetProperty(betKey, Lib.PROPERTIES_ARBITRATOR_COMMISSION));
   uint256 oracleReward = bet.amount.mul(arbitratorCommissionProp).mul(5).div(1000).div(100).div(100000);
   if(isServiceTokensExhausted() == false)
   {
      sureBetData.reward(msg.sender, oracleReward);
   } else {
      bet.escrowBalance = bet.escrowBalance.sub(oracleReward);
      sureBetData.transferFromEscrow(msg.sender, oracleReward);
   }

   bet.status = uint8(Lib.BetStatus.INARBITRATION);
   sureBetData.saveBet(bet);

   // check to see if ComplexityIndex Needs to be increased.
   uint32 complexityIndex = sureBetData.getArbitrationComplexityIndex();
   uint32 betQueue = getRandomIndex(betKey, complexityIndex);

   bytes32 queueKey = sureBetData.getPendingArbitrationQueueMapKey(uint32(betQueue));
   if(queueKey == 0)
   {
      queueKey = keccak256(abi.encodePacked(msg.sender, queueKey, bet.betKey));
      sureBetData.addPendingArbitrationQueueMapKey(betQueue, queueKey);
   }

   if(sureBetData.getPendingArbitrationCount(queueKey) > 10)
   {
      sureBetData.updateArbitrationComplexityIndex(uint32(complexityIndex.add(1)));
   }

   sureBetData.saveBetProperty(betKey, Lib.PROPERTIES_PENDING_QUEUE, ConversionUtil.uintToString(betQueue));

   sureBetData.addPendingArbitrationByValue(queueKey, betKey, 1);

  emit BetInArbitration(bet.betKey);
}

   function updateArbitrationComplexityIndex(uint32 complexityIndex) public onlyOwner {
      sureBetData.updateArbitrationComplexityIndex(complexityIndex);
   }

   uint8 nonce = 0;

   function getRandomIndex(bytes32 betKey, uint32 maxValue) internal returns (uint32)
   {
        // Pseudo random number...
        uint32 random = uint16(uint256(keccak256(abi.encodePacked(blockhash(block.number - nonce++), betKey))) % maxValue);

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