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

export const rhoodstoneClient = createPublicClient({
  chain: robinhoodChain,
  transport: http(),
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
    return false;
  }

  const balance = await rhoodstoneClient.readContract({
    address: RHOODSTONE_CONTRACT,
    abi: ERC721_ABI,
    functionName: "balanceOf",
    args: [walletAddress],
  });

  return balance > 0n;
}
