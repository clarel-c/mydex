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












