export const providerReducer = function (state = {}, action) {
    switch (action.type) {
        case "provider_loaded":
            return {
                ...state,
                connection: action.connection
            }

        case "network_loaded":
            return {
                ...state,
                chainId: action.chainId
            }
        case "caller_account_loaded":
            return {
                ...state,
                caller: action.caller
            }

        default:
            return state
    }
}

export const tokensReducer = function (state = {loaded: false, contract: null}, action) {
    switch (action.type) {
        case "token_loaded":
            return {
                ...state,
                loaded: true,
                contract: action.token,
                symbol: action.symbol
            }

        default:
            return state
    }
}

