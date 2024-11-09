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
    mapping(uint256 => bool) public ordersFilled;

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

    event Trade(
        uint256 id,
        address executor,
        address tokenBuy,
        uint256 amountBuy,
        address tokenSell,
        uint256 amountSell,
        address initiator,
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

    function fillOrder(uint256 _id) public {
        // require that the order is valid
        require(_id>=1 && _id<=ordersCounter);
        // require that the order has not been cancelled
        require(ordersCancelled[_id] == false);
        // require that the order has not been filled already
        require(ordersFilled[_id] == false);

        // 1. Fetch the order
        _Order storage _order = orders[_id];
        // 2. Calculate the fee Amount
        uint256 feeAmount = (feePercent * _order.amountBuy) / 100;
        // 3. Execute the order for the buyer (i.e. the one making the order)
        tokensBalance[_order.tokenBuy][_order.user] += _order.amountBuy;
        tokensBalance[_order.tokenSell][_order.user] -= _order.amountSell;
        // 4. Execute the order for the seller (i.e. the one filling the order)
        tokensBalance[_order.tokenBuy][msg.sender] -= _order.amountBuy;
        tokensBalance[_order.tokenSell][msg.sender] += _order.amountSell;
        // 5. Charge fees to the seller
        tokensBalance[_order.tokenBuy][msg.sender] -= feeAmount;
        // 6. Credit the feeAccount with the fees
        tokensBalance[_order.tokenBuy][feeAccount] += feeAmount;
        // 7. Emit a Trade event (When the order is filled, a trade is executed between the two users)

        ordersFilled[_id] = true;

        emit Trade(
            _id,
            msg.sender,
            _order.tokenBuy,
            _order.amountBuy,
            _order.tokenSell,
            _order.amountSell,
            _order.user,
            block.timestamp
        );

    }
}


