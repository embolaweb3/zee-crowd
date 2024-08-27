import { useState, useEffect } from "react";
import { Button, Alert } from "react-bootstrap";

export default function ConnectWallet({ onConnect }) {
  const [walletConnected, setWalletConnected] = useState(false);
  const [account, setAccount] = useState("");

  useEffect(() => {
    checkIfWalletIsConnected();
  }, []);

  const checkIfWalletIsConnected = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        console.log("Make sure you have MetaMask installed!");
        return;
      }

      const accounts = await ethereum.request({ method: "eth_accounts" });
      if (accounts.length > 0) {
        setWalletConnected(true);
        setAccount(accounts[0]);
        onConnect(accounts[0]);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const connectWallet = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        alert("Get MetaMask!");
        return;
      }

      const accounts = await ethereum.request({ method: "eth_requestAccounts" });
      setWalletConnected(true);
      setAccount(accounts[0]);
      onConnect(accounts[0]);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="mt-4">
      {!walletConnected ? (
        <Button variant="primary" onClick={connectWallet}>
          Connect Wallet
        </Button>
      ) : (
        <Alert variant="success">
          Connected: {account}
        </Alert>
      )}
    </div>
  );
}
