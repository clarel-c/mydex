import { ethers } from "ethers"
import TOKEN_ABI from "../ABIs/Token.json"

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

export const loadAccount = async function(dispatch) {
    const accounts = await window.ethereum.request({method:"eth_requestAccounts"})
    const caller = ethers.utils.getAddress(accounts[0])
    dispatch({type: "caller_account_loaded", caller: caller})

    return caller
}

export const loadToken = async function(provider, address, dispatch) {
    let token, symbol

    token = new ethers.Contract(address, TOKEN_ABI, provider)
    symbol = await token.symbol()
    dispatch({type: "token_loaded", token, symbol})

    return token
}









