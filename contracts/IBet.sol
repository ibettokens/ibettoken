// SPDX-License-Identifier: MIT
pragma solidity >=0.8.6 <0.9.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import { Lib } from "./Lib.sol";

contract IBet is ERC20("Crypto Bet","IBET"), Ownable, Pausable, ReentrancyGuard {
      using SafeMath for uint256;


mapping(address => bool) private authorizedCallers;

uint256 constant public MAX_SHARING_BONUS = 3328599575200 * 1000000000000000000;
uint256 private sharingBonusDisbursed = 0;
mapping(address => Lib.SharingBonusReceipt[]) private sharingBonusMap;
mapping(address => bool) private sharingBonusReceiverMap;
uint256 private sharingBonusDisbursedCount = 0;

uint256 constant public MAX_SERVICE_TOKENS = 1000000000000 * 1000000000000000000;
uint256 private serviceTokenDisbursed = 0;
uint256 constant private GENESIS_TOKEN = 1;

uint256 constant public MAX_SUPPLY = MAX_SHARING_BONUS + MAX_SERVICE_TOKENS;

constructor() {
   _mint(msg.sender, GENESIS_TOKEN * 1000000000000000000);
}

modifier IsAuthorizedCaller()
{
   require(authorizedCallers[msg.sender] == true, "Caller is not authorized");
    _;
}

function authorizeCaller(address _address) public onlyOwner {
   authorizedCallers[_address] = true;
}

function deAuthorizeCaller(address _address) public onlyOwner {
   authorizedCallers[_address] = false;
}

function getServiceTokensDisbursedCount() public IsAuthorizedCaller view returns (uint256){
   return serviceTokenDisbursed;
}

function getMaxServiceTokensCount() public IsAuthorizedCaller view returns (uint256){
   return MAX_SERVICE_TOKENS;
}

function reward(address rewardAddress, uint256 amount) public IsAuthorizedCaller returns (bool){
    serviceTokenDisbursed = serviceTokenDisbursed.add(amount);
    _mint(rewardAddress, amount);
    return true;
}

function burn(address fromAddress, uint256 amount) public IsAuthorizedCaller returns (bool){
    serviceTokenDisbursed = serviceTokenDisbursed.sub(amount);
     _burn(fromAddress, amount);
     return true;
}

function transferBetweenAccounts(address fromAddress, address toAddress, uint256 amount) public IsAuthorizedCaller returns (bool){
     require(fromAddress != address(0), "Cannot transfer from invalid address");
      require(toAddress != address(0), "Cannot transfer to invalid address");
     _transfer(fromAddress, toAddress, amount);
     return true;
}

function transfer(address recipient, uint256 amount) public override returns (bool) {
  
   if(sharingBonusDisbursed < MAX_SHARING_BONUS && amount>0 && sharingBonusReceiverMap[recipient] != true)
   {
      if(sharingBonusMap[_msgSender()].length>0)
      {
         uint256 timesSharedInLast7Days = 0;
         uint8 i = 0;
         while (i < sharingBonusMap[_msgSender()].length) { // while loop
             if(block.timestamp.sub(sharingBonusMap[_msgSender()][i].timestamp)> 7 days){
               sharingBonusMap[_msgSender()][i] = sharingBonusMap[_msgSender()][sharingBonusMap[_msgSender()].length-1];
               sharingBonusMap[_msgSender()].pop();
               i--;
            } else {
               timesSharedInLast7Days++;
            }
           i++;
         }
         if(timesSharedInLast7Days<4){
            rewardSharingBonus(_msgSender(), recipient);
         }
      } else
      {
        rewardSharingBonus(_msgSender(), recipient);
      }
   }

   _transfer(_msgSender(), recipient, amount);
   return true;
}

function rewardSharingBonus(address sender, address recipient) private {
   // only every 7 days
   uint256 rewardBonus = Lib.calculateSharingBonus(sharingBonusDisbursedCount);
   sharingBonusDisbursed = sharingBonusDisbursed.add(rewardBonus);
   sharingBonusMap[sender].push(Lib.SharingBonusReceipt(recipient, block.timestamp));
   sharingBonusReceiverMap[recipient] = true;
   sharingBonusDisbursedCount = sharingBonusDisbursedCount + 1;
   _mint(sender, rewardBonus);
}
}