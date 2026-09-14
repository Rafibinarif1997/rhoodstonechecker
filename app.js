const $ = (s,root=document)=>root.querySelector(s);
const $$ = (s,root=document)=>[...root.querySelectorAll(s)];
const CHAIN_ID=4663, CHAIN_HEX='0x1237';
const RPC='https://rpc.mainnet.chain.robinhood.com', EXPLORER='https://robinhoodchain.blockscout.com';
let wallet=null, assets=[], selectedAsset=null, selectedQuote=null, healthData=null;

const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const short=a=>a?`${a.slice(0,6)}…${a.slice(-4)}`:'—';
const money=v=>v==null||v===''||Number.isNaN(Number(v))?'—':`$${Number(v).toLocaleString(undefined,{maximumFractionDigits:6})}`;
const num=v=>Number(v||0).toLocaleString(undefined,{maximumFractionDigits:6});
function toast(msg,good=true){const t=$('#toast');t.textContent=msg;t.className=`toast show ${good?'':'bad'}`;clearTimeout(window.__toast);window.__toast=setTimeout(()=>t.classList.remove('show'),3500)}
async function api(url,opt={}){const r=await fetch(url,opt);let d={};try{d=await r.json()}catch{}if(!r.ok)throw Error(d.error||`Request failed (${r.status})`);return d}
function openExternal(url){if(url)window.open(url,'_blank','noopener,noreferrer')}
function scrollToId(id){document.getElementById(id)?.scrollIntoView({behavior:'smooth',block:'start'});history.replaceState(null,'','#'+id)}

// navigation
$('#menu').onclick=()=>$('#nav').classList.toggle('open');
$$('#nav a').forEach(a=>a.onclick=()=>$('#nav').classList.remove('open'));
$('#enterTerminal').onclick=()=>scrollToId('dashboard');
$('#heroScan').onclick=()=>{scrollToId('scanner');setTimeout(()=>$('#scanInput').focus(),250)};
$('#addNetwork').onclick=addNetwork;
$('#copyRpc').onclick=()=>copy(RPC);
$('#openExplorer').onclick=()=>openExternal(EXPLORER);
$('#docsBtn').onclick=()=>scrollToId('resources');

async function copy(text){try{await navigator.clipboard.writeText(text);toast('Copied to clipboard.')}catch{toast('Clipboard access unavailable.',false)}}

// network health
async function refreshHealth(){
 try{healthData=await api('/api/health');$('#healthDot').textContent='● ONLINE';$('#healthDot').className='good';$('#block').textContent=Number(healthData.block).toLocaleString();$('#gas').textContent=healthData.gasPrice?`${(Number(healthData.gasPrice)/1e9).toFixed(3)} gwei`:'—';$('#lastBlock').textContent=Number(healthData.block).toLocaleString();$('#lastUpdate').textContent=new Date(healthData.time).toLocaleTimeString();}
 catch(e){$('#healthDot').textContent='● OFFLINE';$('#healthDot').className='bad-text';toast('RPC health check failed.',false)}
}
$('#refreshHealth').onclick=refreshHealth; refreshHealth(); setInterval(refreshHealth,15000);

