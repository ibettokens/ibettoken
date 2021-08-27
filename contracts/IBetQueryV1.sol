// SPDX-License-Identifier: MIT
pragma solidity >=0.8.6 <0.9.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "./IBetData.sol";
import { Lib, ConversionUtil } from "./Lib.sol";

contract IBetQueryV1 is Ownable, Pausable {
   using SafeMath for uint256;

   IBetData private sureBetData;

   constructor(address sureBetDataContract)
   {
      sureBetData = IBetData(sureBetDataContract);
   }

   function getBetDetails(bytes32 betKey) public view returns (string[] memory){
      string[] memory betDetails = new string[](15);
      Lib.Bet memory bet = sureBetData.getBet(betKey);
      betDetails[0] = ConversionUtil.addressToString(bet.creator);
      betDetails[1] = bet.eventText;
      betDetails[2] = ConversionUtil.uintToString(bet.eventTime);
      betDetails[3] = ConversionUtil.uintToString(bet.betType);
      betDetails[4] = ConversionUtil.uintToString(bet.arbitrationType);
      betDetails[5] = ConversionUtil.uintToString(bet.amount);
      betDetails[6] = ConversionUtil.uintToString(bet.escrowBalance);
      betDetails[7] = sureBetData.getBetProperty(betKey, Lib.PROPERTIES_ARBITRATOR);
      betDetails[8] = sureBetData.getBetProperty(betKey, Lib.PROPERTIES_ARBITRATORNAME);
      betDetails[9] = sureBetData.getBetProperty(betKey, Lib.PROPERTIES_WIN_SCENARIO);
      betDetails[10] = sureBetData.getBetProperty(betKey, Lib.PROPERTIES_LOSE_SCENARIO);
      betDetails[11] = sureBetData.getBetProperty(betKey, Lib.PROPERTIES_CANCEL_SCENARIO);
      betDetails[12] = sureBetData.getBetProperty(betKey, Lib.PROPERTIES_ARBITRATOR_COMMISSION);
      betDetails[13] = sureBetData.getBetProperty(betKey, Lib.PROPERTIES_BET_AGAINST_AMOUNT);
      betDetails[14] = sureBetData.getBetProperty(betKey, Lib.PROPERTIES_STAKE_PERCENT_REQUIRED);
      return betDetails;
   }

   function getMyBets() public view returns (string memory){
      bytes32[] memory betsByAddress = sureBetData.getMyBetKeys(msg.sender);
      string memory betsString;
      if(betsByAddress.length>0)
      {
         for(uint256 index = 0; index < betsByAddress.length; index++){
            bytes32 betKey = betsByAddress[index];
            string memory addrString = ConversionUtil.addressToString(msg.sender);
            Lib.Bet memory bet = sureBetData.getBet(betKey);
            string memory betee = sureBetData.getBetProperty(betKey, Lib.PROPERTIES_BETEE);
            string memory arbitrator = sureBetData.getBetProperty(betKey, Lib.PROPERTIES_ARBITRATOR);
            if(Lib.compareStrings(ConversionUtil.addressToString(bet.creator),addrString))
            {
               betsString = Lib.strConcat(betsString, ConversionUtil.bytes32ToString(betKey), ",",ConversionUtil.uintToString(bet.eventTime),",", bet.eventText, ",1,", ConversionUtil.uintToString(bet.status),"|");
            }else if (Lib.compareStrings(betee, addrString)){
               betsString = Lib.strConcat(betsString, ConversionUtil.bytes32ToString(betKey), ",",ConversionUtil.uintToString(bet.eventTime),",", bet.eventText, ",2,", ConversionUtil.uintToString(bet.status),"|");
            }else if (Lib.compareStrings(arbitrator, addrString)){
               betsString = Lib.strConcat(betsString, ConversionUtil.bytes32ToString(betKey), ",",ConversionUtil.uintToString(bet.eventTime),",", bet.eventText, ",4,", ConversionUtil.uintToString(bet.status),"|");
            }
         }
      }
      return betsString;
   }

   function getOpenBets(uint16 year, uint16 month, uint16 day) public view returns (string memory){
      string memory betsString;
      for(uint256 index = 0; index < sureBetData.getOpenBetsCount(year,month, day, 0); index++){
         bytes32 betKey = sureBetData.getOpenBetAtIndex(year,month, day, 0, index);
         Lib.Bet memory bet = sureBetData.getBet(betKey);
         if(bet.eventTime > block.timestamp)
         {
            betsString = Lib.strConcat(betsString, ConversionUtil.bytes32ToString(betKey), ",",ConversionUtil.uintToString(bet.eventTime),",", bet.eventText, ",", ConversionUtil.uintToString(bet.amount),"|");
         }
      }
      return betsString;
   }

   

   function pause() public onlyOwner {
   _pause();
}

   function unpause() public onlyOwner {
   _unpause();
}

}