import { useSelector } from 'react-redux';
import { useRef, useEffect } from 'react';
import { myEventsSelector } from '../store/selectors';
import config from "../config.json"

const Alert = () => {
  const transaction = useSelector(state => state.exchangeReducer.transaction);
  const { isPending, isError, isSuccessful } = transaction;
  const alertRef = useRef(null);
  const caller = useSelector(state => state.providerReducer.caller);
  const events = useSelector(myEventsSelector)
  const chainId = useSelector(state => state.providerReducer.chainId)

  const removeHandler = async () => {
    alertRef.current.className = "alert alert--remove";
  };

  useEffect(() => {
    if ((isPending || isError || isSuccessful) && caller) {
      alertRef.current.className = "alert";
    }
  }, [isPending, isError, isSuccessful, caller]);

  // Determine alert content based on transaction state
  let content = null;
  if (isPending) {
    content = <h1>Transaction Pending...</h1>;
  } else if (isError) {
    content = <h1>Transaction Will Fail</h1>;
  } else if (isSuccessful) {
    content = <div>
      <h1>Transaction Successful</h1>
      {events && events.length > 0 ? (
        <a
        href={config[chainId] ? `${config[chainId].explorerURL}/tx/${events[0].transactionHash}` : "#"}
        target="_blank"
        rel="noreferrer"      
        >
          {events[0].transactionHash.slice(0,6) + "..." + events[0].transactionHash.slice(60,66) }
        </a>
      ) : (
        ""
      )}
    </div>;
  }

  return (
    <div>
      <div className="alert alert--remove" ref={alertRef} onClick={removeHandler}>
        {content}
      </div>
    </div>
  );
};

export default Alert;