// wallet
async function addNetwork(){if(!window.ethereum)return toast('Install an EVM wallet first.',false);try{await window.ethereum.request({method:'wallet_addEthereumChain',params:[{chainId:CHAIN_HEX,chainName:'Robinhood Chain',nativeCurrency:{name:'Ether',symbol:'ETH',decimals:18},rpcUrls:[RPC],blockExplorerUrls:[EXPLORER+'/']}]});toast('Robinhood Chain added.')}catch(e){toast(e.message||'Could not add network.',false)}}
async function ensureNetwork(){if(!window.ethereum)throw Error('No EVM wallet detected.');const id=await window.ethereum.request({method:'eth_chainId'});if(id.toLowerCase()!==CHAIN_HEX){try{await window.ethereum.request({method:'wallet_switchEthereumChain',params:[{chainId:CHAIN_HEX}]})}catch(e){if(e.code===4902)await addNetwork();else throw e}}}
async function connectWallet(){if(!window.ethereum)return toast('No EVM wallet detected. Install MetaMask or another EVM wallet.',false);try{await ensureNetwork();const a=await window.ethereum.request({method:'eth_requestAccounts'});wallet=a[0];renderWalletIdentity();await refreshWallet();toast('Wallet connected.')}catch(e){toast(e.message||'Wallet connection failed.',false)}}
function renderWalletIdentity(){if(wallet){$('#connect').textContent=short(wallet);$('#walletAddr').textContent=wallet;$('#walletState').textContent='CONNECTED';$('#walletState').className='good'}else{$('#connect').textContent='Connect Wallet';$('#walletAddr').textContent='WALLET NOT CONNECTED';$('#walletState').textContent='READ ONLY';$('#walletState').className='muted'}}
$('#connect').onclick=connectWallet;$('#refreshWallet').onclick=()=>wallet?refreshWallet():connectWallet();
if(window.ethereum){window.ethereum.on?.('accountsChanged',a=>{wallet=a[0]||null;renderWalletIdentity();if(wallet)refreshWallet();else clearWallet()});window.ethereum.on?.('chainChanged',()=>wallet&&refreshWallet())}
function clearWallet(){$('#ethBalance').textContent='—';$('#portfolioValue').textContent='—';$('#tokenCount').textContent='0';$('#assetMini').innerHTML='<div class="empty">Connect a wallet to inspect its token balances.</div>'}
async function refreshWallet(){if(!wallet)return;$('#refreshWallet').disabled=true;$('#assetMini').innerHTML='<div class="loading">READING WALLET STATE…</div>';try{const d=await api('/api/wallet/'+wallet);$('#ethBalance').textContent=`${num(d.eth)} ETH`;$('#portfolioValue').textContent=`${num(d.eth)} ETH`;$('#tokenCount').textContent=d.tokens.length;$('#scannedCount').textContent=d.tokenScanCount;renderTokenBalances(d.tokens);await updatePortfolioUsd(d.tokens)}catch(e){$('#assetMini').innerHTML=`<div class="empty bad-text">${esc(e.message)}</div>`;toast(e.message,false)}finally{$('#refreshWallet').disabled=false}}
function renderTokenBalances(tokens){if(!tokens.length){$('#assetMini').innerHTML='<div class="empty">No non-zero known token balances found.</div>';return}$('#assetMini').innerHTML=`<div class="balance-table">${tokens.map(t=>`<button class="balance-row" data-token="${esc(t.address)}"><span><b>${esc(t.symbol)}</b><small>${esc(t.name||'')}</small></span><strong>${num(t.balance)}</strong></button>`).join('')}</div>`;$$('.balance-row').forEach(b=>b.onclick=()=>scanAddress(b.dataset.token))}
async function updatePortfolioUsd(tokens){let total=0;for(const t of tokens.filter(x=>x.kind==='STOCK').slice(0,20)){try{const d=await api('/api/stock/prices/'+encodeURIComponent(t.symbol));const q=(d.quotes||[])[0]||d;const px=Number(q.ask||q.bid||0);total+=Number(t.balance)*px*Number(t.multiplier||1)}catch{}}if(total>0)$('#portfolioUsd').textContent=money(total);else $('#portfolioUsd').textContent='—'}

