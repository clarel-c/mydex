const { ethers } = require("hardhat")
const { expect } = require("chai")

const weiValue = function (num) {
    return ethers.utils.parseUnits(num.toString(), "ether")
}

describe("Exchange Contract", function () {
    let accounts, deployer, feeAccount, exchange, user1, token1, token2, transaction, transactionReceipt
    const feePercent = 1

    beforeEach(async function () {
        accounts = await ethers.getSigners()
        deployer = accounts[0]
        feeAccount = accounts[1]
        user1 = accounts[2]

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

    describe("Making Orders", async function () {

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
    })
})











































