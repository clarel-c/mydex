const { ethers } = require("hardhat")
const { expect } = require("chai")

const weiValue = function (num) {
    return ethers.utils.parseUnits(num.toString(), "ether")
}

describe("Exchange Contract", function () {
    let accounts, deployer, feeAccount, exchange, user1, token1
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
        let transaction, transactionReceipt

        beforeEach( async function () {
        // 1. Send tokens from the deployer to user1 using the transfer function
        transaction = await token1.connect(deployer).transfer(user1.address, weiValue(20000))
        await transaction.wait() 
        // 2. Have user1 approve the exchange as a spender.
        transaction = await token1.connect(user1).approve(exchange.address, weiValue(10000))
        await transaction.wait()

        })     
        it("tracks the token deposit and emits a Deposit event", async function () {
            expect(await token1.balanceOf(deployer.address)).to.equal(weiValue(80000))
            expect(await token1.balanceOf(user1.address)).to.equal(weiValue(20000))
            expect(await token1.allowance(user1.address, exchange.address)).to.equal(weiValue(10000))
            
            // 3. Have the Exchange deposit the token amount of behalf of user1.  
            transaction =  await exchange.connect(user1).depositToken(token1.address, weiValue(7000))
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
})






























