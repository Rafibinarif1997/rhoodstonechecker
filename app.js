const CONFIG = {
  chainId: 4663,
  chainName: "Robinhood Chain",
  rpcUrl: "https://rpc.mainnet.chain.robinhood.com",
  explorer: "https://robinhoodchain.blockscout.com",
  contract: "0x6be906e10351B4a970521c386E89D9e4e34c47C9"
};

const ERC721_ABI = [
  "function balanceOf(address owner) view returns (uint256)"
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

let activeProvider = null;
let browserProvider = null;
let connectedAddress = null;

function shortAddress(a) {
  return `${a.slice(0, 6)}…${a.slice(-4)}`;
}

function tierForBalance(n) {
  if (n >= 8) return "DIAMOND";
  if (n >= 4) return "GOLD";
  if (n >= 2) return "SILVER";
  return "STONE";
}

function setStatus(message, error = false) {
  els.status.textContent = message || "";
  els.status.style.color = error ? "#ff7187" : "";
}

function getInjectedProviders() {
  const providers = [];
  if (Array.isArray(window.ethereum?.providers)) {
    providers.push(...window.ethereum.providers);
  } else if (window.ethereum) {
    providers.push(window.ethereum);
  }
  return providers;
}

function providerName(p) {
  if (p?.isMetaMask) return "MetaMask";
  if (p?.isRabby) return "Rabby";
  if (p?.isCoinbaseWallet) return "Coinbase Wallet";
  if (p?.isOKExWallet || p?.isOKXWallet) return "OKX Wallet";
  if (p?.isTrust) return "Trust Wallet";
  return "wallet";
}

async function getWalletProvider() {
  // Prefer EIP-6963 multi-wallet discovery when available.
  const discovered = [];
  const handler = (event) => {
    if (event?.detail?.provider) discovered.push(event.detail);
  };

  window.addEventListener("eip6963:announceProvider", handler);
  window.dispatchEvent(new Event("eip6963:requestProvider"));

  await new Promise(resolve => setTimeout(resolve, 150));
  window.removeEventListener("eip6963:announceProvider", handler);

  if (discovered.length) {
    const preferred = discovered.find(x =>
      /metamask|rabby|okx|coinbase|trust/i.test(
        `${x.info?.name || ""} ${x.info?.rdns || ""}`
      )
    );
    activeProvider = preferred?.provider || discovered[0].provider;
    return activeProvider;
  }

  const injected = getInjectedProviders();
  if (injected.length) {
    activeProvider =
      injected.find(p => p.isMetaMask) ||
      injected.find(p => p.isRabby) ||
      injected.find(p => p.isOKXWallet || p.isOKExWallet) ||
      injected[0];
    return activeProvider;
  }

  return null;
}

async function ensureRobinhoodChain(provider) {
  const chainIdHex = "0x" + CONFIG.chainId.toString(16);

  const current = await provider.request({ method: "eth_chainId" });
  if (current?.toLowerCase() === chainIdHex.toLowerCase()) return;

  setStatus("Switching to Robinhood Chain…");

  try {
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: chainIdHex }]
    });
  } catch (e) {
    // 4902 = chain not added to this wallet.
    if (e?.code !== 4902) {
      if (e?.code === 4001) throw new Error("Network switch was cancelled in your wallet.");
      throw e;
    }

    await provider.request({
      method: "wallet_addEthereumChain",
      params: [{
        chainId: chainIdHex,
        chainName: CONFIG.chainName,
        nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
        rpcUrls: [CONFIG.rpcUrl],
        blockExplorerUrls: [CONFIG.explorer]
      }]
    });
  }
}

async function verifyHolder(address, provider) {
  const contract = new ethers.Contract(CONFIG.contract, ERC721_ABI, provider);

  try {
    const raw = await contract.balanceOf(address);
    return Number(raw);
  } catch (e) {
    console.error("balanceOf error:", e);
    throw new Error(
      "We couldn't read RhoodStone ownership from the contract. Please try again, and if the problem continues verify the NFT contract/ABI."
    );
  }
}

async function connect() {
  setStatus("Connecting wallet…");

  try {
    if (!window.ethereum && !window.ethereum?.providers) {
      throw new Error(
        "No wallet was detected. Open this page in MetaMask, Rabby, OKX Wallet, or another EVM-compatible wallet browser."
      );
    }

    const provider = await getWalletProvider();
    if (!provider) {
      throw new Error("No compatible EVM wallet was detected.");
    }

    // Request accounts BEFORE switching networks. Some wallet providers
    // reject network requests until the wallet is connected.
    const accounts = await provider.request({ method: "eth_requestAccounts" });
    if (!accounts?.length) throw new Error("No wallet account was returned.");

    await ensureRobinhoodChain(provider);

    browserProvider = new ethers.BrowserProvider(provider);

    // Refresh the account after the possible network switch.
    const finalAccounts = await provider.request({ method: "eth_accounts" });
    connectedAddress = finalAccounts?.[0] || accounts[0];

    setStatus("Verifying RhoodStone ownership…");

    const balance = await verifyHolder(connectedAddress, browserProvider);

    if (balance <= 0) {
      setStatus("This wallet does not hold a RhoodStone NFT.", true);
      return;
    }

    const tier = tierForBalance(balance);

    els.address.textContent = shortAddress(connectedAddress);
    els.balance.textContent = balance;
    els.passportBalance.textContent = `${balance} NFT${balance === 1 ? "" : "s"}`;
    els.tier.textContent = tier;
    els.tierBadge.textContent = tier;

    els.locked.classList.add("hidden");
    els.dashboard.classList.remove("hidden");
    els.connect.textContent = "Holder Portal";
    setStatus("");

    document.getElementById("portal").scrollIntoView({ behavior: "smooth" });
  } catch (err) {
    console.error(err);

    if (err?.code === 4001) {
      setStatus("Connection was cancelled in your wallet.", true);
    } else {
      setStatus(err?.message || "Wallet connection failed. Please try again.", true);
    }
  }
}

[els.connect, els.heroConnect, els.lockedConnect].forEach(
  b => b && b.addEventListener("click", connect)
);

// React to wallet changes without forcing a full page reload.
async function handleAccountsChanged(accounts) {
  if (!accounts?.length) {
    connectedAddress = null;
    browserProvider = null;
    els.locked.classList.remove("hidden");
    els.dashboard.classList.add("hidden");
    els.connect.textContent = "Connect Wallet";
    setStatus("");
    return;
  }

  // Re-verify the newly selected account.
  connect();
}

function handleChainChanged() {
  // The portal requires Robinhood Chain. Re-running connect handles both
  // network changes and ownership verification.
  if (connectedAddress) connect();
}

async function initWalletEvents() {
  const provider = await getWalletProvider();
  if (!provider?.on) return;

  provider.on("accountsChanged", handleAccountsChanged);
  provider.on("chainChanged", handleChainChanged);
}

initWalletEvents();
