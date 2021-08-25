// SPDX-License-Identifier: MIT
pragma solidity >=0.8.6 <0.9.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "./IBet.sol";

contract IBetFaucetV1 is Ownable, Pausable {
   address constant private FAUCET_ADDRESS = 0x78205d7205fA5a0dB15B21F39B01cF99a337fB5C;

   IBet private sureBetToken;

   event FaucetDisbursed(address indexed addr, uint256 amountOfCoins);

   constructor(address sureBetTokenContract)
   {
      sureBetToken = IBet(sureBetTokenContract);
   }

   function requestFromFaucet() public whenNotPaused {
      uint256 amountTobeDisbursed = 1 * 1000000000000000000;
      sureBetToken.transferBetweenAccounts(FAUCET_ADDRESS, msg.sender, amountTobeDisbursed);
      emit FaucetDisbursed(msg.sender, amountTobeDisbursed);
   }

   function pause() public onlyOwner {
      _pause();
   }

   function unpause() public onlyOwner {
      _unpause();
   }
}