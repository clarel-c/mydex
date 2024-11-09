const { ethers } = require("hardhat")
const { expect } = require("chai")

const weiValue = function (num) {
    return ethers.utils.parseUnits(num.toString(), "ether")
}

describe("Exchange Contract", function () {
    let accounts, exchange, token1, token2, transaction, transactionReceipt
    let deployer, feeAccount, user1, user2
    const feePercent = 1

    beforeEach(async function () {
        accounts = await ethers.getSigners()
        deployer = accounts[0]
        feeAccount = accounts[1]
        user1 = accounts[2]
        user2 = accounts[3]

        const Exchange = await ethers.getContractFactory("Exchange")
        exchange = await Exchange.deploy(feeAccount.address, feePercent)

        const Token = await ethers.getContractFactory("Token")
        token1 = await Token.deploy("MBTBA Token", "MBTBA", 100000)
        token2 = await Token.deploy("UTM Coin", "UTMC", 100000)

        // 1. Send tokens from the deployer to user1 using the transfer function
        transaction = await token1.connect(deployer).transfer(user1.address, weiValue(20000))
        await transaction.wait()

        // 2. Have user1 approve the exchange as a spender for token 1.
        transaction = await token1.connect(user1).approve(exchange.address, weiValue(10000))
        await transaction.wait()

        // 1. Send tokens from the deployer to user2 using the transfer function
        transaction = await token2.connect(deployer).transfer(user2.address, weiValue(20000))
        await transaction.wait()

        // 2. Have user2 approve the exchange as a spender for token 2.
        transaction = await token2.connect(user2).approve(exchange.address, weiValue(10000))
        await transaction.wait()


    })

    describe("Deployment", function () {

        it("has a Fee Account assigned", async function () {
            expect(await exchange.feeAccount()).to.equal(feeAccount.address)
        })
        it("has a fee percentage assigned", async function () {
            expect(await exchange.feePercent()).to.equal(feePercent)
        })
    })

    describe("Depositing Tokens", async function () {

        it("tracks the token deposit and emits a Deposit event", async function () {
            expect(await token1.balanceOf(deployer.address)).to.equal(weiValue(80000))
            expect(await token1.balanceOf(user1.address)).to.equal(weiValue(20000))
            expect(await token1.allowance(user1.address, exchange.address)).to.equal(weiValue(10000))

            // 3. Have the Exchange deposit the token amount of behalf of user1.  
            transaction = await exchange.connect(user1).depositToken(token1.address, weiValue(7000))
            transactionReceipt = await transaction.wait()

            expect(await token1.balanceOf(deployer.address)).to.equal(weiValue(80000))
            expect(await token1.balanceOf(user1.address)).to.equal(weiValue(13000))
            expect(await token1.allowance(user1.address, exchange.address)).to.equal(weiValue(3000))
            expect(await token1.balanceOf(exchange.address)).to.equal(weiValue(7000))
            expect(await exchange.tokensBalance(token1.address, user1.address)).to.equal(weiValue(7000))
            expect(await exchange.balanceOf(token1.address, user1.address)).to.equal(weiValue(7000))

            expect(transactionReceipt.events[1].event).to.equal("Deposit")
            expect(transactionReceipt.events[1].args._token).to.equal(token1.address)
            expect(transactionReceipt.events[1].args._user).to.equal(user1.address)
            expect(transactionReceipt.events[1].args._amount).equal(weiValue(7000))
            expect(transactionReceipt.events[1].args._balance).to.equal(weiValue(7000))
        })

        it("prevents deposits without approval of user", async function () {
            await expect(exchange.connect(user1).depositToken(token1.address, weiValue(10001))).to.be.reverted
            await expect(exchange.connect(user1).depositToken(token1.address, weiValue(10000))).not.to.be.reverted
        })
    })

    describe("Withdrawing Tokens", async function () {

        beforeEach(async function () {
            transaction = await exchange.connect(user1).depositToken(token1.address, weiValue(7000))
            await transaction.wait()

            transaction = await exchange.connect(user1).withdrawToken(token1.address, weiValue(3000))
            transactionReceipt = await transaction.wait()
        })

        it("tracks the token withdrawal and emits a Withdraw event", async function () {
            expect(await token1.balanceOf(user1.address)).to.equal(weiValue(16000))
            expect(await token1.balanceOf(exchange.address)).to.equal(weiValue(4000))
            expect(await exchange.tokensBalance(token1.address, user1.address)).to.equal(weiValue(4000))
            expect(await exchange.balanceOf(token1.address, user1.address)).to.equal(weiValue(4000))

            expect(transactionReceipt.events[1].event).to.equal("Withdraw")
            expect(transactionReceipt.events[1].args._token).to.equal(token1.address)
            expect(transactionReceipt.events[1].args._user).to.equal(user1.address)
            expect(transactionReceipt.events[1].args._amount).equal(weiValue(3000))
            expect(transactionReceipt.events[1].args._balance).to.equal(weiValue(4000))
        })

        it("rejects withdrawals when user has insufficient balance", async function () {
            await expect(exchange.connect(user1).withdrawToken(token1.address, weiValue(4001))).to.be.reverted
            await expect(exchange.connect(user1).withdrawToken(token1.address, weiValue(4000))).not.to.be.reverted
        })
    })

    describe("Making and Cancelling Orders", async function () {

        beforeEach(async function () {

            transaction = await exchange.connect(user1).depositToken(token1.address, weiValue(7000))
            await transaction.wait()

            transaction = await exchange.connect(user1).makeOrder(token2.address, weiValue(200), token1.address, weiValue(100))
            transactionReceipt = await transaction.wait()
        })

        it("tracks a new order and emits an order event", async function () {
            expect(await exchange.ordersCounter()).to.equal(1)

            const firstOrder = await exchange.connect(user1).orders(1)
            const timestamp = firstOrder.timestamp

            expect(transactionReceipt.events[0].event).to.equal("Order")
            expect(transactionReceipt.events[0].args.id).to.equal(1)
            expect(transactionReceipt.events[0].args.user).to.equal(user1.address)
            expect(transactionReceipt.events[0].args.tokenBuy).equal(token2.address)
            expect(transactionReceipt.events[0].args.amountBuy).to.equal(weiValue(200))
            expect(transactionReceipt.events[0].args.tokenSell).equal(token1.address)
            expect(transactionReceipt.events[0].args.amountSell).to.equal(weiValue(100))
            expect(transactionReceipt.events[0].args.timestamp).to.equal(timestamp)
        })

        it("rejects orders when user has insufficient balance", async function () {
            await expect(exchange.connect(user1).makeOrder(token2.address, weiValue(14002), token1.address, weiValue(7001))).to.be.reverted
            await expect(exchange.connect(user1).makeOrder(token2.address, weiValue(14000), token1.address, weiValue(7000))).not.to.be.reverted
        })

        it("cancels existing orders from the rightful originator of the order", async function () {
            transaction = await exchange.connect(user1).cancelOrder(1)
            await transaction.wait()

            // The cancel order should not be reverted if called by user 1, since the latter created it
            await expect(exchange.connect(user1).cancelOrder(1)).not.to.be.reverted

            // The cancel orders should be reverted since they do not even exist.
            await expect(exchange.connect(user1).cancelOrder(0)).to.be.reverted
            await expect(exchange.connect(user1).cancelOrder(2)).to.be.reverted

            // The cancel orders should be reverted since someone else than the originator is calling the function
            await expect(exchange.connect(user2).cancelOrder(1)).to.be.reverted

            // The order is marked as cancelled
            expect(await exchange.connect(user1).ordersCancelled(1)).to.equal(true)
        })

        it("emits a cancel event when an order is cancelled", async function () {

            // The next two lines are only to retrieve the timestamp when the first order was made.
            const firstOrder = await exchange.connect(user1).orders(1)
            const timestamp = firstOrder.timestamp

            transaction = await exchange.connect(user1).cancelOrder(1)
            transactionReceipt = await transaction.wait()

            expect(transactionReceipt.events[0].event).to.equal("Cancel")
            expect(transactionReceipt.events[0].args.id).to.equal(1)
            expect(transactionReceipt.events[0].args.user).to.equal(user1.address)
            expect(transactionReceipt.events[0].args.tokenBuy).equal(token2.address)
            expect(transactionReceipt.events[0].args.amountBuy).to.equal(weiValue(200))
            expect(transactionReceipt.events[0].args.tokenSell).equal(token1.address)
            expect(transactionReceipt.events[0].args.amountSell).to.equal(weiValue(100))
            // The cancel is expected at least to be after the order is made
            expect(transactionReceipt.events[0].args.timestamp).to.at.least(timestamp)
        })
    })

    describe("Filling Orders", async function () {
        beforeEach(async function () {

            transaction = await exchange.connect(user1).depositToken(token1.address, weiValue(7000))
            await transaction.wait()

            transaction = await exchange.connect(user2).depositToken(token2.address, weiValue(7000))
            await transaction.wait()

            transaction = await exchange.connect(user1).makeOrder(token2.address, weiValue(200), token1.address, weiValue(100))
            await transaction.wait()

            transaction = await exchange.connect(user2).fillOrder(1)
            transactionReceipt = await transaction.wait()
        })

        it("executes a trade between two users and charge fees to the seller", async function () {
            //user1 deposited 7000 token1 and pays 100 token1 to buy 200 token2
            expect(await exchange.balanceOf(token1.address, user1.address)).to.equal(weiValue(6900))

            //user1 gets 200 token2 when the trade executes with a willing seller of token2
            expect(await exchange.balanceOf(token2.address, user1.address)).to.equal(weiValue(200))

            //user2 deposits 7000 token2 and pays 100 token2 to buy 100 token1 by filling the order
            expect(await exchange.balanceOf(token1.address, user2.address)).to.equal(weiValue(100))

            //user2 paid 200 token2 to buy token1, but also pays a fees of 1% of the transfer, i.e. 2 token2
            //As such, user2 now has 7000 - 200 - 2 = 6798
            expect(await exchange.balanceOf(token2.address, user2.address)).to.equal(weiValue(6798))

            //The feeAccount has now collected the 1% fee. As such, while still having 0 token1,
            //the feeAccount will now have 2 token2.
            expect(await exchange.balanceOf(token1.address, feeAccount.address)).to.equal(weiValue(0))
            expect(await exchange.balanceOf(token2.address, feeAccount.address)).to.equal(weiValue(2))
        })

        it("emits a Trade event when a trade is executed", async function () {
            // The next two lines are only to retrieve the timestamp when the first order was made.
            const firstOrder = await exchange.connect(user1).orders(1)
            const timestamp = firstOrder.timestamp

            expect(transactionReceipt.events[0].event).to.equal("Trade")
            expect(transactionReceipt.events[0].args.id).to.equal(1)
            expect(transactionReceipt.events[0].args.executor).to.equal(user2.address)
            expect(transactionReceipt.events[0].args.tokenBuy).equal(token2.address)
            expect(transactionReceipt.events[0].args.amountBuy).to.equal(weiValue(200))
            expect(transactionReceipt.events[0].args.tokenSell).equal(token1.address)
            expect(transactionReceipt.events[0].args.amountSell).to.equal(weiValue(100))
            expect(transactionReceipt.events[0].args.initiator).to.equal(user1.address)
            // The trade is expected at least to be after the order is made
            expect(transactionReceipt.events[0].args.timestamp).to.at.least(timestamp)
        })

        it("rejects invalid trades", async function () {

            //Remember that order 1 has already been made and filled in the beforeEach

            //user1 makes a second order (order 2) and then cancels that order.
            transaction = await exchange.connect(user1).makeOrder(token2.address, weiValue(300), token1.address, weiValue(150))
            await transaction.wait()
            transaction = await exchange.connect(user1).cancelOrder(2)
            transactionReceipt = await transaction.wait()

            //user1 makes a third order (order 3)
            transaction = await exchange.connect(user1).makeOrder(token2.address, weiValue(300), token1.address, weiValue(150))
            await transaction.wait()

            //user2 cannot fill a non-existant order
            await expect(exchange.connect(user2).fillOrder(0)).to.be.reverted

            //user2 cannot fill a cancelled order
            await expect(exchange.connect(user2).fillOrder(2)).to.be.reverted

            //user2 can however fill order 3, since the latter is valid and has not been filled yet.
            await expect(exchange.connect(user2).fillOrder(3)).not.to.be.reverted
        })
    })
})







































































