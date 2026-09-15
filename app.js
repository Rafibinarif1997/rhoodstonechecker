const CONFIG = {
  chainId: 4663,
  chainName: "Robinhood Chain",
  rpcUrl: "https://rpc.mainnet.chain.robinhood.com",
  explorer: "https://robinhoodchain.blockscout.com",
  contract: "0x6be906e10351B4a970521c386E89D9e4e34c47C9"
};

const ERC721_ABI = ["function balanceOf(address owner) view returns (uint256)"];

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

const HEX_CHAIN_ID = "0x" + CONFIG.chainId.toString(16);

function shortAddress(a){ return `${a.slice(0,6)}…${a.slice(-4)}`; }
function tierForBalance(n){
  if(n >= 8) return "DIAMOND";
  if(n >= 4) return "GOLD";
  if(n >= 2) return "SILVER";
  return "STONE";
}

function setStatus(message, error=false){
  if(!els.status) return;
  els.status.textContent = message || "";
  els.status.style.color = error ? "#ff7187" : "";
}

function isMobile(){ return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent); }

function walletDeepLink(){
  // MetaMask's official dapp deep-link opens this website inside MetaMask Mobile.
  const host = location.host;
  const path = location.pathname + location.search + location.hash;
  return `https://metamask.app.link/dapp/${host}${path}`;
}

function openWalletBrowser(){
  setStatus("Opening MetaMask…");
  const link = walletDeepLink();
  window.location.href = link;
}

async function getProvider(){
  if(window.ethereum) return window.ethereum;

  // Some wallet browsers expose the provider slightly after page load.
  for(let i=0;i<12;i++){
    await new Promise(r=>setTimeout(r,150));
    if(window.ethereum) return window.ethereum;
  }
  return null;
}

async function ensureRobinhoodChain(provider){
  try {
    const current = await provider.request({method:"eth_chainId"});
    if(String(current).toLowerCase() === HEX_CHAIN_ID.toLowerCase()) return;
  } catch(_) {}

  try {
    await provider.request({
      method:"wallet_switchEthereumChain",
      params:[{chainId:HEX_CHAIN_ID}]
    });
  } catch(e) {
    if(e && (e.code === 4902 || e.code === -32603)) {
      await provider.request({
        method:"wallet_addEthereumChain",
        params:[{
          chainId:HEX_CHAIN_ID,
          chainName:CONFIG.chainName,
          nativeCurrency:{name:"Ether",symbol:"ETH",decimals:18},
          rpcUrls:[CONFIG.rpcUrl],
          blockExplorerUrls:[CONFIG.explorer]
        }]
      });
      return;
    }
    throw e;
  }
}

async function connect(){
  setStatus("Connecting wallet…");
  try{
    let provider = await getProvider();

    // Normal Chrome/mobile browser: hand the dapp to MetaMask Mobile.
    if(!provider){
      if(isMobile()) {
        openWalletBrowser();
        return;
      }
      throw new Error("No wallet detected. Install MetaMask/Rabby/OKX, or open this site in a wallet browser.");
    }

    // IMPORTANT: request the account first. Some wallets reject network
    // switching before the dapp has permission to access the account.
    let accounts = await provider.request({method:"eth_requestAccounts"});
    if(!accounts || !accounts.length) throw new Error("No wallet account was selected.");

    await ensureRobinhoodChain(provider);

    // Network switch can recreate the provider state in some mobile wallets.
    provider = window.ethereum || provider;
    accounts = await provider.request({method:"eth_accounts"});
    const address = accounts && accounts[0];
    if(!address) throw new Error("Wallet connected, but no account was returned.");

    if(typeof ethers === "undefined") throw new Error("Ethers failed to load. Please refresh the page.");

    const browserProvider = new ethers.BrowserProvider(provider);
    const contract = new ethers.Contract(CONFIG.contract, ERC721_ABI, browserProvider);

    let balance;
    try {
      balance = Number(await contract.balanceOf(address));
    } catch(e) {
      throw new Error("Wallet connected, but the RhoodStone contract did not respond to balanceOf().");
    }

    if(balance <= 0){
      setStatus("Wallet connected, but this wallet does not hold a RhoodStone NFT.", true);
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
    setStatus("");
    document.getElementById("portal").scrollIntoView({behavior:"smooth"});
  }catch(err){
    console.error("RhoodStone wallet connection error:", err);
    let msg = err && err.message ? err.message : "Wallet connection failed.";
    if(err && err.code === 4001) msg = "Connection was rejected in your wallet.";
    if(err && err.code === 4902) msg = "Robinhood Chain could not be added to this wallet.";
    setStatus(msg, true);
  }
}

[els.connect,els.heroConnect,els.lockedConnect].forEach(b => b && b.addEventListener("click",connect));

function bindWalletEvents(provider){
  if(!provider || !provider.on || provider.__rhoodBound) return;
  provider.__rhoodBound = true;
  provider.on("accountsChanged", () => window.location.reload());
  provider.on("chainChanged", () => window.location.reload());
}

if(window.ethereum) bindWalletEvents(window.ethereum);
window.addEventListener("ethereum#initialized", () => bindWalletEvents(window.ethereum));
