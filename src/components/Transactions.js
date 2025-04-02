import { myOpenOrdersSelector, myFilledOrdersSelector } from "../store/selectors";
import { useSelector } from "react-redux";
import sort from "../assets/sort.svg"
import Banner from "./Banner";
import { useRef, useState } from "react";

const Transactions = () => {
  const myOpenOrders = useSelector(myOpenOrdersSelector)
  const myFilledOrders = useSelector(myFilledOrdersSelector)
  const symbols = useSelector(state => state.tokensReducer.symbols)


  const tradeRef = useRef(null)
  const orderRef = useRef(null)

  const [showMyOrders, setShowMyOrders] = useState(true)

  const tabHandler = (event) => {
    if (event.target.className !== orderRef.current.className) {
      event.target.className = "tab tab--active"
      orderRef.current.className = "tab"
      setShowMyOrders(false)
    } else {
      event.target.className = "tab tab--active"
      tradeRef.current.className = "tab"
      setShowMyOrders(true)
    }
  }

  return (
    <div className="component exchange__transactions">
      {showMyOrders ? (
        <div>
          <div className='component__header flex-between'>
            <h2>My Orders</h2>

            <div className='tabs'>
              <button onClick={tabHandler} ref={orderRef} className='tab tab--active'>Orders</button>
              <button onClick={tabHandler} ref={tradeRef} className='tab'>Trades</button>
            </div>
          </div>
          {!myOpenOrders || myOpenOrders.length === 0 ?
            (
              <Banner text="No Orders" />
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Date Created<img src={sort} alt="sort" /></th>
                    <th>{symbols && symbols[0]}<img src={sort} alt="sort" /></th>
                    <th>{symbols && symbols[0]}/ {symbols && symbols[1]}<img src={sort} alt="sort" /></th>
                    <th>{ /* Cancel order */}</th>
                  </tr>
                </thead>
                <tbody>
                  {
                    myOpenOrders && myOpenOrders.map((order, index) => {
                      return (
                        <tr key={index}>
                          <td>{order.formattedTimestamp}</td>
                          <td style={{ color: `${order.orderTypeClass}` }}>{order.token0Amount}</td>
                          <td>{order.tokenPrice}</td>
                          <td>{/* Cancel order */}</td>
                        </tr>
                      )
                    })
                  }
                </tbody>
              </table>
            )
          }
        </div>
      ) : (
        <div>
          <div className='component__header flex-between'>
            <h2>My Transactions</h2>

            <div className='tabs'>
              <button onClick={tabHandler} ref={orderRef} className='tab tab--active'>Orders</button>
              <button onClick={tabHandler} ref={tradeRef} className='tab'>Trades</button>
            </div>
          </div>
          {!myFilledOrders || myFilledOrders.length === 0 ?
            (
              <Banner text="No Trades" />
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Time<img src={sort} alt="sort"></img></th>
                    <th>{symbols && symbols[0]}<img src={sort} alt="sort" /></th>
                    <th>{symbols && symbols[0]}/ {symbols && symbols[1]}<img src={sort} alt="sort" /></th>
                  </tr>
                </thead>
                <tbody>
                  {
                    myFilledOrders && myFilledOrders.map((order, index) => {
                      return (
                        <tr key={index}>
                          <td>{order.formattedTimestamp}</td>
                          <td style={{ color: `${order.orderClass}` }}>{order.orderSign}{order.token0Amount}</td>
                          <td>{order.tokenPrice}</td>
                        </tr>
                      )
                    })
                  }
                </tbody>
              </table>
            )
          }
        </div>
      )}
    </div>
  )
}

export default Transactions;
