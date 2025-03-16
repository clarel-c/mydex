import { useSelector, useDispatch } from "react-redux";
import Blockies from "react-blockies";
import { loadAccount } from "../store/interactions"
import config from "../config.json"

const Navbar = function () {
    const provider = useSelector(state => state.providerReducer.connection)
    const chainId = useSelector(state => state.providerReducer.chainId)
    const account = useSelector(state => state.providerReducer.caller)
    const balance = useSelector(state => state.providerReducer.balance)
    const dispatch = useDispatch()

    const connectHandler = async function () {
        await loadAccount(provider, dispatch)
    }

    const networkHandler = async function (event) {
        //console.log(event.target.value)
        await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: event.target.value }]
        })
    }

    return (
        <div className='exchange__header grid'>
            <div className='exchange__header--brand flex'>
                <h1>MBTBA Token Exchange</h1>
            </div>

            <div className='exchange__header--networks flex'>
                {chainId &&
                    <select
                        name="networks"
                        id="networks"
                        defaultValue={config[chainId] ? `0x${chainId.toString(16)}` : "0"}
                        onChange={networkHandler}>
                        <option value="0" disabled>Select Network</option>
                        <option value="0x7A69">Localhost</option>
                        <option value="0xaa36a7">Sepolia</option>
                        <option value="0x13882">Amoy</option>
                    </select>
                }
            </div>

            <div className='exchange__header--account flex'>
                {
                    balance ? <p><small>My Balance</small>{parseFloat(balance).toFixed(4)} {config[chainId].symbol}</p>
                        :
                        <p><small>My Balance</small>0</p>
                }

                {
                    account ?
                        <a href={config[chainId] ? `${config[chainId].explorerURL}/address/${account}` : "#"}
                            target="_blank"
                            rel="noreferrer"
                        >{account.slice(0, 7) + "..." + account.slice(37, 42)}
                            <Blockies seed={account} className="identicon">
                            </Blockies>
                        </a>
                        :
                        <button className="button" onClick={connectHandler}>Connect</button>
                }
            </div>
        </div>
    )
}

export default Navbar;