// Stock terminal
async function loadAssets(){try{const d=await api('/api/stock/assets');assets=(d.assets||[]).filter(a=>(a.deployments||[]).some(x=>Number(x.chainId)===CHAIN_ID));$('#stockCount').textContent=assets.length;renderStockList(filterAssets());renderTicker();if(assets[0])showStock(assets[0]);}catch(e){$('#stockList').innerHTML=`<div class="empty bad-text">Stock Token registry unavailable.<br>${esc(e.message)}</div>`}}
function filterAssets(){const q=$('#stockSearch').value.trim().toLowerCase();return assets.filter(a=>!q||String(a.tokenSymbol||'').toLowerCase().includes(q)||String(a.tokenName||'').toLowerCase().includes(q)).slice(0,160)}
function renderTicker(){const list=assets.slice(0,50);$('#ticker').innerHTML=list.concat(list).map(a=>`<span>${esc(a.tokenSymbol||'TOKEN')} <i>◆</i> ${esc(a.tokenName||'')}</span>`).join('')||'NO STOCK TOKENS RETURNED'}
function renderStockList(list){if(!list.length){$('#stockList').innerHTML='<div class="empty">NO MATCHING STOCK TOKENS.</div>';return}$('#stockList').innerHTML=list.map(a=>`<button class="stock-row ${selectedAsset?.tokenSymbol===a.tokenSymbol?'active':''}" data-symbol="${esc(a.tokenSymbol)}"><span class="coin">${esc((a.tokenSymbol||'??').slice(0,2))}</span><span><b>${esc(a.tokenSymbol)}</b><small>${esc(a.tokenName||'')}</small></span><strong>${a.status==='ASSET_STATUS_ACTIVE'?'ACTIVE':'—'}</strong></button>`).join('');$$('.stock-row').forEach(b=>b.onclick=()=>showStock(assets.find(a=>a.tokenSymbol===b.dataset.symbol)))}
async function showStock(a){if(!a)return;selectedAsset=a;renderStockList(filterAssets());$('#stockDetail').innerHTML='<div class="loading">FETCHING LIVE QUOTE…</div>';try{const d=await api('/api/stock/prices/'+encodeURIComponent(a.tokenSymbol));const q=(d.quotes||[])[0]||d;selectedQuote=q;const dep=(a.deployments||[]).find(x=>Number(x.chainId)===CHAIN_ID);$('#stockDetail').innerHTML=`<div class="detail-top"><div><div class="eyebrow">STOCK TOKEN // LIVE API</div><h3>${esc(a.tokenSymbol)} <small>${esc(a.tokenName||'')}</small></h3></div><span class="tag ${q.isTradingHalt?'halt':''}">${q.isTradingHalt?'TRADING HALT':'QUOTE LIVE'}</span></div><div class="quote">${money(q.ask||q.bid)}</div><div class="quote-pair"><div><span>BID</span><b>${money(q.bid)}</b></div><div><span>ASK</span><b>${money(q.ask)}</b></div><div><span>DAILY VOLUME</span><b>${q.dailyTradingVolume?Number(q.dailyTradingVolume).toLocaleString():'—'}</b></div></div><div class="detail-grid"><div><span>MULTIPLIER</span><b>${esc(a.currentMultiplier||'—')}</b></div><div><span>STATUS</span><b>${esc(a.status||'—')}</b></div><div><span>CONTRACT</span><b>${dep?.contractAddress?short(dep.contractAddress):'—'}</b></div><div><span>GENERATED</span><b>${q.generatedAt?new Date(q.generatedAt).toLocaleTimeString():'—'}</b></div></div><div class="action-row">${dep?.contractAddress?`<button class="btn" id="stockScan">Inspect Contract</button><button class="btn" id="stockCopy">Copy Contract</button><a class="btn" target="_blank" rel="noopener" href="${EXPLORER}/address/${encodeURIComponent(dep.contractAddress)}">Blockscout ↗</a>`:''}</div>`;$('#stockScan')?.addEventListener('click',()=>scanAddress(dep.contractAddress));$('#stockCopy')?.addEventListener('click',()=>copy(dep.contractAddress))}catch(e){$('#stockDetail').innerHTML=`<div class="empty bad-text">Quote unavailable.<br>${esc(e.message)}</div>`}}
$('#stockSearch').oninput=()=>renderStockList(filterAssets());$('#clearStock').onclick=()=>{$('#stockSearch').value='';renderStockList(filterAssets())};$('#refreshStocks').onclick=loadAssets;loadAssets();

