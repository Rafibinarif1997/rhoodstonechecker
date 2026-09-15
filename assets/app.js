const CHAIN_ID='0x1237';
const RPC='https://rpc.mainnet.chain.robinhood.com';
const EXPLORER='https://robinhoodchain.blockscout.com';
const CONTRACT='0x6be906e10351B4a970521c386E89D9e4e34c47C9';
const ABI=['function balanceOf(address owner) view returns (uint256)'];
const $=id=>document.getElementById(id);
const status=$('status'), error=$('error'), connectBtn=$('connectBtn'), label=$('connectLabel');
function short(a){return a?a.slice(0,6)+'…'+a.slice(-4):''}
function setStatus(text,ok=false){status.className='status'+(ok?' connected':'');status.innerHTML=`<i></i><span>${text}</span>`}
function showError(t){error.hidden=!t;error.textContent=t||''}
function provider(){return window.ethereum||null}
async function addOrSwitch(){
 const p=provider(); if(!p) return false;
 try{await p.request({method:'wallet_switchEthereumChain',params:[{chainId:CHAIN_ID}]});return true}
 catch(e){
  if(e.code!==4902) throw e;
  await p.request({method:'wallet_addEthereumChain',params:[{chainId:CHAIN_ID,chainName:'Robinhood Chain',nativeCurrency:{name:'Ether',symbol:'ETH',decimals:18},rpcUrls:[RPC],blockExplorerUrls:[EXPLORER]}]});return true;
 }
}
async function verify(address){
 const p=provider();
 const data='0x70a08231'+address.slice(2).padStart(64,'0');
 const raw=await p.request({method:'eth_call',params:[{to:CONTRACT,data},'latest']});
 const balance=BigInt(raw);
 if(balance===0n){setStatus('WALLET CONNECTED · NOT A HOLDER');showError('This wallet does not currently hold a RhoodStone.');return false}
 setStatus(`VERIFIED HOLDER · ${short(address)} · ${balance.toString()} STONE`,true);
 label.textContent='ENTER THE STONE';
 connectBtn.dataset.verified='1';
 return true;
}
async function connect(){
 showError('');const p=provider();
 if(!p){showError('No injected wallet was found. On Android, open this site inside MetaMask, Rabby or another EVM wallet browser, then connect again.');setStatus('WALLET NOT CONNECTED');return}
 try{
  const accounts=await p.request({method:'eth_requestAccounts'}); if(!accounts?.[0]) return;
  await addOrSwitch();
  const fresh=await p.request({method:'eth_accounts'}); const address=fresh[0]||accounts[0];
  await verify(address);
 }catch(e){showError(e?.message||'Wallet connection failed.');setStatus('WALLET NOT CONNECTED')}
}
connectBtn.addEventListener('click',()=>{
 if(connectBtn.dataset.verified==='1'){location.href='/portal/';return}
 connect();
});
$('walletBtn').addEventListener('click',()=>{
 const url=location.href;
 const deep=`https://metamask.app.link/dapp/${url.replace(/^https?:\\/\\//,'')}`;
 location.href=deep;
});
if(window.ethereum){
 window.ethereum.on?.('accountsChanged',async a=>{connectBtn.dataset.verified='';label.textContent='CONNECT & VERIFY';if(a?.[0]){try{await verify(a[0])}catch{}}else setStatus('WALLET NOT CONNECTED')});
 window.ethereum.on?.('chainChanged',()=>{connectBtn.dataset.verified='';label.textContent='CONNECT & VERIFY';setStatus('NETWORK CHANGED · VERIFY AGAIN')});
}
