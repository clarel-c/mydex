import { legacy_createStore, combineReducers, applyMiddleware } from "redux"
import thunk from "redux-thunk"
import { composeWithDevTools } from "redux-devtools-extension"

// Import Reducers
import { providerReducer, tokensReducer } from "./reducers"

const combinedReducers = combineReducers({
    providerReducer,
    tokensReducer
})

const initialState = {}
const middleware = [thunk]
const composedEnhancers = composeWithDevTools(applyMiddleware(...middleware))
const store = legacy_createStore(combinedReducers, initialState, composedEnhancers)
export default store



