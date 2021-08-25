// SPDX-License-Identifier: MIT
pragma solidity >=0.8.6 <0.9.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "./IBetData.sol";
import { Lib, DateTime, ConversionUtil } from "./Lib.sol";

contract IBetBettingV1 is Ownable, Pausable {
   using SafeMath for uint256;

   enum BetVersion {
      V1
   }

   IBetData private sureBetData;

   event BetCreated(bytes32 indexed betKey, uint indexed betType, address indexed betor, uint256 amount);

   event BetAccepted(bytes32 indexed betKey, address indexed acceptor);

   event BetCancelled(bytes32 indexed betKey, address indexed sender);

   event BetAwaitingArbitration(bytes32 indexed betKey, uint eventTime);

   // 5% * 100000
   uint256 private stakePercentRequired = 500000;

   // 0.35%
   uint256 private postExhaustionArbitratorCommissionPercent = 35000;

   constructor(address sureBetDataContract)
   {
      sureBetData = IBetData(sureBetDataContract);
   }

   function UpdateStakePercentRequired(uint256 inputStakePercentRequired) public onlyOwner
   {
      require(inputStakePercentRequired > 100, "This is too low");
      stakePercentRequired = inputStakePercentRequired;
   }

   function UpdateArbitratorCommissionPercent(uint256 inputArbitratorCommissionPercent) public onlyOwner
   {
      require(inputArbitratorCommissionPercent > 100, "This is too low");
      postExhaustionArbitratorCommissionPercent = inputArbitratorCommissionPercent;
   }

   function createBet(uint256 timestamp, uint256 amount, uint256 eventTime,
   uint8 betType,
   uint8 arbitrationType,
   string[] memory properties
   )
   public
   {
      require(sureBetData.getBalanceOf(msg.sender) >= amount, "Insufficient balance to place this bet.");
      //properties
      // properties[0] = string memory eventText,
      // properties[1] = string memory winScenario,
      // properties[2] = string memory loseScenario,
      // properties[3] = string memory cancelScenario,
      // properties[4] = string memory arbitratorName
      bytes32 betKey = keccak256(abi.encodePacked(msg.sender, amount, timestamp));
      sureBetData.transferToEscrow(msg.sender, amount);

      Lib.Bet memory bet = Lib.Bet(uint16(BetVersion.V1),
      betKey,
      msg.sender,
      properties[0],
      eventTime,
      betType,
      arbitrationType,
      uint8(Lib.BetStatus.CREATED),
      amount,
      amount);

      sureBetData.saveBet(bet);

      sureBetData.saveBetProperty(betKey, Lib.PROPERTIES_WIN_SCENARIO, properties[1]);
      sureBetData.saveBetProperty(betKey, Lib.PROPERTIES_LOSE_SCENARIO, properties[2]);
      sureBetData.saveBetProperty(betKey, Lib.PROPERTIES_CANCEL_SCENARIO, properties[3]);
      sureBetData.saveBetProperty(betKey, Lib.PROPERTIES_BET_AGAINST_AMOUNT, properties[5]);
      sureBetData.safeAddBetsToAddress(bet.creator, bet.betKey);
      sureBetData.updateTotalBetSoFar(sureBetData.getTotalBetSoFar().add(amount));

      if(arbitrationType == uint8(Lib.ArbitrationType.PRIVATE))
      {
         sureBetData.saveBetProperty(betKey, Lib.PROPERTIES_ARBITRATOR, properties[6]);
         sureBetData.saveBetProperty(betKey, Lib.PROPERTIES_ARBITRATORNAME, properties[4]);
         sureBetData.saveBetProperty(betKey, Lib.PROPERTIES_ARBITRATOR_COMMISSION, properties[7]);
         sureBetData.safeAddBetsToAddress(ConversionUtil.stringToAddress(properties[6]), bet.betKey);
      }
      if(betType == uint8(Lib.BetType.PUBLIC))
      {
         if(isServiceTokensExhausted() == false)
         {
            uint256 arbitratorCommissionPercent = calculatePublicArbitrationCommissionPercent();
            sureBetData.saveBetProperty(betKey, Lib.PROPERTIES_ARBITRATOR_COMMISSION, ConversionUtil.uintToString(arbitratorCommissionPercent));
         }else{
            sureBetData.saveBetProperty(betKey, Lib.PROPERTIES_ARBITRATOR_COMMISSION,  ConversionUtil.uintToString(postExhaustionArbitratorCommissionPercent));
         }
         sureBetData.saveBetProperty(betKey, Lib.PROPERTIES_STAKE_PERCENT_REQUIRED, ConversionUtil.uintToString(stakePercentRequired));
         (uint256 year, uint256 month, uint256 day, ,,) = DateTime.timestampToDateTime(bet.eventTime);
         sureBetData.addOpenBetByValue(uint16(year), uint16(month), uint16(day), 0, betKey, 1);
      }
      emit BetCreated(betKey, betType,  msg.sender, amount);
   }

   function isServiceTokensExhausted() internal view returns (bool) {
      return sureBetData.getServiceTokensDisbursedCount() >= sureBetData.getMaxServiceTokensCount();
   }

   function acceptBet(bytes32 betKey) public {

   Lib.Bet memory bet = sureBetData.getBet(betKey);
   require(bet.status == uint8(Lib.BetStatus.CREATED),"Status should be in created status.");
   require(bet.creator != msg.sender, "Creator cannot accept their own bet.");
   require(block.timestamp < bet.eventTime, "Event time has passed thus cannot be accepted.");

   uint256 betAgainstAmount = ConversionUtil.stringToUint(sureBetData.getBetProperty(betKey, Lib.PROPERTIES_BET_AGAINST_AMOUNT));
   require(sureBetData.getBalanceOf(msg.sender) >= betAgainstAmount, "Insufficient balance to accept this bet.");
   uint256 newEscrowBalance = bet.escrowBalance.add(betAgainstAmount);
   sureBetData.transferToEscrow(msg.sender, betAgainstAmount);
   bet.escrowBalance = newEscrowBalance;
   
   emit BetAccepted(bet.betKey, msg.sender);

   bet.status = uint8(Lib.BetStatus.WAITINGARBITRATION);
   emit BetAwaitingArbitration(bet.betKey, bet.eventTime);
   sureBetData.updateTotalBetSoFar(sureBetData.getTotalBetSoFar().add(betAgainstAmount));
   sureBetData.saveBet(bet);
   sureBetData.saveBetProperty(betKey, Lib.PROPERTIES_BETEE, ConversionUtil.addressToString(msg.sender));
   sureBetData.safeAddBetsToAddress(msg.sender, bet.betKey);
   if(bet.betType == uint8(Lib.BetType.PUBLIC)){
      (uint256 year, uint256 month, uint256 day,,,) = DateTime.timestampToDateTime(bet.eventTime);
      sureBetData.removeOpenBetByValue(uint16(year), uint16(month), uint16(day), 0, betKey);
   }
   }

   function cancelBet(bytes32 betKey) public {
   Lib.Bet memory bet = sureBetData.getBet(betKey);
   require(bet.creator == msg.sender, "Creator cannot only cancel their bet.");
   require(bet.status == uint8(Lib.BetStatus.CREATED), "Creator cannot only cancel not accepted bet.");
   uint256 amountToBeTransferredBack = bet.escrowBalance;
   bet.escrowBalance = 0;
   bet.status = uint8(Lib.BetStatus.CANCELLED);
   sureBetData.updateTotalBetSoFar(sureBetData.getTotalBetSoFar().sub(bet.amount));
   sureBetData.saveBet(bet);

   if(bet.betType == uint8(Lib.BetType.PUBLIC)){
      (uint256 year, uint256 month, uint256 day,,,) = DateTime.timestampToDateTime(bet.eventTime);
      sureBetData.removeOpenBetByValue(uint16(year), uint16(month), uint16(day), 0, betKey);
   }

   sureBetData.transferToEscrow(msg.sender, amountToBeTransferredBack);
   emit BetCancelled(bet.betKey, msg.sender);

   }

   function calculatePublicArbitrationCommissionPercent() internal view returns (uint256){
      uint256 totalBetSoFar = sureBetData.getTotalBetSoFar();
      // 15000*POWER((1-0.69),A1) starts off with 15000% and decay rate of 0.69 or 69% with every 10 multiplier
      if(totalBetSoFar < Lib.ibetTokenWithFullDecimals(10000)) return 15000.00 * 100000;
      if(totalBetSoFar < Lib.ibetTokenWithFullDecimals(100000)) return 4650.00 * 100000;
      if(totalBetSoFar < Lib.ibetTokenWithFullDecimals(1000000)) return 1441.50 * 100000;
      if(totalBetSoFar < Lib.ibetTokenWithFullDecimals(10000000)) return 446.86 * 100000;
      if(totalBetSoFar < Lib.ibetTokenWithFullDecimals(100000000)) return 138.52 * 100000;
      if(totalBetSoFar < Lib.ibetTokenWithFullDecimals(1000000000)) return 42.94 * 100000;
      if(totalBetSoFar < Lib.ibetTokenWithFullDecimals(10000000000)) return 13.31 * 100000;
      if(totalBetSoFar < Lib.ibetTokenWithFullDecimals(100000000000)) return 4.12 * 100000;
      if(totalBetSoFar < Lib.ibetTokenWithFullDecimals(1000000000000)) return 1.27 * 100000;
      return 1.00 * 100000;
   }

   function pause() public onlyOwner {
   _pause();
}

   function unpause() public onlyOwner {
   _unpause();
}
}