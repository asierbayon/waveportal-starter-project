import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import "./App.css";
import abi from "./utils/WavePortal.json";

const contractAddress = "0x6f6eB31A0285B339647A6EAce69A774Bb3bfC9ea";

export default function App() {
   const [currentAccount, setCurrentAccount] = useState("");
   const [allWaves, setAllWaves] = useState([]);
   const [message, setMessage] = useState("");

   const checkIfWalletIsConnected = async () => {
      try {
         const { ethereum } = window;
         /*
          * Check if we're authorized to access the user's wallet
          */
         const accounts = await ethereum.request({ method: "eth_accounts" });

         if (accounts.length !== 0) {
            const account = accounts[0];
            setCurrentAccount(account);
            getAllWaves();
         } else {
            console.log("No authorized account found");
         }
      } catch (error) {
         console.log(error);
      }
   };

   const getAllWaves = async () => {
      try {
         const { ethereum } = window;
         if (ethereum) {
            const provider = new ethers.providers.Web3Provider(ethereum);
            const signer = provider.getSigner();
            const wavePortalContract = new ethers.Contract(contractAddress, abi.abi, signer);

            const waves = await wavePortalContract.getAllWaves();

            let wavesCleaned = [];
            waves.forEach((wave) => {
               wavesCleaned.push({
                  address: wave.waver,
                  timestamp: new Date(wave.timestamp * 1000),
                  message: wave.message,
               });
            });

            /*
             * Store our data in React State
             */
            setAllWaves(wavesCleaned);
         } else {
            console.log("Ethereum object doesn't exist!");
         }
      } catch (error) {
         console.log(error);
      }
   };

   const connectWallet = async () => {
      try {
         const { ethereum } = window;

         if (!ethereum) {
            alert("Download MetaMask!");
            return;
         }

         const accounts = await ethereum.request({ method: "eth_requestAccounts" });

         setCurrentAccount(accounts[0]);
      } catch (error) {
         console.log(error);
      }
   };

   const wave = async () => {
      try {
         const { ethereum } = window;

         if (ethereum) {
            const provider = new ethers.providers.Web3Provider(ethereum);
            const signer = provider.getSigner();
            const wavePortalContract = new ethers.Contract(contractAddress, abi.abi, signer);

            let count = await wavePortalContract.getTotalWaves();
            console.log("Retrieved total wave count...", count.toNumber());

            const waveTxn = await wavePortalContract.wave(message, { gasLimit: 300000 });
            console.log("Mining...", waveTxn.hash);

            await waveTxn.wait();
            console.log("Mined -- ", waveTxn.hash);

            count = await wavePortalContract.getTotalWaves();
            console.log("Retrieved total wave count...", count.toNumber());
         } else {
            console.log("Ethereum object doesn't exist!");
         }
      } catch (error) {
         console.log(error);
      }
   };

   const handleChangeMessage = (event) => {
      setMessage(event.target.value);
   };

   useEffect(() => {
      checkIfWalletIsConnected();
   }, []);

   useEffect(() => {
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
         const provider = new ethers.providers.Web3Provider(window.ethereum);
         const signer = provider.getSigner();

         wavePortalContract = new ethers.Contract(contractAddress, abi.abi, signer);
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
               Hey{" "}
               <span aria-label="emoji" role="img">
                  👋
               </span>{" "}
               I'm Asier!
            </div>

            <div className="bio">
               Wave at me on the Ethereum blockchain! Maybe send a sweet message too?
               <br />
               Connect your wallet, write your message, and then wave{" "}
               <span aria-label="emoji" role="img">
                  👋
               </span>
               <br />
               Every message has a 50% chance of winning some ETH!{" "}
               <span aria-label="emoji" role="img">
                  🤑
               </span>
            </div>

            {!currentAccount ? (
               <button className="button" onClick={connectWallet}>
                  Connect Wallet
               </button>
            ) : (
               <div className="waveContainer">
                  <textarea
                     className="waveTextArea"
                     name="waveTextArea"
                     id="waveTextArea"
                     rows="10"
                     onChange={handleChangeMessage}
                  />
                  <button className="button" disabled={message.length < 1} onClick={wave}>
                     Wave at Me
                  </button>
               </div>
            )}

            <h2 className="waveLogTitle">
               Wave log{" "}
               <span aria-label="emoji" role="img">
                  👀
               </span>
            </h2>
            <p className="waveLogSubtitle">Check out all these people out here waving!</p>
            {allWaves.map((wave, index) => {
               return (
                  <div
                     key={index}
                     style={{
                        backgroundColor: "rgba(137,207,240, 0.2)",
                        marginTop: "16px",
                        padding: "20px",
                     }}
                  >
                     <div className="waveItem">
                        <b>Address:</b> {wave.address}
                     </div>
                     <div className="waveItem">
                        <b>Time:</b> {wave.timestamp.toString()}
                     </div>
                     <div className="waveItem">
                        <b>Message:</b> {wave.message}
                     </div>
                  </div>
               );
            })}
         </div>
      </div>
   );
}
