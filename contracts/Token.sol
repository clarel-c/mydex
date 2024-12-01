// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "hardhat/console.sol";

contract Token {
    string public name;
    string public symbol;
    uint8 public decimals = 18;
    uint256 public totalSupply;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    event Transfer(address indexed _from, address indexed _to, uint256 _value);
    event Approval(address indexed _owner, address indexed _spender, uint256 _value);

    constructor(string memory _name, string memory _symbol, uint256 _totalSupply){
        name = _name;
        symbol = _symbol;
        totalSupply = _totalSupply * (10 ** decimals);
        balanceOf[msg.sender] = totalSupply;
    }

    function transfer(address _to, uint256 _value) public returns (bool success) {
        // 1. Ensure that the caller has enough tokens to make the transfer.
        require(balanceOf[msg.sender] >= _value);
        // 2. Deduct the amount of tokens from the caller.
        balanceOf[msg.sender] -= _value;
        // 3. Credit the amount of tokens to the recipient, i.e. _to.
        balanceOf[_to] += _value;
        // 4. Emit a Transfer event.
        emit Transfer(msg.sender, _to, _value);
        return true;
    }

    function approve(address _spender, uint256 _value) public returns (bool success) {
        require(balanceOf[msg.sender]>=_value);
        allowance[msg.sender][_spender] = _value;
        emit Approval(msg.sender, _spender, _value);
        return true;
    }
    
    function transferFrom(address _from, address _to, uint256 _value) public returns (bool success) {
        // 1. Ensure that the owner has enough tokens to make the transfer.
        require(balanceOf[_from] >= _value);
        // 2. Ensure that the spender has the allowance to transfer on behalf of the owne
        require(allowance[_from][msg.sender]>= _value);
        // 3. Deduct the amount of tokens from the owner. 
        balanceOf[_from] -= _value;
        // 4. Credit the amount of tokens to the ultimate recipient, i.e. _to.
        balanceOf[_to] += _value;
        // 5. Decrease the allowance of the spender by the amount _value
        allowance[_from][msg.sender] -= _value;
        // 5. Emit a Transfer event from the owner to the recipient.
        emit Transfer(_from, _to, _value);
        return true;
    }
}






































