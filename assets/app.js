const CHAIN_ID='0x1237';
const RPC='https://rpc.mainnet.chain.robinhood.com';
const EXPLORER='https://robinhoodchain.blockscout.com';
const CONTRACT='0x6be906e10351B4a970521c386E89D9e4e34c47C9';
const connectBtn=document.getElementById('connect');
const label=document.getElementById('label');
const status=document.getElementById('status');
const error=document.getElementById('error');
let verified=false;
const short=a=>a?`${a.slice(0,6)}…${a.slice(-4)}`:'';
function msg(t,ok=false){status.className='status'+(ok?' connected':'');status.innerHTML=`<i></i><span>${t}</span>`}
function fail(t){error.hidden=false;error.textContent=t}
function clearFail(){error.hidden=true;error.textContent=''}
function getProviders(){
  const list=[];
  if(window.ethereum) list.push(window.ethereum);
  return list;
}
async function provider(){
  if(window.ethereum) return window.ethereum;
  return null;
}
async function switchChain(p){
  const current=await p.request({method:'eth_chainId'});
  if(current.toLowerCase()===CHAIN_ID) return;
  try{await p.request({method:'wallet_switchEthereumChain',params:[{chainId:CHAIN_ID}]})}
  catch(e){
    if(e.code!==4902) throw e;
    await p.request({method:'wallet_addEthereumChain',params:[{chainId:CHAIN_ID,chainName:'Robinhood Chain',nativeCurrency:{name:'Ether',symbol:'ETH',decimals:18},rpcUrls:[RPC],blockExplorerUrls:[EXPLORER]}]});
  }
}
async function ethCall(p,address){
  const data='0x70a08231'+address.slice(2).padStart(64,'0');
  const raw=await p.request({method:'eth_call',params:[{to:CONTRACT,data},'latest']});
  return BigInt(raw||'0x0');
}
async function verify(p,address){
  msg('VERIFYING STONE OWNERSHIP…');
  const balance=await ethCall(p,address);
  if(balance===0n){verified=false;label.textContent='CONNECT & VERIFY';msg('WALLET CONNECTED · NOT A HOLDER');fail('This wallet does not hold a RhoodStone.');return false}
  verified=true;clearFail();label.textContent='ENTER THE STONE';msg(`VERIFIED · ${short(address)} · ${balance} STONE`,true);return true;
}
async function connect(){
  clearFail();
  const p=await provider();
  if(!p){
    msg('OPEN THIS SITE INSIDE YOUR WALLET');
    fail('Chrome does not inject a wallet by itself. Use “OPEN IN WALLET” below to open RhoodStone inside MetaMask, or open it in Rabby/OKX wallet browser.');
    return;
  }
  try{
    msg('CONNECTING…');
    const accounts=await p.request({method:'eth_requestAccounts'});
    const address=accounts?.[0]; if(!address) return;
    await switchChain(p);
    const fresh=(await p.request({method:'eth_accounts'}))?.[0]||address;
    await verify(p,fresh);
  }catch(e){verified=false;label.textContent='CONNECT & VERIFY';msg('WALLET NOT CONNECTED');fail(e?.message||'Wallet connection was rejected or failed.');}
}
connectBtn.addEventListener('click',()=>verified?location.href='/portal/':connect());
document.getElementById('wallet').addEventListener('click',()=>{
  const d=location.host+location.pathname;
  location.href=`https://metamask.app.link/dapp/${d}`;
});
if(window.ethereum){
  window.ethereum.on?.('accountsChanged',async accounts=>{
    verified=false;label.textContent='CONNECT & VERIFY';clearFail();
    if(accounts?.[0]){try{await switchChain(window.ethereum);await verify(window.ethereum,accounts[0])}catch(e){msg('VERIFY AGAIN')}}else msg('WALLET NOT CONNECTED');
  });
  window.ethereum.on?.('chainChanged',()=>{verified=false;label.textContent='CONNECT & VERIFY';clearFail();msg('NETWORK CHANGED · VERIFY AGAIN')});
}
