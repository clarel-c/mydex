const { ethers } = require("hardhat")
const { expect } = require("chai")

const weiValue = function (num) {
    return ethers.utils.parseUnits(num.toString(), "ether")
}

describe("Token Contract", function () {
    let token, accounts, deployer

    beforeEach( async function () {
        const Token = await ethers.getContractFactory("Token")
        token = await Token.deploy("MBTBA Token", "MBTBA", 100000)
        accounts = await ethers.getSigners()
        deployer = accounts[0]
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
})


























