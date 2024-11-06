const { ethers } = require("hardhat")
const { expect } = require("chai")

const weiValue = function (num) {
    return ethers.utils.parseUnits(num.toString(), "ether")
}

describe("Token Contract", function () {
    let token, accounts, deployer, receiver, spender

    beforeEach(async function () {
        const Token = await ethers.getContractFactory("Token")
        token = await Token.deploy("MBTBA Token", "MBTBA", 100000)
        accounts = await ethers.getSigners()
        deployer = accounts[0]
        receiver = accounts[1]
        spender = accounts[2]
    })

    describe("Deployment", function () {
        const _name = "MBTBA Token"
        const _symbol = "MBTBA"
        const _decimals = 18
        const _totalSupply = weiValue(100000)

        it("has the correct name", async function () {
            const name = await token.name()
            expect(name).to.equal(_name)
        })

        it("has the correct symbol", async function () {
            const symbol = await token.symbol()
            expect(symbol).to.equal(_symbol)
        })

        it("has the correct no of decimals", async function () {
            let decimals = await token.decimals()
            expect(decimals).to.equal(_decimals)
        })

        it("has the correct total supply", async function () {
            const totalSupply = await token.totalSupply()
            expect(totalSupply).to.equal(_totalSupply)
        })

        it("assigns the total supply to the Contract deployer", async function () {
            const deployerBalance = await token.balanceOf(deployer.address)
            expect(deployerBalance).to.equal(_totalSupply)
        })
    })

    describe("Sending Tokens", function () {
        let amount, transaction, deployerBalance, receiverBalance, transactionReceipt

        beforeEach(async function () {
            amount = weiValue(10000)
            transaction = await token.connect(deployer).transfer(receiver.address, amount)
            transactionReceipt = await transaction.wait()
        })

        it("transfers tokens correctly", async function () {
            deployerBalance = await token.balanceOf(deployer.address)
            receiverBalance = await token.balanceOf(receiver.address)

            expect(deployerBalance).to.equal(weiValue(90000))
            expect(receiverBalance).to.equal(weiValue(10000))
        })

        it("rejects transfers with insufficient balances", async function () {
            deployerBalance = await token.balanceOf(deployer.address)
            const invalidAmount = deployerBalance + weiValue(1)
            const lastValidAmount = deployerBalance
            await expect(token.connect(deployer).transfer(receiver.address, invalidAmount)).to.be.reverted
            await expect(token.connect(deployer).transfer(receiver.address, lastValidAmount)).not.to.be.reverted
        })

        it("accepts transfers of zero tokens as per the ERC-20 specs", async function () {
            await expect(token.connect(deployer).transfer(receiver.address, 0)).not.to.be.reverted
        })

        it("emits a Transfer event", async function () {
            expect(transactionReceipt.events[0].event).to.equal("Transfer")
            expect(transactionReceipt.events[0].args._from).to.equal(deployer.address)
            expect(transactionReceipt.events[0].args._to).to.equal(receiver.address)
            expect(transactionReceipt.events[0].args._value).to.equal(amount)
        })
    })

    describe("Approving Transfers", function () {
        let delegatedAmount, transaction, transactionReceipt

        beforeEach(async function () {
            delegatedAmount = weiValue(1000)
            transaction = await token.connect(deployer).approve(spender.address, delegatedAmount)
            transactionReceipt = await transaction.wait()
        })

        it("emits an Approval event", async function () {
            expect(transactionReceipt.events[0].event).to.equal("Approval")
            expect(transactionReceipt.events[0].args._owner).to.equal(deployer.address)
            expect(transactionReceipt.events[0].args._spender).to.equal(spender.address)
            expect(transactionReceipt.events[0].args._value).to.equal(delegatedAmount)
        })

        it("allocates an allowance to an approved spender for delegated token spending", async function () {
            expect(await token.allowance(deployer.address, spender.address)).to.equal(delegatedAmount)
        })

        it("rejects the transaction if the owner is approving more funds than available", async function () {
            const deployerBalance = await token.balanceOf(deployer.address)
            const invalidAmount = deployerBalance + weiValue(1)
            await expect(token.connect(deployer).approve(spender.address, invalidAmount)).to.be.reverted
        })
    })

    describe("Delegated Token Transfers", function () {
        let delegatedAmount, transaction1, transaction2, transactionReceipt

        beforeEach(async function () {
            delegatedAmount = weiValue(1000)
            transaction1 = await token.connect(deployer).approve(spender.address, delegatedAmount)
            await transaction1.wait()
        })

        it("transfers tokens on behalf of an approved owner and emits a Transfer event", async function () {
            transaction2 = await token.connect(spender).transferFrom(deployer.address, receiver.address, delegatedAmount)
            transactionReceipt = await transaction2.wait()
            expect(await token.balanceOf(deployer.address)).to.equal(weiValue(99000))
            expect(await token.balanceOf(receiver.address)).to.equal(delegatedAmount)
            expect(transactionReceipt.events[0].event).to.equal("Transfer")
            expect(transactionReceipt.events[0].args._from).to.equal(deployer.address)
            expect(transactionReceipt.events[0].args._to).to.equal(receiver.address)
            expect(transactionReceipt.events[0].args._value).to.equal(delegatedAmount)
        })

        it("reduces the allowance of the spender by the correct amount after a delegated Transfer", async function () {
            const actualAmount = weiValue(600)
            transaction2 = await token.connect(spender).transferFrom(deployer.address, receiver.address, actualAmount)
            transactionReceipt = await transaction2.wait()
            expect(await token.allowance(deployer.address, spender.address)).to.equal(weiValue(400))
        })

        it("rejects token transfers on behalf of an approved owner only if the amount exceeds the allowance", async function () {
            const invalidAmount = delegatedAmount + weiValue(1)
            await expect(token.connect(spender).transferFrom(deployer.address, receiver.address, delegatedAmount)).not.to.be.reverted
            await expect(token.connect(spender).transferFrom(deployer.address, receiver.address, invalidAmount)).to.be.reverted
        })
    })
})

































































