import React, {useEffect, useMemo, useState} from "react";
import {createRoot} from "react-dom/client";
import {BrowserProvider, Contract, getAddress} from "ethers";
import "./styles.css";

const CONTRACT = import.meta.env.VITE_RHOODSTONE_CONTRACT_ADDRESS || "";
const REQUIRED_CHAIN = Number(import.meta.env.VITE_RHOODSTONE_CHAIN_ID || 0);
const NFT_ABI = [
  "function balanceOf(address owner) view returns (uint256)"
];

function short(a){return a ? `${a.slice(0,6)}…${a.slice(-4)}` : ""}

function App(){
  const [account,setAccount]=useState("");
  const [status,setStatus]=useState("idle");
  const [message,setMessage]=useState("");
  const [menu,setMenu]=useState(false);

  const installed = useMemo(()=>typeof window.ethereum !== "undefined",[ ]);

  async function getProvider(){
    if(!window.ethereum) throw new Error("No wallet detected. Please install/open a compatible Web3 wallet.");
    return new BrowserProvider(window.ethereum);
  }

  async function verify(address, provider){
    if(!CONTRACT || !/^0x[a-fA-F0-9]{40}$/.test(CONTRACT)){
      setStatus("config");
      setMessage("NFT contract address is not configured yet. Add VITE_RHOODSTONE_CONTRACT_ADDRESS in your .env file.");
      return false;
    }
    try{
      const network=await provider.getNetwork();
      if(REQUIRED_CHAIN && Number(network.chainId)!==REQUIRED_CHAIN){
        setStatus("wrongchain");
        setMessage(`Wrong network. Please switch to the chain used by Rhoodstone (Chain ID ${REQUIRED_CHAIN}).`);
        return false;
      }
      const nft=new Contract(getAddress(CONTRACT),NFT_ABI,provider);
      const balance=await nft.balanceOf(address);
      if(balance>0n){
        setStatus("verified");
        setMessage(`Verified holder • ${balance.toString()} Rhoodstone NFT${balance===1n?"":"s"}`);
        return true;
      }
      setStatus("not");
      setMessage("This wallet does not currently hold a Rhoodstone NFT.");
      return false;
    }catch(e){
      console.error(e);
      setStatus("error");
      setMessage(e?.shortMessage || e?.message || "Verification failed. Please try again.");
      return false;
    }
  }

  async function connect(){
    try{
      setStatus("connecting"); setMessage("");
      const provider=await getProvider();
      await provider.send("eth_requestAccounts",[]);
      const signer=await provider.getSigner();
      const address=await signer.getAddress();
      setAccount(address);
      await verify(address,provider);
      localStorage.setItem("rhoodstone_account",address);
    }catch(e){
      setStatus("error");
      setMessage(e?.shortMessage || e?.message || "Wallet connection was cancelled.");
    }
  }

  function disconnect(){
    setAccount(""); setStatus("idle"); setMessage("");
    localStorage.removeItem("rhoodstone_account");
    setMenu(false);
  }

  async function refresh(){
    if(!account) return connect();
    try{
      const provider=await getProvider();
      await verify(account,provider);
    }catch(e){ setStatus("error"); setMessage(e?.message || "Could not refresh verification."); }
  }

  useEffect(()=>{
    if(!window.ethereum) return;
    const onAccounts=(accounts)=>{
      if(!accounts?.length) disconnect();
      else { setAccount(accounts[0]); getProvider().then(p=>verify(accounts[0],p)); }
    };
    const onChain=()=>{ if(account) refresh(); };
    window.ethereum.on("accountsChanged",onAccounts);
    window.ethereum.on("chainChanged",onChain);
    const saved=localStorage.getItem("rhoodstone_account");
    if(saved){ setAccount(saved); getProvider().then(p=>verify(saved,p)); }
    return ()=>{window.ethereum.removeListener("accountsChanged",onAccounts);window.ethereum.removeListener("chainChanged",onChain)};
  },[]);

  return <div className="site">
    <header className="nav">
      <a className="brand" href="#home"><img src="/rhoodstone-stone.jpg"/><span>RHOODSTONE</span></a>
      <nav><a href="#home">Home</a><a href="#about">About</a><a href="#roadmap">Roadmap</a><a href="#faq">FAQ</a></nav>
      <div className="walletArea">
        {!account ? <button className="walletBtn" onClick={connect}>Connect Wallet</button> :
        <div className="walletWrap"><button className="walletBtn connected" onClick={()=>setMenu(!menu)}>✓ {short(account)} <span>⌄</span></button>
        {menu && <div className="walletMenu"><div className="address">{account}</div><button onClick={refresh}>Refresh Verification</button><button className="danger" onClick={disconnect}>Disconnect</button></div>}</div>}
      </div>
    </header>

    <main id="home">
      <section className="hero">
        <div className="heroOverlay"/>
        <div className="heroContent">
          <div className="eyebrow">MORE THAN A STONE</div>
          <h1>RHOOD<br/><span>STONE</span></h1>
          <p>A symbol of belief, community, freedom and a brighter tomorrow.</p>
          <div className="actions">
            <button className="primary" onClick={account?refresh:connect}>{account?"Verify Holder":"Connect Wallet & Verify"}</button>
            <a className="secondary" href="#about">Learn More ↓</a>
          </div>
          {status!=="idle" && <div className={`status ${status}`}>
            {status==="connecting" ? "Connecting to your wallet…" :
             status==="verified" ? "✓ " : status==="not" ? "✕ " : "• "}{message}
          </div>}
        </div>
      </section>

      <section className="section intro" id="about">
        <div><div className="eyebrow">THE IDEA</div><h2>What is Rhoodstone?</h2></div>
        <div><p>Rhoodstone is a community-driven NFT built around a simple idea: holding a stone means holding a place in an ecosystem that grows with its community.</p><p>Phase 1 is intentionally simple. Connect your wallet once, verify your Rhoodstone ownership, and unlock the holder experience. Future utilities can be added without changing this core flow.</p></div>
      </section>

      <section className="featureGrid">
        <article><b>01</b><h3>Holder First</h3><p>Access begins with verified ownership. No repeated wallet connection inside the experience.</p></article>
        <article><b>02</b><h3>Built to Grow</h3><p>Future ecosystem features can be introduced in phases while keeping the holder journey simple.</p></article>
        <article><b>03</b><h3>Community Driven</h3><p>Rhoodstone is designed around participation, access and long-term community value.</p></article>
      </section>

      <section className="stoneSection" id="roadmap">
        <div className="stoneVisual"><img src="/rhoodstone-stone.jpg"/></div>
        <div><div className="eyebrow">PHASE 01</div><h2>Verify. Then unlock.</h2><p>One wallet connection powers the entire site. Once connected, the website remembers the active wallet and uses the same session for holder-gated features.</p><div className="steps"><div><span>01</span>Connect wallet</div><div><span>02</span>Check Rhoodstone NFT balance</div><div><span>03</span>Verified holder experience</div></div></div>
      </section>

      <section className="faq section" id="faq">
        <div className="eyebrow">FAQ</div><h2>Simple by design.</h2>
        <details><summary>Do I need to connect my wallet on every page?</summary><p>No. The production app keeps one wallet session across the site. Internal pages do not show another Connect Wallet button.</p></details>
        <details><summary>What happens if I disconnect?</summary><p>The site clears its local session and gated holder access becomes unavailable until the wallet is connected again.</p></details>
        <details><summary>How is ownership checked?</summary><p>The production version reads the NFT contract's balanceOf(address) on-chain. This demo includes that logic; you only need to provide the real contract address and chain ID.</p></details>
      </section>
    </main>
    <footer>RHOODSTONE • MORE THAN A STONE</footer>
  </div>
}
createRoot(document.getElementById("root")).render(<App/>);