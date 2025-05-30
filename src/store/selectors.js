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
const caller = state => get(state, "providerReducer.caller")
const events = state => get(state, "exchangeReducer.events")

export const myEventsSelector = createSelector(
  caller, 
  events, 
  (caller, events) => {
    if (!events) return [];
    
    events = events.filter((event) => {
      if (!event || !event.args) return false;
      
      return (
        (event.args.user === caller) || 
        (event.args.executor === caller) ||
        (event.args._user === caller)
      );
    });
    
    //console.log(events);
    return events;
  }
);


const decorateOrder = (order, token0, token1) => {
  let token0Amount, token1Amount, tokenPrice
  const precision = 100000

  if (order.tokenBuy === token0.address) {
    token0Amount = ethers.utils.formatUnits(order.amountBuy, 18) // token0 is the token being bought
    token1Amount = ethers.utils.formatUnits(order.amountSell, 18) // token1 is the token being sold
    tokenPrice = token1Amount / token0Amount // Price is UTMC/MBTBA for buying MBTBA with UTMC
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

    const lastOrder = orders[orders.length - 1]
    const lastPrice = get(lastOrder, "tokenPrice", 0)
    const secondLastOrder = orders[orders.length - 2]
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

export const filledOrdersSelector = createSelector(
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

    orders = filteredOrders

    // Sort orders in ascending order of timestamp
    orders = orders.sort((a, b) => a.timestamp - b.timestamp)

    orders = decorateFilledOrders(orders, token0, token1)

    // Sort orders in descending order of timestamp for the UI.
    orders = orders.sort((a, b) => b.timestamp - a.timestamp)
    return orders
  }
);

export const myFilledOrdersSelector = createSelector(
  caller,
  filledOrders,
  token0,
  token1,
  (caller, orders, token0, token1) => {
    if (!token0 || !token1) { return }

    // Filter orders for the selected token pair
    const filteredOrders = orders.filter(
      (order) => (
        (order.tokenBuy === token0.address && order.tokenSell === token1.address) ||
        (order.tokenBuy === token1.address && order.tokenSell === token0.address)
      )
    );

    // Filter by initiator or executioner of the order
    orders = filteredOrders.filter((order) => (order.initiator === caller) || (order.executor === caller))

    // Sort the orders by date descending 
    orders = orders.sort((a,b) => b.timestamp - a.timestamp)

    // decorate the orders
    orders = decorateMyFilledOrders(caller, orders, token0, token1)

    return orders
  }
);

const decorateMyFilledOrders = (caller, orders, token0, token1) => {
  return(
    orders.map((order) => {
      order = decorateOrder(order, token0, token1)
      order = decorateMyFilledOrder(caller, order, token0, token1)
      return order
    })
  )
}

const decorateMyFilledOrder = (caller, order, token0, token1) => {
  const myOrder = caller === order.initiator

  let orderType 
  if(myOrder) {
    orderType = order.tokenSell === token1.address ? "buy" : "sell"
  } else {
    orderType = order.tokenSell === token1.address ? "sell" : "buy"    
  }

  return ({
    ...order,
    orderType,
    orderClass: (orderType === "buy" ? GREEN : RED),
    orderSign: (orderType === "buy" ? "+": "-")
  })
}

export const myOpenOrdersSelector = createSelector(
  caller, 
  openOrders, 
  token0,
  token1,
  (caller, orders, token0, token1) => {
    if (!token0 || !token1) { return }

    // Filter orders by current account (caller)
    orders = orders.filter((order) => order.user === caller)

    //Filter by token addresses (done a bit different from other functions in selectors.js)
    orders = orders.filter((order) => order.tokenBuy === token0.address || order.tokenBuy === token1.address)
    orders = orders.filter((order) => order.tokenSell === token0.address || order.tokenSell === token1.address)

    orders = decorateMyOpenOrders(orders, token0, token1)

    // Sort orders by date descending
    orders = orders.sort((a, b) => b.timestamp - a.timestamp)

    return orders
  }
);

const decorateMyOpenOrders = (orders, token0, token1) => {
  return(
    orders.map((order) => {
      order = decorateOrder(order, token0, token1)
      order = decorateMyOpenOrder(order, token0, token1)
      return (order)
    })
  )
}

const decorateMyOpenOrder = (order, token0, token1) => {
  let orderType = order.tokenSell === token1.address ? "buy" : "sell"
  return ({
    ...order,
    orderType,
    orderTypeClass: (orderType === "buy" ? GREEN : RED)
    }
  )
}

const decorateFilledOrders = (orders, token0, token1) => {
  let previousOrder = orders[0]

  return (
    orders.map((order) => {
      order = decorateOrder(order, token0, token1)
      order = decorateFilledOrder(order, previousOrder, order.id)
      previousOrder = order
      return order
    })
  )
}

const decorateFilledOrder = (order, previousOrder, orderId) => {
  if(previousOrder.id === orderId)
  {
    return ({
      ...order,
      tokenPriceClass: GREEN
    })
  }
  else return ({
    ...order,
    tokenPriceClass: previousOrder.tokenPrice <= order.tokenPrice ? GREEN : RED
  })
}

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

