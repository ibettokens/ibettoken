// SPDX-License-Identifier: MIT
pragma solidity >=0.8.6 <0.9.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "./IBet.sol";
import { Lib, IterableMapping } from "./Lib.sol";

contract IBetData is Ownable, Pausable, ReentrancyGuard {

using SafeMath for uint256;

using IterableMapping for IterableMapping.Map;

IBet private sureBetToken;

address constant private ESCROW_ACCOUNT_ADDRESS = 0x4ADaFa1738F7e60Db3c0415Eb790eAf70010E291;

mapping(bytes32 => Lib.Bet) private bets;
mapping(bytes32 => Lib.BetProperties) private betProperties;

mapping(address => bytes32[]) private betsByAddress;

mapping(address => bool) private authorizedCallers;

mapping(bytes32 => IterableMapping.Map) private pendingArbitrationQueue;

mapping(uint32 => bytes32) private pendingArbitrationQueueMap;

mapping(bytes32 => Lib.ArbitrationState) private publicArbitrations;

mapping(bytes32 => Lib.SubmittedOutComeProperties) private submittedOutComeProperties;

mapping(uint16 => mapping(uint16 => mapping(uint16 => mapping(uint16 => IterableMapping.Map)))) private openBetsQueue;

uint256 private activeArbitratorCounter = 0;

// This will be used to determine the arbitratorCommissionPercent, it will exponentially lesson until the maxsupply is reached. once max supply is exhausted, betters will need to pay 0.35% commission
uint256 private totalBetSoFar = 0;
uint256 private totalBetCountSoFar = 0;
uint32 private arbitrationComplexityIndex = 1;

constructor(address ibetTokenContract) {
   sureBetToken = IBet(ibetTokenContract);
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

function saveBet(Lib.Bet memory bet)
public IsAuthorizedCaller returns (bool){
   bets[bet.betKey] = bet;
   return true;
}

function getServiceTokensDisbursedCount() public IsAuthorizedCaller view returns (uint256){
   return sureBetToken.getServiceTokensDisbursedCount();
}

function getMaxServiceTokensCount() public IsAuthorizedCaller view returns (uint256){
    return sureBetToken.getMaxServiceTokensCount();
}

function safeAddBetsToAddress(address addr, bytes32 betKey) public IsAuthorizedCaller {

      bool containsBet = false;
      for(uint256 index = 0; index < betsByAddress[addr].length; index++)
      {
         if(betsByAddress[addr][index] == betKey)
         {
            containsBet = true;
         }
      }
      if(containsBet == false)
      {
         betsByAddress[addr].push(betKey);
      }
}

function getBet(bytes32 betKey) public IsAuthorizedCaller view  returns (Lib.Bet memory bet)
{
   return bets[betKey];
}

function getBalanceOf(address account) public IsAuthorizedCaller view  returns (uint256)
{
   return sureBetToken.balanceOf(account);
}

function saveBetProperty(bytes32 betKey, string memory key, string memory value)
public IsAuthorizedCaller returns (bool){
   betProperties[betKey].properties[key] = value;
   return true;
}

function getBetProperty(bytes32 betKey, string memory key)
public IsAuthorizedCaller view returns (string memory){
   return betProperties[betKey].properties[key];
}

   function pause() public onlyOwner {
   _pause();
}

   function unpause() public onlyOwner {
   _unpause();
}

function reward(address rewardAddress, uint256 amount) public IsAuthorizedCaller returns (bool){
    return sureBetToken.reward(rewardAddress, amount);
}

function burn(address fromAddress, uint256 amount) public IsAuthorizedCaller returns (bool){
    return sureBetToken.burn(fromAddress, amount);
}

function transferToEscrow(address fromAddress, uint256 amount) public IsAuthorizedCaller returns (bool){
     require(fromAddress != address(0), "Cannot transfer from invalid address");
     sureBetToken.transferBetweenAccounts(fromAddress, ESCROW_ACCOUNT_ADDRESS, amount);
     return true;
}

function transferFromEscrow(address toAddress, uint256 amount) public IsAuthorizedCaller returns (bool){
   require(toAddress != address(0), "Cannot transfer to invalid address");
   sureBetToken.transferBetweenAccounts(ESCROW_ACCOUNT_ADDRESS, toAddress, amount);
   return true;
}

function getMyBetKeys(address addr) public IsAuthorizedCaller view returns (bytes32[] memory){
     return betsByAddress[addr];
}

function getOpenBetsCount(uint16 year, uint16 month, uint16 day, uint16 hour) public IsAuthorizedCaller view returns (uint){
   return openBetsQueue[year][month][day][hour].size();
}

function getOpenBetAtIndex(uint16 year, uint16 month, uint16 day, uint16 hour, uint256 index)
public IsAuthorizedCaller view returns (bytes32 betKey){
   return openBetsQueue[year][month][day][hour].getKeyAtIndex(index);
}

function removeOpenBetByValue(uint16 year, uint16 month, uint16 day, uint16 hour, bytes32 betKey) public IsAuthorizedCaller{
   return openBetsQueue[year][month][day][hour].remove(betKey);
}

function addOpenBetByValue(uint16 year, uint16 month, uint16 day, uint16 hour, bytes32 betKey, uint256 val) public IsAuthorizedCaller{
   return openBetsQueue[year][month][day][hour].set(betKey, val);
}

function getPendingArbitrationCount(bytes32 queueKey) public IsAuthorizedCaller view returns (uint){
   return pendingArbitrationQueue[queueKey].size();
}

function getPendingArbitrationAtIndex(bytes32 queueKey, uint256 index) public IsAuthorizedCaller view returns (bytes32){
   return pendingArbitrationQueue[queueKey].getKeyAtIndex(index);
}

function removePendingArbitrationByValue(bytes32 queueKey, bytes32 betKey) public IsAuthorizedCaller{
   return pendingArbitrationQueue[queueKey].remove(betKey);
}

function addPendingArbitrationByValue(bytes32 queueKey, bytes32 betKey, uint256 val) public IsAuthorizedCaller{
   return pendingArbitrationQueue[queueKey].set(betKey, val);
}

function getPendingArbitrationQueueMapKey(uint32 queue) public IsAuthorizedCaller view returns (bytes32){
   return pendingArbitrationQueueMap[queue];
}

function addPendingArbitrationQueueMapKey(uint32 queue, bytes32 queueKey) public IsAuthorizedCaller{
   pendingArbitrationQueueMap[queue] = queueKey;
}

function deletePendingArbitrationQueue(bytes32 queueKey) public IsAuthorizedCaller{
   delete pendingArbitrationQueue[queueKey];
}

function deletePendingArbitrationQueueMap(uint32 queue) public IsAuthorizedCaller{
   delete pendingArbitrationQueueMap[queue];
}

function getSubmittedOutComes(bytes32 betKey) public IsAuthorizedCaller view returns (Lib.SubmittedOutCome[] memory){
   return publicArbitrations[betKey].submittedOutComes;
}

function getSubmittedOutComesCount(bytes32 betKey) public IsAuthorizedCaller view returns (uint256){
   return publicArbitrations[betKey].submittedOutComes.length;
}

function addSubmittedOutcome(bytes32 betKey, Lib.SubmittedOutCome memory outcome) public IsAuthorizedCaller {
   publicArbitrations[betKey].submittedOutComes.push(outcome);
}

function getTotalBetSoFar() public IsAuthorizedCaller view returns (uint256){
   return totalBetSoFar;
}

function updateTotalBetSoFar(uint256 _totalBetSoFar) public IsAuthorizedCaller {
   totalBetSoFar = _totalBetSoFar;
}

function getActiveArbitratorCounter() public IsAuthorizedCaller view returns (uint256){
   return activeArbitratorCounter;
}

function updateActiveArbitratorCounter(uint256 _activeArbitratorCounter) public IsAuthorizedCaller {
   activeArbitratorCounter = _activeArbitratorCounter;
}

function getArbitrationComplexityIndex() public IsAuthorizedCaller view returns (uint32){
   return arbitrationComplexityIndex;
}

function updateArbitrationComplexityIndex(uint32 complexityIndex) public IsAuthorizedCaller {
   arbitrationComplexityIndex = complexityIndex;
}

function incrementTotalBetCountSoFar() public IsAuthorizedCaller {
   totalBetCountSoFar++;
}

function isOutcomeSubmittedBySubmitter(bytes32 betKey, address submitter) public IsAuthorizedCaller view returns (bool){
   return publicArbitrations[betKey].submissions[submitter];
}

function markSubmitterOutcomeSubmitted(bytes32 betKey, address submitter) public IsAuthorizedCaller {
   publicArbitrations[betKey].submissions[submitter] = true;
}

function saveSubmittedOutComeProperty(bytes32 submittedOutcomeKey, string memory key, string memory value)
public IsAuthorizedCaller returns (bool){
   submittedOutComeProperties[submittedOutcomeKey].properties[key] = value;
   return true;
}

function getSubmittedOutComeProperty(bytes32 submittedOutcomeKey, string memory key)
public IsAuthorizedCaller view returns (string memory){
   return submittedOutComeProperties[submittedOutcomeKey].properties[key];
}

}