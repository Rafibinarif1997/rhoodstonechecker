import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./styles.css";

import { createAppKit } from "@reown/appkit/react";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";

const projectId = import.meta.env.VITE_REOWN_PROJECT_ID;

const robinhoodChain = {
  id: 4663,
  name: "Robinhood Chain",
  nativeCurrency: {
    name: "Ether",
    symbol: "ETH",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["https://rpc.mainnet.chain.robinhood.com"],
    },
  },
  blockExplorers: {
    default: {
      name: "Robinhood Chain Explorer",
      url: "https://robinhoodchain.blockscout.com",
    },
  },
  chainNamespace: "eip155",
  caipNetworkId: "eip155:4663",
};

const networks = [robinhoodChain];

const wagmiAdapter = new WagmiAdapter({
  networks,
  projectId,
});

const queryClient = new QueryClient();

createAppKit({
  adapters: [wagmiAdapter],
  networks,
  projectId,
  defaultNetwork: robinhoodChain,
  metadata: {
    name: "RhoodStone",
    description: "RhoodStone Ecosystem",
    url: "https://rhoodstone.xyz",
    icons: ["https://rhoodstone.xyz/favicon.ico"],
  },
  features: {
    analytics: true,
  },
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <WagmiProvider config={wagmiAdapter.wagmiConfig}>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </WagmiProvider>
);