// scanner + watchlist
async function scanAddress(address){scrollToId('scanner');$('#scanInput').value=address;setTimeout(scan,100)}
async function scan(){const address=$('#scanInput').value.trim();if(!address)return toast('Enter an EVM address.',false);$('#scanResult').innerHTML='<div class="loading">SCANNING ROBINHOOD CHAIN…</div>';try{const d=await api('/api/address/'+encodeURIComponent(address));$('#scanResult').innerHTML=`<div class="eyebrow">READ-ONLY TECHNICAL INSPECTION</div><div class="risk ${d.type==='CONTRACT'?'warn':''}">${d.type==='CONTRACT'?'SMART CONTRACT':'EOA / WALLET'}</div><div class="scan-grid">${[['TYPE',d.type],['ETH BALANCE',`${num(d.ethBalance)} ETH`],['NONCE',d.nonce],['BYTECODE',`${d.bytecodeBytes} bytes`],['ADDRESS',short(d.address)],['CHAIN',CHAIN_ID]].map(x=>`<div><span>${x[0]}</span><b>${esc(x[1])}</b></div>`).join('')}</div><div class="action-row"><a class="btn" target="_blank" rel="noopener" href="${d.explorer}">Open Blockscout ↗</a><button class="btn" id="addWatch">＋ Add Watchlist</button>${d.type==='CONTRACT'?'<button class="btn" id="tokenInspect">ERC-20 Read</button>':''}<button class="btn" id="copyScan">Copy Address</button></div><div id="tokenReadout"></div>`;$('#addWatch').onclick=()=>addWatch(address);$('#copyScan').onclick=()=>copy(address);$('#tokenInspect')?.addEventListener('click',()=>inspectToken(address))}catch(e){$('#scanResult').innerHTML=`<div class="empty bad-text">SCAN FAILED<br>${esc(e.message)}</div>`}}
$('#scan').onclick=scan;$('#scanInput').onkeydown=e=>e.key==='Enter'&&scan();$('#paste').onclick=async()=>{try{$('#scanInput').value=await navigator.clipboard.readText();toast('Address pasted.')}catch{toast('Clipboard permission unavailable.',false)}};
async function inspectToken(address){$('#tokenReadout').innerHTML='<div class="loading">READING ERC-20 INTERFACE…</div>';try{const d=await api('/api/token/'+address);$('#tokenReadout').innerHTML=`<div class="token-readout"><div><span>NAME</span><b>${esc(d.name||'—')}</b></div><div><span>SYMBOL</span><b>${esc(d.symbol||'—')}</b></div><div><span>DECIMALS</span><b>${esc(d.decimals??'—')}</b></div><div><span>TOTAL SUPPLY</span><b>${esc(d.totalSupply||'—')}</b></div></div>`}catch(e){$('#tokenReadout').innerHTML=`<div class="empty bad-text">${esc(e.message)}</div>`}}
async function addWatch(address){try{await api('/api/watchlist',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({address,label:'Scanner watch'})});toast('Address added to watchlist.');loadWatchlist()}catch(e){toast(e.message,false)}}
async function loadWatchlist(){try{const rows=await api('/api/watchlist');$('#watchlist').innerHTML=rows.length?rows.map(r=>`<div class="watch-row"><a href="#scanner" data-watch="${r.address}">${short(r.address)}</a><span>${esc(r.label||'')}</span><button class="icon-btn remove-watch" data-address="${r.address}">×</button></div>`).join(''):'<div class="empty">Watchlist is empty.</div>';$$('[data-watch]').forEach(x=>x.onclick=()=>scanAddress(x.dataset.watch));$$('.remove-watch').forEach(x=>x.onclick=async()=>{await api('/api/watchlist/'+x.dataset.address,{method:'DELETE'});loadWatchlist()})}catch(e){$('#watchlist').innerHTML=`<div class="empty bad-text">${esc(e.message)}</div>`}}
$('#refreshWatchlist').onclick=loadWatchlist;loadWatchlist();

// bridge
async function loadBridge(){try{const d=await api('/api/bridge-info');$('#bridgeGrid').innerHTML=d.routes.map(r=>`<article class="card feature"><span class="tag">${esc(r.kind)}</span><h3>${esc(r.name)}</h3><div class="speed">${esc(r.bestFor)}</div><p>${esc(r.details)}</p><button class="btn small" data-doc="${esc(r.docs)}">Read official docs ↗</button></article>`).join('')+`<div class="notice full">${esc(d.note)}</div>`;$$('[data-doc]').forEach(b=>b.onclick=()=>openExternal(b.dataset.doc))}catch(e){$('#bridgeGrid').innerHTML=`<div class="empty bad-text">${esc(e.message)}</div>`}}
$('#refreshBridge').onclick=loadBridge;loadBridge();

