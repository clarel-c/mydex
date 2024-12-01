import { useEffect } from "react"
import { useDispatch } from "react-redux"
import config from "../config.json"
import "../App.css"

import { loadProvider, loadNetwork, loadAccount, loadToken } from "../store/interactions"

function App() {
  const dispatch = useDispatch()

  const loadBlockchainData = async function () {
    //Load the caller account
    await loadAccount(dispatch)

    //Connect ethers to the Blockchain
    const provider = loadProvider(dispatch)

    //Get the Chain ID
    const chainId = await loadNetwork(provider, dispatch)

    //Get an instance of the MBTBA Token contract 
    const MBTBA = config[chainId].MBTBA
    await loadToken(provider, MBTBA.address, dispatch)
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








