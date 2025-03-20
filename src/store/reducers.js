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
                contracts: [action.token0],
                symbols: [action.symbol]
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

const defaultExchangeState = {
    loaded: false,
    contract: {},
    transaction: {
        isSuccessful: false,        
    },
    events: []
}

export const exchangeReducer = function (state = defaultExchangeState, action) {
    switch (action.type) {
        case "exchange_loaded":
            return {
                ...state,
                loaded: true,
                contract: action.exchange,
            }
        case "transfer_request":
            return {
                ...state,
                transaction: {
                    transactionType: "Transfer",
                    isPending: true,
                    isSuccessful: false,
                },
                transferInProgress: true
            }
        case "transfer_success":
            return {
                ...state,
                transaction: {
                    transactionType: "Transfer",
                    isPending: false,
                    isSuccessful: true,
                },
                transferInProgress: false,
                events: [action.event, ...state.events]
            }
        case "transfer_failed":
            return {
                ...state,
                transaction: {
                    transactionType: "Transfer",
                    isPending: false,
                    isSuccessful: false,
                    isError: true
                },
                transferInProgress: false,
            }

        default:
            return state
    }
}

export const balancesReducer = function (state = {}, action) {
    switch (action.type) {
        case "balances_loaded":
            return {
                ...state,
                token0_balance: action.balance0,
                token1_balance: action.balance1,
                exchange_token0_balance: action.exchange_balance0,
                exchange_token1_balance: action.exchange_balance1
            }

        default:
            return state
    }
}














