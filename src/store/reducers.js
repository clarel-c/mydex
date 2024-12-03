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
        case "eth_balance_loaded":
            return {
                ...state,
                balance: action.balance
            }

        default:
            return state
    }
}

const initialState = { loaded: false, contracts: [], symbols: [] }

export const tokensReducer = function (state = initialState, action) {
    switch (action.type) {
        case "token_1_loaded":
            return {
                ...state,
                loaded: true,
                contracts: [...state.contracts, action.token0],
                symbols: [...state.symbols, action.symbol]
            }

        case "token_2_loaded":
            return {
                ...state,
                loaded: true,
                contracts: [...state.contracts, action.token1],
                symbols: [...state.symbols, action.symbol]
            }

        default:
            return state
    }
}

export const exchangeReducer = function (state = { loaded: false, contract: {} }, action) {
    switch (action.type) {
        case "exchange_loaded":
            return {
                ...state,
                loaded: true,
                contract: action.exchange
            }

        default:
            return state
    }
}












