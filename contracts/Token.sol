// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "hardhat/console.sol";

contract Token {
    string public name;
    string public symbol;
    uint8 public decimals = 18;
    uint256 public totalSupply;

    constructor(string memory _name, string memory _symbol, uint256 _totalSupply){
        //Code written here is executed when the contract is put on the blockchain
        name = _name;
        symbol = _symbol;
        totalSupply = _totalSupply * (10 ** decimals);
    }
}








