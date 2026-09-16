import { createPublicClient, http } from "viem";

export const RHOODSTONE_CONTRACT =
  "0x6be906e10351b4a970521c386e89d9e4e34c47c9";

export const robinhoodChain = {
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
};

const client = createPublicClient({
  chain: robinhoodChain,
  transport: http("https://rpc.mainnet.chain.robinhood.com", {
    timeout: 15000,
    retryCount: 3,
    retryDelay: 1000,
  }),
});

const ERC721_ABI = [
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [
      {
        name: "owner",
        type: "address",
      },
    ],
    outputs: [
      {
        name: "",
        type: "uint256",
      },
    ],
  },
];

export async function checkRhoodStoneHolder(walletAddress) {
  if (!walletAddress) {
    return 0;
  }

  const balance = await client.readContract({
    address: RHOODSTONE_CONTRACT,
    abi: ERC721_ABI,
    functionName: "balanceOf",
    args: [walletAddress],
  });

  return Number(balance);
}
