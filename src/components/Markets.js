import config from '../config.json'
import { useSelector, useDispatch} from 'react-redux';
import { loadTokens } from '../store/interactions';

const Markets = () => {
    const provider = useSelector(state => state.providerReducer.connection);
    const chainId = useSelector(state => state.providerReducer.chainId);
    const dispatch = useDispatch();

    const marketHandler = (event) => {
        loadTokens(provider, event.target.value.split(','), dispatch)

    }

    return (
        <div className="component exchange__markets">
            <div className="component__header">
                <h2>Select Market</h2>
            </div>
            {
                chainId && config[chainId] &&
                <select name="markets" id="markets" onChange={marketHandler}>
                    <option value={`${config[chainId].MBTBA.address},${config[chainId].UTMC.address}`}>
                        MBTBA/ UTMC</option>
                    <option value={`${config[chainId].MBTBA.address},${config[chainId].LRNC.address}`}>
                        MBTBA/ LRNC</option>
                </select>
            }
            <hr />
        </div>
    );
}

export default Markets;


