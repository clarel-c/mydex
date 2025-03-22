import { useState, useRef} from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { makeBuyOrder, makeSellOrder} from '../store/interactions';

const Order = () => {
    const [amount, setAmount] = useState(0)
    const [price, setPrice] = useState(0)
    const [isBuy, setIsBuy] = useState(true)
    const buyRef = useRef(null)
    const sellRef = useRef(null)

    const provider = useSelector(state => state.providerReducer.connection)
    const exchange = useSelector(state => state.exchangeReducer.contract)
    const token0 = useSelector(state => state.tokensReducer.contracts[0])
    const token1 = useSelector(state => state.tokensReducer.contracts[1])
    const dispatch = useDispatch()

    const tabHandler = (event) => {
        if (event.target.className === buyRef.current.className) {
            // Clicked on Buy button
            buyRef.current.className = 'tab tab--active'
            sellRef.current.className = 'tab'
            setIsBuy(true)
        } else {
            // Clicked on Sell button
            sellRef.current.className = 'tab tab--active'
            buyRef.current.className = 'tab'
            setIsBuy(false)
        }
    }

    const buyHandler = (event) => {
        event.preventDefault()
        makeBuyOrder(provider, exchange, token0, token1, amount, price, dispatch)
        setAmount(0)
        setPrice(0)
    }

    const sellHandler = (event) => {
        event.preventDefault()
        makeSellOrder(provider, exchange, token0, token1, amount, price, dispatch)
        setAmount(0)
        setPrice(0)
    }

    return (
        <div className="component exchange__orders">
            <div className='component__header flex-between'>
                <h2>New Order</h2>
                <div className='tabs'>
                    <button onClick={tabHandler} ref={buyRef} className='tab tab--active'>Buy</button>
                    <button onClick={tabHandler} ref={sellRef} className='tab'>Sell</button>
                </div>
            </div>

            <form onSubmit={isBuy ? buyHandler : sellHandler}>
                {isBuy ? <label htmlFor='amount'><small>Buy Amount</small></label> : <label htmlFor='amount'><small>Sell Amount</small></label>}
                <input
                    type="text"
                    id='amount'
                    placeholder='0.0000'
                    value={amount === 0 ? '' : amount}
                    onChange={(event) => setAmount(event.target.value)} />

                {isBuy ? <label htmlFor='price'><small>Buy Price</small></label> : <label htmlFor='price'><small>Sell Price</small></label>}
                <input
                    type="text"
                    id='price'
                    placeholder='0.0000'
                    value={price === 0 ? '' : price}
                    onChange={(event) => setPrice(event.target.value)} />

                <button className='button button--filled' type='submit'>
                    {isBuy ? <span>Buy Order</span> : <span>Sell Order</span>}
                </button>
            </form>
        </div>
    );
}

export default Order;