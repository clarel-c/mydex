import { ethers } from "ethers"
import TOKEN_ABI from "../ABIs/Token.json"
import EXCHANGE_ABI from "../ABIs/Exchange.json"

export const loadProvider = function(dispatch) {
    const provider = new ethers.providers.Web3Provider(window.ethereum)
    dispatch({type:"provider_loaded", connection: provider})

    return provider
}

export const loadNetwork = async function(provider, dispatch) {
    const network = await provider.getNetwork()
    const chainId = network.chainId
    dispatch({type: "network_loaded", chainId: chainId})

    return chainId
}

export const loadAccount = async function(provider, dispatch) {
    const accounts = await window.ethereum.request({method:"eth_requestAccounts"})
    const caller = ethers.utils.getAddress(accounts[0])
    dispatch({type: "caller_account_loaded", caller: caller})

    let eth_balance = await provider.getBalance(caller)
    eth_balance = ethers.utils.formatEther(eth_balance)
    dispatch({type: "eth_balance_loaded", balance: eth_balance})
    
    return caller
}

export const loadTokens = async function(provider, addresses, dispatch) {
    let tokens = [], symbol, token0, token1

    tokens[0] = new ethers.Contract(addresses[0], TOKEN_ABI, provider)
    console.log(tokens[0])
    symbol = await tokens[0].symbol()
    token0 = tokens[0]
    dispatch({type: "token_1_loaded", token0, symbol})

    tokens[1] = new ethers.Contract(addresses[1], TOKEN_ABI, provider)
    symbol = await tokens[1].symbol()
    token1 = tokens[1]
    dispatch({type: "token_2_loaded", token1, symbol})

    return tokens
}

export const loadExchange = async function(provider, address, dispatch) {
    const exchange = new ethers.Contract(address, EXCHANGE_ABI, provider)
    dispatch({type: "exchange_loaded", exchange})

    return exchange
}

export const subscribeToEvents = (exchange, dispatch) => {
    exchange.on("Deposit", (_token, _user, _amount, _balance, event) => {
        dispatch({type: "transfer_success", event})
    })
    exchange.on("Withdraw", (_token, _user, _amount, _balance, event) => {
        dispatch({type: "transfer_success", event})
    })
}


// Load user balances (wallet and exchange balances)
export const loadBalances = async (exchange, token0, token1, caller, dispatch) => {
    let balance0, balance1, exchange_balance0, exchange_balance1

    balance0 = await token0.balanceOf(caller)
    balance0 = ethers.utils.formatUnits(balance0, 18)
    balance1 = await token1.balanceOf(caller)
    balance1 = ethers.utils.formatUnits(balance1, 18)
    exchange_balance0 = await exchange.balanceOf(token0.address, caller)
    exchange_balance0 = ethers.utils.formatUnits(exchange_balance0, 18)
    exchange_balance1 = await exchange.balanceOf(token1.address, caller)
    exchange_balance1 = ethers.utils.formatUnits(exchange_balance1, 18)

    dispatch({type: "balances_loaded", balance0, balance1, exchange_balance0, exchange_balance1})
}

// tranfer tokens (deposits and withdrawals)
export const transferTokens = async (provider, exchange, transferType, token, amount, dispatch) => {
    let transaction

    dispatch({type: "transfer_request"})

    try{
        const signer = await provider.getSigner()
        const amountToTransfer = ethers.utils.parseUnits(amount, 18)    

        if(transferType==="deposit") {
        // Approve the exchange to transfer tokens
        transaction = await token.connect(signer).approve(exchange.address, amountToTransfer)
        await transaction.wait()    
        // Deposit tokens
        transaction = await exchange.connect(signer).depositToken(token.address, amountToTransfer)
        await transaction.wait()
        } else {
        // Withdraw tokens
        transaction = await exchange.connect(signer).withdrawToken(token.address, amountToTransfer)
        await transaction.wait()
        }

    } catch(error) {
        dispatch({type: "transfer_failed"})
    }
}

















