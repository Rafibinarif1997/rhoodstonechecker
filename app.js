const CONFIG = {
  chainId: 4663,
  chainName: 'Robinhood Chain',
  rpcUrl: 'https://rpc.mainnet.chain.robinhood.com',
  explorer: 'https://robinhoodchain.blockscout.com',
  contract: '0x6be906e10351B4a970521c386E89D9e4e34c47C9'
};
const ABI = ['function balanceOf(address owner) view returns (uint256)'];
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const short = a => a ? `${a.slice(0,6)}…${a.slice(-4)}` : '0x…';
const tier = n => n >= 8 ? 'DIAMOND' : n >= 4 ? 'GOLD' : n >= 2 ? 'SILVER' : 'STONE';
function setStatus(msg, bad=false){ const e=$('#status'); if(e){e.textContent=msg; e.style.color=bad?'#ff7187':'';} }
function saveSession(address,balance){ localStorage.setItem('rhoodstone_wallet', JSON.stringify({address,balance,tier:tier(balance)})); }
function loadSession(){ try{return JSON.parse(localStorage.getItem('rhoodstone_wallet')||'null')}catch{return null} }
function clearSession(){localStorage.removeItem('rhoodstone_wallet');}
async function ensureChain(provider){
  const hex='0x'+CONFIG.chainId.toString(16);
  const current=await provider.request({method:'eth_chainId'});
  if(current.toLowerCase()===hex.toLowerCase()) return;
  try { await provider.request({method:'wallet_switchEthereumChain',params:[{chainId:hex}]}); }
  catch(e){ if(e.code!==4902) throw e; await provider.request({method:'wallet_addEthereumChain',params:[{chainId:hex,chainName:CONFIG.chainName,nativeCurrency:{name:'Ether',symbol:'ETH',decimals:18},rpcUrls:[CONFIG.rpcUrl],blockExplorerUrls:[CONFIG.explorer]}]}); }
}
async function connectWallet(){
  setStatus('Connecting wallet…');
  const eth=window.ethereum;
  if(!eth){
    setStatus('No wallet extension detected. On mobile, open this site inside your wallet app browser.',true);
    return;
  }
  try{
    // Account request must happen directly from the button click.
    const accounts=await eth.request({method:'eth_requestAccounts'});
    if(!accounts?.length) throw new Error('No wallet account selected.');
    await ensureChain(eth);
    const provider=new ethers.BrowserProvider(eth);
    const signer=await provider.getSigner();
    const address=await signer.getAddress();
    const contract=new ethers.Contract(CONFIG.contract,ABI,provider);
    const balance=Number(await contract.balanceOf(address));
    if(balance<=0){ clearSession(); setStatus('This wallet does not hold a RhoodStone NFT.',true); return; }
    saveSession(address,balance);
    updateUI({address,balance,tier:tier(balance)});
    if(location.pathname==='/') location.href='/portal/';
    else location.reload();
  }catch(e){console.error(e); setStatus(e?.shortMessage||e?.message||'Wallet connection failed.',true);}
}
async function disconnect(){clearSession(); location.href='/';}
function updateUI(s){
  $$('.wallet-address').forEach(e=>e.textContent=short(s.address));
  $$('.wallet-balance').forEach(e=>e.textContent=s.balance);
  $$('.wallet-tier').forEach(e=>e.textContent=s.tier);
  const connect=$('#connect'); if(connect){connect.textContent='Holder Portal'; connect.onclick=()=>location.href='/portal/';}
  $$('.holder-only').forEach(e=>e.classList.remove('hidden'));
  $$('.locked-only').forEach(e=>e.classList.add('hidden'));
}
function initSession(){
  const s=loadSession();
  if(s && s.address && Number(s.balance)>0) updateUI(s);
  if(window.ethereum){
    window.ethereum.on('accountsChanged', async accounts=>{ if(!accounts.length){clearSession();location.href='/';return;} try{await connectWallet();}catch{location.reload();} });
    window.ethereum.on('chainChanged',()=>location.reload());
  }
}
function wire(){
  $$('#connect, #heroConnect, #lockedConnect, [data-connect]').forEach(b=>b.addEventListener('click',connectWallet));
  $$('#disconnect, [data-disconnect]').forEach(b=>b.addEventListener('click',disconnect));
  $$('.nav-link').forEach(a=>a.addEventListener('click',()=>{}));
}
document.addEventListener('DOMContentLoaded',()=>{wire();initSession();});
