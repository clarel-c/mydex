/* eslint-disable no-undef */
const config = require("../src/config.json")

const weiValue = function (num) {
  return ethers.utils.parseUnits(num.toString(), "ether")
}

const wait = function (seconds) {
  const milliseconds = seconds * 1000
  return new Promise(resolve => setTimeout(resolve, milliseconds))
}

async function main() {
  // 0. Fetch the network
  const { chainId } = await ethers.provider.getNetwork()
  console.log(`The chain Id is ${chainId}`)


  // 1. Fetch the deployed contracts
  const MBTBA = await ethers.getContractAt("Token", config[chainId].MBTBA.address)
  console.log(`MBTBA Token fetched: ${MBTBA.address}`)

  const UTMC = await ethers.getContractAt("Token", config[chainId].UTMC.address)
  console.log(`UTM Coin fetched: ${UTMC.address}`)

  const LRNC = await ethers.getContractAt("Token", config[chainId].LRNC.address)
  console.log(`Learn Coin fetched: ${LRNC.address}`)

  const exchange = await ethers.getContractAt("Exchange", config[chainId].exchange.address)
  console.log(`Exchange fetched: ${exchange.address}\n`)

  // 2. Create user1 { accounts[0] }, user2 { accounts [1] } 
  const accounts = await ethers.getSigners()
  const  user1 = accounts[0]
  const user2 = accounts[1]

  // 3. Distribute tokens: user1 sends 10,000 UTMC to user2
  amount = weiValue(10000)
  await UTMC.connect(user1).transfer(user2.address, amount)
  console.log(`Transferred ${amount} UTMC Tokens from ${user1.address} to ${user2.address}\n`)

  // 4. Deposit tokens to the Exchange
  // 4.1 user1 approves and deposits 10000 MBTBA Token to the Exchange
   transaction = await MBTBA.connect(user1).approve(exchange.address, weiValue(10000))
   await transaction.wait()
   console.log(`${user1.address} approved ${amount} MBTBA tokens for the exchange`)
   transaction = await exchange.connect(user1).depositToken(MBTBA.address, weiValue(7000))
   await transaction.wait()
   console.log(`${user1.address} deposits ${amount} MBTBA tokens to the exchange`)
   

  // 4.2 user2 approves and deposits 10000 UTM Coin to the exchange
  transaction = await UTMC.connect(user2).approve(exchange.address, weiValue(10000))
  await transaction.wait()
  console.log(`${user2.address} approved ${amount} UTM coins for the exchange`)
  transaction = await exchange.connect(user2).depositToken(UTMC.address, weiValue(7000))
  await transaction.wait()
  console.log(`${user2.address} deposits ${amount} UTM coins to the exchange`)

  // 5. Make and cancel an order: user1 makes an order for 100 UTMC for 5 MBTBA  and then cancel that order
  let OrderId
  transaction = await exchange.connect(user1).makeOrder(UTMC.address, weiValue(100), MBTBA.address, weiValue(5))
  transactionReceipt = await transaction.wait()
  OrderId = transactionReceipt.events[0].args.id
  console.log(`${user1.address} made an order with Order Id ${OrderId}`)

  await wait(1)

  transaction = await exchange.connect(user1).cancelOrder(OrderId)
  await transaction.wait()
  OrderId = transactionReceipt.events[0].args.id
  console.log(`${user1.address} cancelled the order with Order Id ${OrderId}`)

  await wait(1)

  // 6. Make and fill a series of orders
  transaction = await exchange.connect(user1).makeOrder(UTMC.address, weiValue(100), MBTBA.address, weiValue(10))
  transactionReceipt = await transaction.wait()
  OrderId = transactionReceipt.events[0].args.id
  console.log(`${user1.address} made an order with Order Id ${OrderId}`)

  await wait(1)

  transaction = await exchange.connect(user2).fillOrder(OrderId)
  await transaction.wait()
  OrderId = transactionReceipt.events[0].args.id
  console.log(`${user2.address} filled the order with Order Id ${OrderId}`)

  await wait(1)

  transaction = await exchange.connect(user1).makeOrder(UTMC.address, weiValue(50), MBTBA.address, weiValue(15))
  transactionReceipt = await transaction.wait()
  OrderId = transactionReceipt.events[0].args.id
  console.log(`${user1.address} made an order with Order Id ${OrderId}`)

  await wait(1)

  transaction = await exchange.connect(user2).fillOrder(OrderId)
  await transaction.wait()
  OrderId = transactionReceipt.events[0].args.id
  console.log(`${user2.address} filled the order with Order Id ${OrderId}`)

  await wait(1)

  // Open orders: from both user1 and user2
  for(let i = 1; i <= 10; i++) {
    transaction = await exchange.connect(user1).makeOrder(UTMC.address, weiValue(10*i), MBTBA.address, weiValue(10))
    transactionReceipt = await transaction.wait()
    OrderId = transactionReceipt.events[0].args.id
    console.log(`${user1.address} made an order with Order Id ${OrderId}`)
    await wait(1)
  }

  for(let i = 1; i <= 10; i++) {
    transaction = await exchange.connect(user2).makeOrder(MBTBA.address, weiValue(10*i), UTMC.address, weiValue(10))
    transactionReceipt = await transaction.wait()
    OrderId = transactionReceipt.events[0].args.id
    console.log(`${user2.address} made an order with Order Id ${OrderId}`)
    await wait(1)
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});