// projects
async function loadProjects(){try{const rows=await api('/api/projects');$('#projects').innerHTML=rows.length?rows.map((p,i)=>`<article class="card project"><div class="project-no">${String(i+1).padStart(2,'0')}</div><span class="tag">${esc(p.category)}</span><h3>${esc(p.name)}</h3><p>${esc(p.description)}</p>${p.contract?`<button class="link-btn" data-contract="${esc(p.contract)}">${short(p.contract)} ↗</button>`:''}${p.website?`<button class="btn small" data-site="${esc(p.website)}">Visit project ↗</button>`:''}</article>`).join(''):'<div class="empty">NO APPROVED PROJECTS YET.</div>';$$('[data-contract]').forEach(b=>b.onclick=()=>scanAddress(b.dataset.contract));$$('[data-site]').forEach(b=>b.onclick=()=>openExternal(b.dataset.site))}catch(e){$('#projects').innerHTML=`<div class="empty bad-text">${esc(e.message)}</div>`}}
$('#refreshProjects').onclick=loadProjects;loadProjects();

// project modal
const modal=$('#modal');function openModal(){modal.classList.add('show');modal.setAttribute('aria-hidden','false');$('#projectName').focus()}function closeModal(){modal.classList.remove('show');modal.setAttribute('aria-hidden','true')}
$('#submitBtn').onclick=openModal;$('#close').onclick=closeModal;modal.onclick=e=>{if(e.target===modal)closeModal()};document.addEventListener('keydown',e=>e.key==='Escape'&&closeModal());
$('#projectForm').onsubmit=async e=>{e.preventDefault();const btn=e.submitter;btn.disabled=true;try{const body=Object.fromEntries(new FormData(e.target));await api('/api/projects',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});e.target.reset();closeModal();toast('Submitted. Your project is pending admin review.')}catch(err){toast(err.message,false)}finally{btn.disabled=false}};

// admin panel in same page
$('#adminToggle').onclick=()=>{const p=$('#adminPanel');p.classList.toggle('show');if(p.classList.contains('show'))loadAdmin()};
async function loadAdmin(){const key=$('#adminKey').value.trim();if(!key){$('#adminRows').innerHTML='<div class="empty">Enter ADMIN_KEY to load pending submissions.</div>';return}try{const rows=await api('/api/projects?status=all',{headers:{'x-admin-key':key}});const pending=rows.filter(r=>r.status==='pending');$('#adminRows').innerHTML=pending.length?pending.map(r=>`<div class="admin-row"><div><b>${esc(r.name)}</b><small>${esc(r.category)} · ${esc(r.description)}</small></div><div class="action-row"><button class="btn approve" data-approve="${r.id}">Approve</button><button class="btn reject" data-reject="${r.id}">Reject</button></div></div>`).join(''):'<div class="empty">No pending submissions.</div>';$$('[data-approve]').forEach(b=>b.onclick=()=>adminAction(b.dataset.approve,'approve'));$$('[data-reject]').forEach(b=>b.onclick=()=>adminAction(b.dataset.reject,'reject'))}catch(e){$('#adminRows').innerHTML=`<div class="empty bad-text">${esc(e.message)}</div>`}}
async function adminAction(id,action){try{await api(`/api/projects/${id}/${action}`,{method:'POST',headers:{'x-admin-key':$('#adminKey').value.trim()}});toast(`Project ${action}d.`);loadAdmin();loadProjects()}catch(e){toast(e.message,false)}}
$('#adminLoad').onclick=loadAdmin;

// resources
async function loadResources(){try{const d=await api('/api/docs');$('#resourceLinks').innerHTML=d.links.map(x=>`<button class="resource-link" data-resource="${esc(x.url)}"><span>${esc(x.label)}</span><b>↗</b></button>`).join('')}catch(e){$('#resourceLinks').innerHTML=`<div class="empty">${esc(e.message)}</div>`}}
loadResources();

// boot
$('#boot').innerHTML=['BOOT // Robinhood Chain Copilot','RPC // public mainnet endpoint','CHAIN // 4663 verified','DATA // Stock Token API','WALLET // read-only until connected','MODE // non-custodial intelligence','READY // terminal online'].map(x=>`<p>> ${x}</p>`).join('');
renderWalletIdentity();
