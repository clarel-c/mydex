async function main() {
  //Fetch the contract to deploy
  const Token = await ethers.getContractFactory("Token")

  //Deploy the contract
  const token = await Token.deploy("MBTBA Token", "MBTBA", 100000)
  await token.deployed()
  console.log(`Token Contract deployed to: ${token.address}`)
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});









