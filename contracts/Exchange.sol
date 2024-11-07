// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;
import "./Token.sol";

import "hardhat/console.sol";

contract Exchange {
    address public feeAccount;   
    uint256 public feePercent; 

    mapping(address => mapping(address => uint256)) public tokensBalance;

    event Deposit(address _token, address _user, uint256 _amount, uint256 _balance);

    constructor(address _feeAccount, uint256 _feePercent) {
        feeAccount = _feeAccount;
        feePercent = _feePercent;
    }

    function depositToken(address _token, uint256 _amount) public {
        // 1. Transfer the token amount to the exchange using the transferFrom function.
        Token(_token).transferFrom(msg.sender, address(this), _amount);
        // 2. Update the user balance on the exchange for that user and for that token
        tokensBalance[_token][msg.sender] += _amount;
        // 3. Emit a Deposit Event which the UI can later use.
        emit Deposit(_token, msg.sender, _amount, tokensBalance[_token][msg.sender]);
    }

    function balanceOf(address _token, address _user) public view returns (uint256) {
        return tokensBalance[_token][_user];
    }
}





















