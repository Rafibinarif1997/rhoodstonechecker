export const CONTRACT='0x6be906e10351B4a970521c386E89D9e4e34c47C9';
export const CHAIN_ID=4663;
export const CHAIN_HEX='0x1237';
export const RPC='https://rpc.mainnet.chain.robinhood.com';
export const EXPLORER='https://robinhoodchain.blockscout.com';

const BALANCE_OF='0x70a08231';

export const shortAddress=(a)=>a?`${a.slice(0,6)}…${a.slice(-4)}`:'';

export async function rpc(method,params=[]){
  const r=await fetch(RPC,{method:'POST',headers:{'content-type':'application/json'},
    body:JSON.stringify({jsonrpc:'2.0',id:1,method,params})});
  return r.json();
}

export async function addOrSwitchRobinhood(){
  if(!window.ethereum) throw new Error('No Web3 wallet detected.');
  try{
    await window.ethereum.request({method:'wallet_switchEthereumChain',params:[{chainId:CHAIN_HEX}]});
  }catch(e){
    if(e.code!==4902) throw e;
    await window.ethereum.request({method:'wallet_addEthereumChain',params:[{
      chainId:CHAIN_HEX,chainName:'Robinhood Chain',
      nativeCurrency:{name:'Robinhood',symbol:'RHL',decimals:18},
      rpcUrls:[RPC],blockExplorerUrls:[EXPLORER]
    }]});
  }
}

export async function getBalanceOf(address){
  const data=BALANCE_OF+address.slice(2).toLowerCase().padStart(64,'0');
  const result=await rpc('eth_call',[{to:CONTRACT,data},'latest']);
  if(result.error) throw new Error(result.error.message||'RPC error');
  return BigInt(result.result||'0x0');
}

export async function connectAndVerify(){
  if(!window.ethereum) throw new Error('Install a Web3 wallet first.');
  await addOrSwitchRobinhood();
  const accounts=await window.ethereum.request({method:'eth_requestAccounts'});
  const address=accounts?.[0];
  if(!address) throw new Error('No wallet account returned.');
  const balance=await getBalanceOf(address);
  return {address,holder:balance>0n,balance};
}

export async function verifyConnectedWallet(){
  if(!window.ethereum) return null;
  const accounts=await window.ethereum.request({method:'eth_accounts'});
  const address=accounts?.[0];
  if(!address) return null;
  await addOrSwitchRobinhood();
  const balance=await getBalanceOf(address);
  return {address,holder:balance>0n,balance};
}
