import { useEffect } from "react"
import { ethers } from "ethers"
import config from "../config.json"
import TOKEN_ABI from "../ABIs/Token.json"
import "../App.css"

function App() {

  const loadBlockchainData = async function () {
    const accounts = await window.ethereum.request({method:"eth_requestAccounts"})
    console.log(accounts[0])

    //Connect ethers to the Blockchain
    const provider = new ethers.providers.Web3Provider(window.ethereum)

    //Get the Chain ID
    const network = await provider.getNetwork()
    const chainId = network.chainId

    //Get an instance of the MBTBA Token contract 
    const MBTBA = config[chainId].MBTBA
    const MBTBAToken = new ethers.Contract(MBTBA.address, TOKEN_ABI, provider)
    console.log(await MBTBAToken.name())
  }

  useEffect( () => {
    loadBlockchainData()
  })

  return (
    <div>

      {/* Navbar */}

      <main className='grid'>
        <section className='exchange__section--left grid'>

          {/* Markets */}
          {/* Balance */}
          {/* Order */}

        </section>
        <section className='exchange__section--right grid'>

          {/* PriceChart */}
          {/* Transactions */}
          {/* Trades */}
          {/* OrderBook */}

        </section>
      </main>

      {/* Alert */}

    </div>
  );
}

export default App;








