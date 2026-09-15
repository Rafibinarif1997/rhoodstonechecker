const CONFIG = {
  chainId: 4663,
  chainName: "Robinhood Chain",
  rpcUrl: "https://rpc.mainnet.chain.robinhood.com",
  explorer: "https://robinhoodchain.blockscout.com",
  contract: "0x6be906e10351B4a970521c386E89D9e4e34c47C9"
};

const ERC721_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function supportsInterface(bytes4 interfaceId) view returns (bool)"
];

const els = {
  connect: document.getElementById("connect"),
  heroConnect: document.getElementById("heroConnect"),
  lockedConnect: document.getElementById("lockedConnect"),
  locked: document.getElementById("locked"),
  dashboard: document.getElementById("dashboard"),
  status: document.getElementById("status"),
  address: document.getElementById("address"),
  balance: document.getElementById("balance"),
  passportBalance: document.getElementById("passportBalance"),
  tier: document.getElementById("tier"),
  tierBadge: document.getElementById("tierBadge")
};

function shortAddress(a){ return `${a.slice(0,6)}…${a.slice(-4)}`; }

function tierForBalance(n){
  if(n >= 8) return "DIAMOND";
  if(n >= 4) return "GOLD";
  if(n >= 2) return "SILVER";
  return "STONE";
}

async function ensureRobinhoodChain(){
  if(!window.ethereum) throw new Error("No EVM wallet detected.");
  const hex = "0x" + CONFIG.chainId.toString(16);
  try {
    await window.ethereum.request({method:"wallet_switchEthereumChain", params:[{chainId:hex}]});
  } catch(e) {
    if(e.code !== 4902) throw e;
    await window.ethereum.request({
      method:"wallet_addEthereumChain",
      params:[{
        chainId:hex,
        chainName:CONFIG.chainName,
        nativeCurrency:{name:"Ether",symbol:"ETH",decimals:18},
        rpcUrls:[CONFIG.rpcUrl],
        blockExplorerUrls:[CONFIG.explorer]
      }]
    });
  }
}

async function connect(){
  els.status.textContent = "Connecting wallet…";
  try{
    if(!window.ethereum) throw new Error("Open this site in an EVM-compatible wallet browser or install a wallet extension.");
    await ensureRobinhoodChain();
    const provider = new ethers.BrowserProvider(window.ethereum);
    await provider.send("eth_requestAccounts",[]);
    const signer = await provider.getSigner();
    const address = await signer.getAddress();
    const contract = new ethers.Contract(CONFIG.contract, ERC721_ABI, provider);

    let balance;
    try {
      balance = Number(await contract.balanceOf(address));
    } catch(e) {
      throw new Error("The contract did not respond to ERC-721 balanceOf(). The NFT standard/ABI needs to be verified before production launch.");
    }

    if(balance <= 0){
      els.status.textContent = "This wallet does not hold a RhoodStone NFT.";
      els.status.style.color = "#ff7187";
      return;
    }

    const tier = tierForBalance(balance);
    els.address.textContent = shortAddress(address);
    els.balance.textContent = balance;
    els.passportBalance.textContent = `${balance} NFT${balance===1?"":"s"}`;
    els.tier.textContent = tier;
    els.tierBadge.textContent = tier;
    els.locked.classList.add("hidden");
    els.dashboard.classList.remove("hidden");
    els.connect.textContent = "Holder Portal";
    els.status.textContent = "";
    document.getElementById("portal").scrollIntoView({behavior:"smooth"});
  }catch(err){
    console.error(err);
    els.status.textContent = err.message || "Wallet connection failed.";
    els.status.style.color = "#ff7187";
  }
}

[els.connect,els.heroConnect,els.lockedConnect].forEach(b => b && b.addEventListener("click",connect));

if(window.ethereum){
  window.ethereum.on("accountsChanged",()=>location.reload());
  window.ethereum.on("chainChanged",()=>location.reload());
}
