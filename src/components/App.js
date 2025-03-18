import { useEffect } from "react"
import { useDispatch } from "react-redux"
import config from "../config.json"
import "../App.css"

import { loadProvider, loadNetwork, loadAccount, loadTokens, loadExchange } from "../store/interactions"

import Navbar from "./Navbar"
import Markets from "./Markets"

function App() {
  const dispatch = useDispatch()

  const loadBlockchainData = async function () {
    //Connect ethers to the Blockchain
    const provider = loadProvider(dispatch)

    //Load the caller account when changed
    window.ethereum.on("accountsChanged", async function() {
      await loadAccount(provider, dispatch)
    })

    //Get the Chain ID
    const chainId = await loadNetwork(provider, dispatch)

    //Reload the page when the network changes
    window.ethereum.on("chainChanged", async function() {
      window.location.reload()
    })   


    //Get an instance of the MBTBA Token contract and UTMC Token contract
    const MBTBA = config[chainId].MBTBA
    const UTMC = config[chainId].UTMC
    await loadTokens(provider, [MBTBA.address, UTMC.address], dispatch)

    //Load the exchange contract
    const exchange = config[chainId].exchange
    await loadExchange(provider, exchange.address, dispatch)
  }

  useEffect(() => {
    loadBlockchainData()
  })

  return (
    <div>

      <Navbar/>

      <main className='grid'>
        <section className='exchange__section--left grid'>

          <Markets/>
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








