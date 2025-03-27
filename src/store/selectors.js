import { createSelector } from "reselect";
import { get, groupBy, reject, maxBy, minBy } from "lodash";
import { ethers } from "ethers";
import moment from "moment";

const GREEN = "#25CE8F"
const RED = "#F55354"

const token0 = state => get(state, "tokensReducer.contracts[0]", {})
const token1 = state => get(state, "tokensReducer.contracts[1]", {})
const allOrders = state => get(state, "exchangeReducer.allOrders.data", [])
const cancelledOrders = state => get(state, "exchangeReducer.cancelledOrders.data", [])
const filledOrders = state => get(state, "exchangeReducer.filledOrders.data", [])

const decorateOrder = (order, token0, token1) => {
  let token0Amount, token1Amount, tokenPrice
  const precision = 100000

  if (order.tokenBuy === token0.address) {
    token0Amount = ethers.utils.formatUnits(order.amountBuy, 18) // token0 is the token being bought
    token1Amount = ethers.utils.formatUnits(order.amountSell, 18) // token1 is the token being sold
    tokenPrice = token0Amount / token1Amount // Price is obtained by dividing the amount of token0 by the amount of token1
    tokenPrice = Math.round(tokenPrice * precision) / precision // Round the price to 5 decimal places
  } else {
    token0Amount = ethers.utils.formatUnits(order.amountSell, 18) // token0 is the token being sold
    token1Amount = ethers.utils.formatUnits(order.amountBuy, 18) // token1 is the token being bought
    tokenPrice = token1Amount / token0Amount // Price is obtained by dividing the amount of token1 by the amount of token0
    tokenPrice = Math.round(tokenPrice * precision) / precision // Round the price to 5 decimal places
  }

  return ({
    ...order,
    token0Amount,
    token1Amount,
    tokenPrice,
    formattedTimestamp: moment.unix(order.timestamp).format('lll')
  })
}

const decorateOrderBookTypes = (orders, token0, token1) => {
  return (
    orders.map((order) => {
      order = decorateOrder(order, token0, token1)
      order = decorateOrderBookType(order, token0, token1)
      return (order)
    })
  )
}

const decorateOrderBookType = (order, token0, token1) => {
  const orderType = order.tokenBuy === token0.address ? "buy" : "sell"
  return ({
    ...order,
    orderType,
    orderTypeClass: (orderType === "buy" ? GREEN : RED),
    orderFillAction: (orderType === "buy" ? "Sell" : "Buy")
  })
}

const openOrders = state => {
  const all = allOrders(state)
  const filled = filledOrders(state)
  const cancelled = cancelledOrders(state)

  const openOrders = reject(all, ((order) => {
    const orderFilled = filled.some((fill) => fill.id.toString() === order.id.toString())
    const orderCancelled = cancelled.some((cancel) => cancel.id.toString() === order.id.toString())
    return (orderFilled || orderCancelled)
  }))
  return openOrders
}

export const orderBookSelector = createSelector(
  openOrders,
  token0,
  token1,
  (orders, token0, token1) => {
    if (!token0 || !token1) { return }
    // Filter orders for the selected token pair
    const filteredOrders = orders.filter(
      (order) => (
        (order.tokenBuy === token0.address && order.tokenSell === token1.address) ||
        (order.tokenBuy === token1.address && order.tokenSell === token0.address)
      )
    );

    // Decorate orders
    orders = decorateOrderBookTypes(filteredOrders, token0, token1);

    // Group orders by type
    orders = groupBy(orders, "orderType");

    //Sort buy orders by price
    const buyOrders = get(orders, "buy", [])
    orders = {
      ...orders,
      buyOrders: buyOrders.sort((a, b) => b.tokenPrice - a.tokenPrice)
    }

    //Sort sell orders by price
    const sellOrders = get(orders, "sell", [])
    orders = {
      ...orders,
      sellOrders: sellOrders.sort((a, b) => b.tokenPrice - a.tokenPrice)
    }

    //console.log(orders)

    return orders;
  }
);

export const priceChartSelector = createSelector(
  filledOrders,
  token0,
  token1,
  (orders, token0, token1) => {
    if (!token0 || !token1) { return }
    // Filter orders for the selected token pair
    const filteredOrders = orders.filter(
      (order) => (
        (order.tokenBuy === token0.address && order.tokenSell === token1.address) ||
        (order.tokenBuy === token1.address && order.tokenSell === token0.address)
      )
    );

    orders = filteredOrders.map((order) => decorateOrder(order, token0, token1))
    
    orders.sort((a, b) => a.timestamp - b.timestamp);
    //console.log(orders)

    const lastOrder = orders[orders.length -1]
    const lastPrice = get(lastOrder, "tokenPrice", 0)
    const secondLastOrder = orders[orders.length -2]
    const secondLastPrice = get(secondLastOrder, "tokenPrice", 0)
    const lastPriceChange = lastPrice >= secondLastPrice ? "up" : "down"

    return ({
      lastPrice,
      lastPriceChange,
      series: [{
        data: buildGraphData(orders)
      }]
    })
  }
);

const buildGraphData = (orders) => {
  // Group the order by the hour.
  orders = groupBy(orders, (order) => moment.unix(order.timestamp).startOf('hour').format())

  const hours = Object.keys(orders)

  // Build the data for each candlestick
  const graphData = hours.map((hour) => {
  const group = orders[hour]
  const open = group[0].tokenPrice
  const high = maxBy(group, "tokenPrice").tokenPrice
  const low = minBy(group, "tokenPrice").tokenPrice
  const close = group[group.length - 1].tokenPrice

    return ({
      x: new Date(hour),
      y: [open, high, low, close]
    })
  })
  return graphData
}

