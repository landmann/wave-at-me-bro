import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import "./App.css";
import contractAbi from "./utils/WavePortal.json";
import OpenApp from "react-open-app";

const CONTRACT_ADDRESS = "0xFABECAB1F554B4eFD0D3E399760665eD518056bC";
const CONTRACT_ABI = contractAbi.abi;

const App = () => {
  const [currentAccount, setCurrentAccount] = useState("");
  const [totalNumWaves, setTotalNumWaves] = useState(0);
  const [message, setMessage] = useState("");
  const [allWaves, setAllWaves] = useState([]);
  const [isWaving, setIsWaving] = useState(false);

  const checkIfWalletIsConnected = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        console.log("Make sure you have metamask!");
        return;
      } else {
        console.log("We have the ethereum object", ethereum);
      }

      const accounts = await ethereum.request({ method: "eth_accounts" });

      if (accounts.length !== 0) {
        const account = accounts[0];
        console.log("Found an authorized account:", account);
        setCurrentAccount(account);
        getAllWaves();

        const wavePortalContract = getContractDetails();
        let count = await wavePortalContract.getTotalWaves();
        setTotalNumWaves(count.toNumber());
      } else {
        console.log("No authorized account found");
      }
    } catch (error) {
      console.log(error);
    }
  };

  const connectWallet = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        alert("Get MetaMask!");
        return;
      }

      const accounts = await ethereum.request({
        method: "eth_requestAccounts",
      });

      console.log("Connected", accounts[0]);
      setCurrentAccount(accounts[0]);

      const wavePortalContract = getContractDetails();
      let count = await wavePortalContract.getTotalWaves();
      console.log("COUNT", count.toNumber());
      setTotalNumWaves(count.toNumber());
    } catch (error) {
      console.log(error);
    }
  };

  const getContractDetails = () => {
    try {
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const wave = async () => {
    try {
      const { ethereum } = window;

      if (message.length <= 3) {
        console.log("MESSAGE MUST BE GREATER THAN 3 CHARS");
        return;
      }

      if (ethereum) {
        setIsWaving(true);
        const wavePortalContract = getContractDetails();
        let count = await wavePortalContract.getTotalWaves();

        setTotalNumWaves(count.toNumber());
        console.log("Retrieved total wave count...", count.toNumber());

        const waveTxn = await wavePortalContract.wave(message, {
          gasLimit: 300000,
        });
        console.log("Mining...", waveTxn.hash);
        setMessage("");

        await waveTxn.wait();
        console.log("Mined -- ", waveTxn.hash);

        count = await wavePortalContract.getTotalWaves();
        setTotalNumWaves(count.toNumber());

        console.log("Retrieved total wave count...", count.toNumber());
        setIsWaving(false);
      } else {
        console.log("Ethereum object doesn't exist!");
        setIsWaving(false);
      }
    } catch (error) {
      console.log(error);
      setIsWaving(false);
    }
  };

  const onInputChange = (event) => {
    const { value } = event.target;
    setMessage(value);
  };

  const getAllWaves = async () => {
    const { ethereum } = window;

    try {
      if (ethereum) {
        const wavePortalContract = getContractDetails();
        const waves = await wavePortalContract.getAllWaves();

        const wavesCleaned = waves.map((wave) => {
          return {
            address: wave.waver,
            timestamp: new Date(wave.timestamp * 1000),
            message: wave.message,
          };
        });

        setAllWaves(wavesCleaned);
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    console.log("USER", navigator.userAgent);
    checkIfWalletIsConnected();
    let wavePortalContract;

    const onNewWave = (from, timestamp, message) => {
      console.log("NewWave", from, timestamp, message);
      setAllWaves((prevState) => [
        ...prevState,
        {
          address: from,
          timestamp: new Date(timestamp * 1000),
          message: message,
        },
      ]);
    };

    if (window.ethereum) {
      wavePortalContract = getContractDetails();
      wavePortalContract.on("NewWave", onNewWave);
    }

    return () => {
      if (wavePortalContract) {
        wavePortalContract.off("NewWave", onNewWave);
      }
    };
  }, []);

  return (
    <div className="mainContainer">
      <div className="dataContainer">
        <div className="header">
          <span>🛩</span> Welcome General!
          <div>
            {navigator.userAgent}
            <div>
              {navigator.userAgent.includes("Instagram") &&
                "YOU ARE ON INSTAGRAM!"}
            </div>
            <OpenApp href="https://twitter.com/enzo_ferey">Twitter</OpenApp>
            <OpenApp href={window.location.href}>Website</OpenApp>
          </div>
        </div>

        <div className="bio">
          Welcome aboard, captain! In this mission, you'll get a chance to wave
          at your fellow KoolTravelers. This way, you can all hang and chat and
          socialize and collaborate
          <span role="img" aria-label="star">
            ✨
          </span>{" "}
          !
        </div>
        <div className="bio">So far, we've got</div>
        <div className="counter">{totalNumWaves}</div>
        <div className="bio"> wave{totalNumWaves === 1 ? "" : "s"}! </div>
        <div className="bio">Can we reach 888,888?</div>

        {!currentAccount && (
          <button
            className="cta-button submit-gif-button"
            style={{
              marginTop: "16px",
              padding: "8px",
            }}
            onClick={connectWallet}
          >
            Connect Wallet
          </button>
        )}

        {currentAccount && (
          <div className="connected-container">
            <form
              onSubmit={(event) => {
                event.preventDefault();
                wave();
              }}
            >
              <input
                type="text"
                placeholder="Whatchu say?"
                value={message}
                onChange={onInputChange}
              />
              <button
                type="submit"
                className="cta-button submit-gif-button"
                disabled={isWaving}
              >
                {isWaving ? "Sending wave..." : "SEND IT!"}
              </button>
            </form>
          </div>
        )}

        {allWaves.map((wave, index) => {
          return (
            <div
              key={index}
              className="connect-wallet-button box"
              style={{
                borderRadius: "15px",
                borderColor: "blue",
                marginTop: "16px",
                padding: "16px",
              }}
            >
              <div>Address: {wave.address}</div>
              <div>Time: {wave.timestamp.toString()}</div>
              <div>Message: {wave.message}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default App;
