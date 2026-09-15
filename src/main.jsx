import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./styles.css";

import { createAppKit } from "@reown/appkit/react";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createConfig, http } from "wagmi";
import { defineChain } from "viem";

const projectId = import.meta.env.VITE_REOWN_PROJECT_ID;

const robinhood = defineChain({
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
});

const wagmiConfig = createConfig({
  chains: [robinhood],
  transports: {
    [robinhood.id]: http(),
  },
});

const queryClient = new QueryClient();

createAppKit({
  adapters: [],
  projectId,
  networks: [robinhood],
  defaultNetwork: robinhood,
  metadata: {
    name: "RhoodStone",
    description: "RhoodStone Ecosystem",
    url: "https://rhoodstone.xyz",
    icons: ["https://rhoodstone.xyz/favicon.ico"],
  },
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </WagmiProvider>
  </React.StrictMode>
);
