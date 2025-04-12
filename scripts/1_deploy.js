/* eslint-disable no-undef */
async function main() {
  console.log("Preparing deployment...\n")

  //Fetch the contracts to deploy
  const Token = await ethers.getContractFactory("Token")
  const Exchange = await ethers.getContractFactory("Exchange")

  const accounts = await ethers.getSigners()
  console.log(`Accounts fetched:\n${accounts[0].address}\n${accounts[2].address}\n`)

  //Deploy the contracts
  const MBTBA = await Token.deploy("MBTBA Token", "MBTBA", 100000)
  await MBTBA.deployed()
  console.log(`MBTBA Token deployed to: ${MBTBA.address}`)

  const UTMC = await Token.deploy("UTM Coin", "UTMC", 100000)
  await UTMC.deployed()
  console.log(`UTM Coin deployed to: ${UTMC.address}`)

  const LRNC = await Token.deploy("Learn Coin", "LRNC", 100000)
  await LRNC.deployed()
  console.log(`Learn Coin deployed to: ${LRNC.address}`)

  const exchange = await Exchange.deploy(accounts[2].address, 1)
  await exchange.deployed()
  console.log(`Exchange Contract deployed to: ${exchange.address}`)
  console.log(`The fee Account is ${accounts[2].address}`)
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

























