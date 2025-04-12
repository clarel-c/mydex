import { useEffect, useState, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { loadBalances, transferTokens } from "../store/interactions";

const Balance = () => {
    const symbols = useSelector(state => state.tokensReducer.symbols)
    const exchange = useSelector(state => state.exchangeReducer.contract)
    const token0 = useSelector(state => state.tokensReducer.contracts[0])
    const token1 = useSelector(state => state.tokensReducer.contracts[1])
    const caller = useSelector(state => state.providerReducer.caller)
    const provider = useSelector(state => state.providerReducer.connection)
    const dispatch = useDispatch()

    const [token0Transfer, setToken0Transfer] = useState(0)
    const [token1Transfer, setToken1Transfer] = useState(0)

    const [isDeposit, setIsDeposit] = useState(true)


    const token0_balance = useSelector(state => state.balancesReducer.token0_balance)
    const token1_balance = useSelector(state => state.balancesReducer.token1_balance)
    const exchange_token0_balance = useSelector(state => state.balancesReducer.exchange_token0_balance)
    const exchange_token1_balance = useSelector(state => state.balancesReducer.exchange_token1_balance)
    const transferInProgress = useSelector(state => state.exchangeReducer.transferInProgress)

    const depositRef = useRef(null)
    const withdrawRef = useRef(null)

    const transferHandler = (event, token) => {
        if (token.address === token0.address) {
            setToken0Transfer(event.target.value)
        }
        else {
            setToken1Transfer(event.target.value)
        }
    }

    const depositHandler = async (event, token) => {
        event.preventDefault() // Prevent the form from submitting and refeshing the page
        if (token.address === token0.address) {
            transferTokens(provider, exchange, 'deposit', token, token0Transfer, dispatch)
            setToken0Transfer(0) // Reset the input field
        } else {
            transferTokens(provider, exchange, 'deposit', token, token1Transfer, dispatch)
            setToken1Transfer(0) // Reset the input field
        }
    }

    const withdrawHandler = async (event, token) => {
        event.preventDefault() // Prevent the form from submitting and refeshing the page
        if (token.address === token0.address) {
            transferTokens(provider, exchange, 'withdraw', token, token0Transfer, dispatch)
            setToken0Transfer(0) // Reset the input field
        } else {
            transferTokens(provider, exchange, 'withdraw', token, token1Transfer, dispatch)
            setToken1Transfer(0) // Reset the input field
        }
    }

    const tabHandler = (event) => {
        if (event.target.className === depositRef.current.className) {
            depositRef.current.className = "tab tab--active"
            withdrawRef.current.className = "tab"
            setIsDeposit(true)
        }
        else {
            depositRef.current.className = "tab"
            withdrawRef.current.className = "tab tab--active"
            setIsDeposit(false)
        }
    }

    useEffect(() => {
        if (exchange && token0 && token1 && caller) {
            loadBalances(exchange, token0, token1, caller, dispatch)
        }
    }, [exchange, token0, token1, caller, transferInProgress, dispatch])

    // Effect for periodic balance refresh every 10 seconds
    useEffect(() => {
        if (exchange && token0 && token1 && caller) {
            // Set up interval for periodic refresh
            const intervalId = setInterval(() => {
                loadBalances(exchange, token0, token1, caller, dispatch)
            }, 10000) // 10 seconds

            // Clean up interval on unmount
            return () => clearInterval(intervalId)
        }
    }, [exchange, token0, token1, caller, dispatch])


    return (
        <div className='component exchange__transfers'>
            <div className='component__header flex-between'>
                <h2>Balance</h2>
                <div className='tabs'>
                    <button onClick={tabHandler} ref={depositRef} className='tab tab--active'>Deposit</button>
                    <button onClick={tabHandler} ref={withdrawRef} className='tab'>Withdraw</button>
                </div>
            </div>

            {/* Deposit/Withdraw Component 1 (MBTBA) */}

            <div className='exchange__transfers--form'>
                <div className='flex-between'>
                    <p><small>Token</small><br /> {symbols && symbols[0]}</p>
                    <p><small>Wallet</small><br />{token0_balance}</p>
                    <p><small>Exchange</small><br />{exchange_token0_balance}</p>
                </div>

                <form onSubmit={(event) => { isDeposit ? depositHandler(event, token0) : withdrawHandler(event, token0) }}>
                    <label htmlFor="token0"><small>{symbols && symbols[0]} Amount</small></label>
                    <input
                        type="text"
                        id='token0'
                        placeholder='0.0000'
                        value={token0Transfer === 0 ? '' : token0Transfer}
                        onChange={(event) => { transferHandler(event, token0) }} />

                    <button className='button' type='submit'>
                        {isDeposit ? <span>Deposit</span> : <span>Withdraw</span>}
                    </button>
                </form>
            </div>

            <hr />

            {/* Deposit/Withdraw Component 2 (UTMC) */}

            <div className='exchange__transfers--form'>
                <div className='flex-between'>
                    <p><small>Token</small><br /> {symbols && symbols[1]}</p>
                    <p><small>Wallet</small><br />{token1_balance}</p>
                    <p><small>Exchange</small><br />{exchange_token1_balance}</p>
                </div>

                <form onSubmit={(event) => { isDeposit ? depositHandler(event, token1) : withdrawHandler(event, token1) }}>
                    <label htmlFor="token1"><small>{symbols && symbols[1]} Amount</small></label>
                    <input
                        type="text"
                        id='token1'
                        placeholder='0.0000'
                        value={token1Transfer === 0 ? '' : token1Transfer}
                        onChange={(event) => { transferHandler(event, token1) }} />

                    <button className='button' type='submit'>
                        {isDeposit ? <span>Deposit</span> : <span>Withdraw</span>}
                    </button>
                </form>
            </div>

            <hr />
        </div>
    );
}

export default Balance;