// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;
import "./Token.sol";

import "hardhat/console.sol";

contract Exchange {
    address public feeAccount;
    uint256 public feePercent;
    uint256 public ordersCounter;

    mapping(address => mapping(address => uint256)) public tokensBalance;
    mapping(uint256 => _Order) public orders;
    mapping(uint256 => bool) public ordersCancelled;
    event Deposit(
        address _token,
        address _user,
        uint256 _amount,
        uint256 _balance
    );
    event Withdraw(
        address _token,
        address _user,
        uint256 _amount,
        uint256 _balance
    );

    event Order(
        uint256 id,
        address user,
        address tokenBuy,
        uint256 amountBuy,
        address tokenSell,
        uint256 amountSell,
        uint256 timestamp
    );

    event Cancel(
        uint256 id,
        address user,
        address tokenBuy,
        uint256 amountBuy,
        address tokenSell,
        uint256 amountSell,
        uint256 timestamp
    );

    struct _Order {
        uint256 id;
        address user;
        address tokenBuy;
        uint256 amountBuy;
        address tokenSell;
        uint256 amountSell;
        uint256 timestamp;
    }

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
        emit Deposit(
            _token,
            msg.sender,
            _amount,
            tokensBalance[_token][msg.sender]
        );
    }

    function withdrawToken(address _token, uint256 _amount) public {
        // 0. Ensure that the user has enough tokens to withdraw.
        require(tokensBalance[_token][msg.sender] >= _amount);
        // 1. Transfer the token back to the user
        Token(_token).transfer(msg.sender, _amount);
        // 2. Update the user balance on the exchange
        tokensBalance[_token][msg.sender] -= _amount;
        // 3. Emit a Withdraw event
        emit Withdraw(
            _token,
            msg.sender,
            _amount,
            tokensBalance[_token][msg.sender]
        );
    }

    function balanceOf(
        address _token,
        address _user
    ) public view returns (uint256) {
        return tokensBalance[_token][_user];
    }

    function makeOrder(
        address _tokenBuy,
        uint256 _amountBuy,
        address _tokenSell,
        uint256 _amountSell
    ) public {
        ordersCounter++;

        require(balanceOf(_tokenSell, msg.sender) >= _amountSell);

        orders[ordersCounter] = _Order(
            ordersCounter,
            msg.sender,
            _tokenBuy,
            _amountBuy,
            _tokenSell,
            _amountSell,
            block.timestamp
        );

        emit Order(
            ordersCounter,
            msg.sender,
            _tokenBuy,
            _amountBuy,
            _tokenSell,
            _amountSell,
            block.timestamp
        );
    }

    function cancelOrder(uint _id) public {
        // 1. require that _id exists (a user cannot cancel a non-existant order)
        require(_id >= 1 && _id <= ordersCounter);
        // 2. require that the caller of cancelOrder is also the one who created the order
        require(msg.sender == orders[_id].user);
        // 3. Bring in an instance of the order for ease of manipulation
        _Order storage _order = orders[_id];
        // 4. cancel the order using the ordersCancelled mapping
        ordersCancelled[_id] = true;
        // 5. Emit a Cancel event
        emit Cancel(
            _id,
            msg.sender,
            _order.tokenBuy,
            _order.amountBuy,
            _order.tokenSell,
            _order.amountSell,
            block.timestamp
        );
    }
}

