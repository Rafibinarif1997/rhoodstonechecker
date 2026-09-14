
(() => {
  const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const API=(p,o={})=>fetch(p,o).then(async r=>{const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error||`Request failed (${r.status})`);return d});
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  function toast(msg,ok=true){let t=$('#toast');if(!t){t=document.createElement('div');t.id='toast';document.body.appendChild(t)}t.textContent=msg;t.className='toast '+(ok?'ok':'bad');clearTimeout(window.__toast);window.__toast=setTimeout(()=>t.remove(),3200)}
  function nav(path){history.pushState({},'',path); route(); window.scrollTo({top:0,behavior:'smooth'});}
  const routes={
    '/dashboard.html': ['Dashboard','Your connected-wallet command center.'],
    '/stock-token-terminal.html':['Stock Token Terminal','Explore official Robinhood Chain Stock Token data.'],
    '/defi-opportunities.html':['DeFi Opportunities','Verified on-chain opportunities without fabricated APYs.'],
    '/bridge-intelligence.html':['Bridge Intelligence','Understand routes into and out of Robinhood Chain.'],
    '/contract-intelligence.html':['Contract Intelligence','Inspect an address and its technical surface.'],
    '/discover-projects.html':['Discover Projects','Explore approved ecosystem projects and submit your own.'],
    '/watchlist.html':['Watchlist','Your saved assets, contracts and projects.'],
    '/developer.html':['Developer','Network endpoints, APIs and integration references.'],
    '/about.html':['About','Independent infrastructure and intelligence for Robinhood Chain.']
  };
  function shell(title,sub,body){
    document.title=`${title} — Robinhood Chain Copilot`;
    return `<div class="sitebar"><a class="brand" href="/">RH<span>COPILOT</span></a><button class="menu-btn" id="menuBtn">☰</button><div class="wallet-slot"><button class="wallet-btn" data-wallet>Connect Wallet</button></div></div>
    <div class="drawer" id="drawer"><div class="drawer-head">NAVIGATION <button id="closeMenu">×</button></div>${Object.entries(routes).map(([p,v])=>`<a href="${p}" data-nav>${v[0]}</a>`).join('')}<a href="/" data-nav>Home</a></div>
    <main class="page"><div class="page-head"><div><div class="eyebrow">RH / INTELLIGENCE</div><h1>${title}</h1><p>${sub}</p></div><button class="wallet-btn compact" data-wallet>Connect Wallet</button></div>${body}</main><div id="toast"></div>`;
  }
  function home(){
    document.title='Robinhood Chain Copilot';
    return `<div class="hero"><nav class="home-nav"><a class="brand" href="/">RH<span>COPILOT</span></a><div class="navlinks"><a href="/dashboard.html">Dashboard</a><a href="/stock-token-terminal.html">Terminal</a><a href="/discover-projects.html">Discover</a></div><button class="wallet-btn home-wallet" data-wallet>Connect Wallet</button></nav>
    <section class="hero-copy"><div class="eyebrow">INDEPENDENT / ROBINHOOD CHAIN</div><h1>KNOW YOUR<br><span>ONCHAIN OPTIONS.</span></h1><p>One intelligence layer for your Robinhood Chain assets, Stock Tokens, contracts, bridges and ecosystem projects.</p><div class="hero-actions"><button class="primary" data-wallet>Connect Wallet</button><a class="secondary" href="/dashboard.html">Open Dashboard →</a></div></section>
    <section class="feature-grid">${[['01','PORTFOLIO','See what your wallet holds and where it can go.','/dashboard.html'],['02','STOCK TOKENS','Research official Stock Token data and contracts.','/stock-token-terminal.html'],['03','CONTRACT INTELLIGENCE','Inspect technical signals before interacting.','/contract-intelligence.html'],['04','BRIDGE INTELLIGENCE','Understand supported routes and trade-offs.','/bridge-intelligence.html'],['05','DISCOVER','Find approved projects and submit yours.','/discover-projects.html'],['06','DEVELOPER','Build with Robinhood Chain infrastructure.','/developer.html']].map(x=>`<a class="feature" href="${x[3]}"><b>${x[0]}</b><h3>${x[1]}</h3><p>${x[2]}</p><span>OPEN →</span></a>`).join('')}</section>
    <footer><span>RH COPILOT</span><span>Independent platform · Not affiliated with Robinhood</span></footer></div>`;
  }
  async function dashboard(){
    let wallet=RHWallet.address;
    let health={}; try{health=await API('/api/health')}catch(e){}
    let balance='—'; if(wallet){try{const d=await API('/api/wallet/'+wallet);balance=d.nativeBalance||'0 ETH'}catch(e){balance='Unavailable'}}
    return shell('Dashboard','Your connected wallet, network state and asset overview.',`<div class="stats"><div><small>WALLET</small><strong data-wallet-status>${wallet?RHWallet.short(wallet):'Not connected'}</strong></div><div><small>NATIVE BALANCE</small><strong>${esc(balance)}</strong></div><div><small>NETWORK</small><strong>${health.ok?'ONLINE':'CHECKING'}</strong></div><div><small>CHAIN</small><strong>4663</strong></div></div><div class="panel"><h2>Wallet Command Center</h2><p>Connect your wallet on Home or here. Once connected, the same wallet session is available throughout every section of Copilot.</p><div class="actions"><button class="primary" data-wallet>${wallet?'Disconnect Wallet':'Connect Wallet'}</button>${wallet?`<button class="secondary" id="switchChain">Switch to Robinhood Chain</button>`:''}</div></div>`);
  }
  async function terminal(){
    let d; try{d=await API('/api/stock/assets')}catch(e){return shell('Stock Token Terminal','Live official registry unavailable right now.',`<div class="panel error">${esc(e.message)}</div>`)}
    const list=(d.assets||d||[]).slice(0,100);
    return shell('Stock Token Terminal','Search official Robinhood Chain Stock Token registry and live quotes.',`<div class="toolbar"><input id="tokenSearch" placeholder="Search symbol or name…"><button class="secondary" id="refreshTokens">Refresh</button></div><div class="token-grid" id="tokenGrid">${list.map(a=>`<button class="token-card" data-symbol="${esc(a.symbol||a.ticker||'')}"><strong>${esc(a.symbol||a.ticker||'—')}</strong><span>${esc(a.name||'Stock Token')}</span><small>${esc(a.address||a.contract_address||'Contract unavailable')}</small></button>`).join('')}</div><div class="panel" id="quotePanel"><h2>Select a token</h2><p>Live quote details appear here.</p></div>`);
  }
  async function tokenEvents(){
    $('#tokenSearch')?.addEventListener('input',e=>$$('.token-card').forEach(c=>c.style.display=c.textContent.toLowerCase().includes(e.target.value.toLowerCase())?'':'none'));
    async function quote(sym){const p=$('#quotePanel');p.innerHTML='<h2>Loading quote…</h2>';try{const d=await API('/api/stock/prices/'+encodeURIComponent(sym));p.innerHTML=`<h2>${esc(sym)}</h2><div class="stats mini"><div><small>BID</small><strong>${esc(d.bid??'—')}</strong></div><div><small>ASK</small><strong>${esc(d.ask??'—')}</strong></div><div><small>PRICE</small><strong>${esc(d.price??d.last??'—')}</strong></div></div>`}catch(e){p.innerHTML=`<div class="error">${esc(e.message)}</div>`}}
    $$('.token-card').forEach(c=>c.onclick=()=>quote(c.dataset.symbol));
    $('#refreshTokens')?.addEventListener('click',()=>route());
  }
  function simplePage(title,sub,content){return shell(title,sub,content)}
  async function route(){
    const path=location.pathname;
    let out;
    if(path==='/'||path==='/index.html') out=home();
    else if(path==='/dashboard.html') out=await dashboard();
    else if(path==='/stock-token-terminal.html') out=await terminal();
    else if(path==='/defi-opportunities.html') out=simplePage('DeFi Opportunities','Verified integrations only.',`<div class="panel"><h2>Opportunity Engine</h2><p>Copilot will surface lending, collateral, liquidity and swap opportunities from verified integrations as live adapters are enabled. No fabricated APYs or execution quotes are shown.</p><div class="notice">Research mode active · Execution adapters require verified integrations.</div></div>`);
    else if(path==='/bridge-intelligence.html') out=simplePage('Bridge Intelligence','Supported bridge paths and what to verify before moving assets.',`<div class="cards"><div class="panel"><h3>Arbitrum Canonical Bridge</h3><p>Canonical L2 bridge route. Check current status, fees and withdrawal timing before use.</p><a href="https://bridge.arbitrum.io" target="_blank" rel="noopener">Open bridge →</a></div><div class="panel"><h3>LayerZero / Stargate</h3><p>Interoperability route. Availability and supported assets can change.</p><a href="https://stargate.finance" target="_blank" rel="noopener">Open Stargate →</a></div><div class="panel"><h3>Chainlink CCIP</h3><p>Cross-chain infrastructure route where supported.</p><a href="https://ccip.chain.link" target="_blank" rel="noopener">Open CCIP →</a></div></div>`);
    else if(path==='/contract-intelligence.html') out=simplePage('Contract Intelligence','Scan an EVM address for technical information.',`<div class="toolbar"><input id="addressInput" placeholder="0x…"><button class="primary" id="scanAddress">Scan</button></div><div class="panel" id="scanResult"><p>Enter an address to begin.</p></div>`);
    else if(path==='/discover-projects.html') out=simplePage('Discover Projects','Approved ecosystem projects and project submission.',`<div class="panel"><h2>Project Submission</h2><form id="projectForm"><input name="name" placeholder="Project name" required><input name="url" placeholder="Website URL" required><input name="description" placeholder="Short description" required><button class="primary">Submit for Review</button></form></div><div class="panel"><h2>Directory</h2><div id="projects">Loading approved projects…</div></div>`);
    else if(path==='/watchlist.html') out=simplePage('Watchlist','Saved items for this browser.',`<div class="panel"><div id="watchlist">Loading…</div></div>`);
    else if(path==='/developer.html') out=simplePage('Developer','Core network and integration references.',`<div class="stats"><div><small>CHAIN ID</small><strong>4663</strong></div><div><small>NATIVE GAS</small><strong>ETH</strong></div><div><small>RPC</small><strong>MAINNET</strong></div></div><div class="panel"><h2>Robinhood Chain</h2><p>RPC: <code>https://rpc.mainnet.chain.robinhood.com</code></p><p>Explorer: <a href="https://robinhoodchain.blockscout.com" target="_blank">Blockscout</a></p><p>Stock Token APIs are proxied through Copilot server routes.</p></div>`);
    else if(path==='/about.html') out=simplePage('About','Independent infrastructure and intelligence for Robinhood Chain.',`<div class="panel"><h2>What is Copilot?</h2><p>An independent interface for understanding on-chain assets and opportunities across Robinhood Chain.</p><p class="notice">RH Copilot is not Robinhood, is not endorsed by Robinhood, and does not provide investment advice.</p></div>`);
    else out=home();
    document.getElementById('app').innerHTML=out;
    bindCommon();
    if(path==='/stock-token-terminal.html') tokenEvents();
    if(path==='/contract-intelligence.html') bindScanner();
    if(path==='/discover-projects.html') bindProjects();
    if(path==='/watchlist.html') bindWatchlist();
    if(path==='/dashboard.html') $('#switchChain')?.addEventListener('click',()=>RHWallet.switchNetwork().catch(e=>toast(e.message,false)));
  }
  function bindCommon(){
    $$('[data-nav]').forEach(a=>a.onclick=e=>{e.preventDefault();nav(a.getAttribute('href'))});
    $('#menuBtn')?.addEventListener('click',()=>$('#drawer').classList.add('open'));
    $('#closeMenu')?.addEventListener('click',()=>$('#drawer').classList.remove('open'));
    RHWallet.render();
  }
  function bindScanner(){
    $('#scanAddress')?.addEventListener('click',async()=>{const a=$('#addressInput').value.trim(),r=$('#scanResult');if(!/^0x[a-fA-F0-9]{40}$/.test(a)){r.innerHTML='<div class="error">Enter a valid EVM address.</div>';return}r.innerHTML='<p>Scanning…</p>';try{const d=await API('/api/address/'+a);r.innerHTML=`<h2>${esc(a.slice(0,10)+'…'+a.slice(-8))}</h2><pre>${esc(JSON.stringify(d,null,2))}</pre>`}catch(e){r.innerHTML=`<div class="error">${esc(e.message)}</div>`}});
  }
  async function bindProjects(){
    const list=$('#projects');try{const d=await API('/api/projects');const ps=d.projects||d||[];list.innerHTML=ps.length?ps.map(p=>`<div class="list-row"><strong>${esc(p.name)}</strong><span>${esc(p.description||'')}</span><a href="${esc(p.url)}" target="_blank" rel="noopener">Visit →</a></div>`).join(''):'No approved projects yet.'}catch(e){list.textContent=e.message}
    $('#projectForm')?.addEventListener('submit',async e=>{e.preventDefault();const fd=new FormData(e.target);const payload=Object.fromEntries(fd.entries());try{await API('/api/projects',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});toast('Project submitted for review.');e.target.reset()}catch(err){toast(err.message,false)}});
  }
  function bindWatchlist(){const k='rh_watchlist';const load=()=>{const a=JSON.parse(localStorage.getItem(k)||'[]');$('#watchlist').innerHTML=a.length?a.map((x,i)=>`<div class="list-row"><span>${esc(x)}</span><button data-del="${i}">Remove</button></div>`).join(''):'Your watchlist is empty.'};load();$('#watchlist').onclick=e=>{const b=e.target.closest('[data-del]');if(!b)return;let a=JSON.parse(localStorage.getItem(k)||'[]');a.splice(+b.dataset.del,1);localStorage.setItem(k,JSON.stringify(a));load()}}
  RHWallet.on(()=>{document.querySelectorAll('[data-wallet-status]').forEach(e=>e.textContent=RHWallet.address?RHWallet.short(RHWallet.address):'Not connected')});
  window.addEventListener('popstate',route);
  window.addEventListener('load',route);
})();
