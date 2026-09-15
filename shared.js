const Rhood=(()=>{
 const CHAIN_ID='0x1237';
 const CHAIN={chainId:CHAIN_ID,chainName:'Robinhood Chain',nativeCurrency:{name:'Ether',symbol:'ETH',decimals:18},rpcUrls:['https://rpc.mainnet.chain.robinhood.com'],blockExplorerUrls:['https://robinhoodchain.blockscout.com']};
 const CONTRACT='0x6be906e10351B4a970521c386E89D9e4e34c47C9';
 const ABI=['function balanceOf(address owner) view returns (uint256)'];
 const pages=[['Dashboard','portal'],['Benefits','benefits'],['WL & GTD','opportunities'],['Partners','partners'],['Points','points'],['Rewards','rewards'],['Passport','passport'],['Tiers','tiers'],['Activity','activity']];
 const isRoot=location.pathname.replace(/\/$/,'').split('/').filter(Boolean).length===0;
 const link=slug=>isRoot?`./${slug}/`:`../${slug}/`;
 const rootLink=isRoot?'./':'../';
 function short(a){return a?a.slice(0,6)+'…'+a.slice(-4):'—'}
 function gateSession(){return localStorage.getItem('rhood_verified')==='1' && !!localStorage.getItem('rhood_address')}
 async function ensureChain(){
  if(!window.ethereum) throw new Error('No wallet provider detected. Open this page inside MetaMask, Rabby, OKX or another EVM wallet browser.');
  try{await window.ethereum.request({method:'wallet_switchEthereumChain',params:[{chainId:CHAIN_ID}]})}
  catch(e){if(e.code===4902 || /unrecognized|unknown chain/i.test(e.message||'')) await window.ethereum.request({method:'wallet_addEthereumChain',params:[CHAIN]}); else throw e;}
 }
 async function connect(){
  if(!window.ethereum) throw new Error('No injected wallet detected. On Android Chrome, open this site from your wallet app browser.');
  const accounts=await window.ethereum.request({method:'eth_requestAccounts'});
  if(!accounts?.length) throw new Error('Wallet connection was cancelled.');
  await ensureChain();
  const provider=new ethers.BrowserProvider(window.ethereum);
  const network=await provider.getNetwork();
  if(Number(network.chainId)!==4663) throw new Error('Please switch to Robinhood Chain.');
  const signer=await provider.getSigner();
  const address=await signer.getAddress();
  const c=new ethers.Contract(CONTRACT,ABI,provider);
  const b=await c.balanceOf(address);
  const balance=Number(b);
  if(balance<=0){localStorage.removeItem('rhood_verified');throw new Error('This wallet does not hold a RhoodStone NFT.');}
  localStorage.setItem('rhood_verified','1'); localStorage.setItem('rhood_address',address); localStorage.setItem('rhood_balance',String(balance));
  return {address,balance};
 }
 function openWallet(){const target=location.host+location.pathname; location.href='https://metamask.app.link/dapp/'+target;}
 function bindEvents(){
  if(window.ethereum){window.ethereum.on?.('accountsChanged',()=>{localStorage.clear(); location.href=rootLink;});window.ethereum.on?.('chainChanged',()=>location.reload());}
 }
 function initGate(){
  const btn=document.getElementById('connectBtn'), st=document.getElementById('walletStatus'), help=document.getElementById('walletHelp'), mobile=document.getElementById('mobileWalletBtn');
  mobile?.addEventListener('click',()=>openWallet());
  btn?.addEventListener('click',async()=>{btn.disabled=true;st.textContent='Opening wallet…';help.textContent='';try{const r=await connect();st.textContent=`Verified • ${short(r.address)} • ${r.balance} Stone`;location.href='./portal/';}catch(e){st.textContent='Verification failed';help.textContent=e.message||String(e);}finally{btn.disabled=false;}});
  if(!window.ethereum && help) help.textContent='Using Android Chrome? Tap “Open in Wallet” below to open the portal in MetaMask.';
  bindEvents();
 }
 function requireHolder(){if(!gateSession()){location.replace(rootLink);return false;} return true;}
 function nav(){return `<aside class="sidebar" id="sidebar"><div class="brand"><div class="mini">RS</div><div><strong>RHOODSTONE</strong><small>HOLDER SPACE</small></div></div><nav class="nav"><div class="nav-label">STONE</div>${pages.slice(0,4).map(([n,s])=>`<a href="${link(s)}" data-slug="${s}">${n}</a>`).join('')}<div class="nav-label">HOLDER</div>${pages.slice(4).map(([n,s])=>`<a href="${link(s)}" data-slug="${s}">${n}</a>`).join('')}</nav><div class="wallet-card"><div class="label">VERIFIED WALLET</div><div class="addr" id="sideAddr">—</div><div class="balance" id="sideBalance">— Stone</div><button class="btn side-disconnect" id="disconnectBtn">EXIT</button></div></aside>`}
 function layout(title,desc,body,slug){if(!requireHolder())return ''; const addr=localStorage.getItem('rhood_address')||'';const bal=localStorage.getItem('rhood_balance')||'0';return `<div class="app">${nav()}<main class="main"><div class="top"><div><div class="crumb">RHOODSTONE / HOLDER / ${slug.toUpperCase()}</div><h1 class="page-title">${title}</h1><div class="page-desc">${desc}</div></div><button class="btn mobile-menu" id="menuBtn">MENU</button></div>${body}</main></div><script>document.getElementById('sideAddr').textContent=${JSON.stringify(short(addr))};document.getElementById('sideBalance').textContent=${JSON.stringify(bal+' Stone')};document.querySelectorAll('.nav a').forEach(a=>{if(a.dataset.slug===${JSON.stringify(slug)})a.classList.add('active')});document.getElementById('menuBtn')?.addEventListener('click',()=>document.getElementById('sidebar').classList.toggle('open'));document.getElementById('disconnectBtn')?.addEventListener('click',()=>{localStorage.clear();location.href=${JSON.stringify(rootLink)}});</script>`}
 function renderPage(title,desc,body,slug){document.body.innerHTML=layout(title,desc,body,slug);}
 return {initGate,connect,openWallet,renderPage,requireHolder,short,CONTRACT};
})();
