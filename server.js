import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import Database from 'better-sqlite3';
import { JsonRpcProvider, Contract, isAddress, formatEther, formatUnits } from 'ethers';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = Number(process.env.PORT || 3000);
const CHAIN_ID = 4663;
const RPC = process.env.RH_RPC_URL || 'https://rpc.mainnet.chain.robinhood.com';
const EXPLORER = 'https://robinhoodchain.blockscout.com';
const provider = new JsonRpcProvider(RPC, { chainId: CHAIN_ID, name: 'Robinhood Chain' });

app.disable('x-powered-by');
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: '250kb' }));
app.use(rateLimit({ windowMs: 60_000, limit: 180, standardHeaders: true, legacyHeaders: false }));
app.use(express.static(__dirname, { index: false }));

const db = new Database(path.join(__dirname, 'copilot.db'));
db.pragma('journal_mode = WAL');
db.exec(`
CREATE TABLE IF NOT EXISTS projects(
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 name TEXT NOT NULL, category TEXT NOT NULL, contract TEXT, website TEXT,
 description TEXT NOT NULL, logo TEXT, status TEXT NOT NULL DEFAULT 'pending',
 created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS watchlist(
 address TEXT PRIMARY KEY, label TEXT, created_at TEXT NOT NULL
);`);

const ERC20_ABI = [
 'function balanceOf(address) view returns (uint256)',
 'function decimals() view returns (uint8)',
 'function symbol() view returns (string)',
 'function name() view returns (string)',
 'function totalSupply() view returns (uint256)'
];

const STATIC_ASSETS = [
 { symbol:'WETH', name:'Wrapped Ether', address:'0x0Bd7D308f8E1639FAb988df18A8011f41EAcAD73', decimals:18, kind:'CORE' },
 { symbol:'USDG', name:'USDG', address:'0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168', decimals:18, kind:'CORE' }
];
let assetCache = { at: 0, data: [] };
let bridgeCache = { at: 0, data: null };

async function rhFetch(url) {
  const r = await fetch(url, { headers: { accept: 'application/json', 'user-agent': 'RH-Copilot/1.0' } });
  if (!r.ok) throw new Error(`Upstream ${r.status}`);
  return r.json();
}
async function getAssets() {
  if (Date.now() - assetCache.at < 15_000 && assetCache.data.length) return assetCache.data;
  const raw = await rhFetch('https://api.robinhood.com/rhj/assets');
  const list = Array.isArray(raw) ? raw : (raw.assets || raw.results || []);
  assetCache = { at: Date.now(), data: list };
  return list;
}
function chainDeployment(asset) {
  return (asset.deployments || []).find(d => Number(d.chainId) === CHAIN_ID);
}
function admin(req, res, next) {
  const key = req.headers['x-admin-key'];
  if (!process.env.ADMIN_KEY || key !== process.env.ADMIN_KEY) return res.status(401).json({ error:'Unauthorized. Configure ADMIN_KEY on the server.' });
  next();
}
function safeUrl(value='') {
  try { const u = new URL(value); return ['http:','https:'].includes(u.protocol) ? u.toString() : ''; } catch { return ''; }
}

app.get('/api/health', async (_req, res) => {
  try {
    const [network, block, fee] = await Promise.all([provider.getNetwork(), provider.getBlockNumber(), provider.getFeeData()]);
    res.json({ ok:true, chainId:Number(network.chainId), block, gasPrice:fee.gasPrice?.toString() || null, rpc:RPC, explorer:EXPLORER, time:new Date().toISOString() });
  } catch (e) { res.status(503).json({ ok:false, error:e.message }); }
});

app.get('/api/stock/assets', async (_req,res) => {
  try { const assets = await getAssets(); res.json({ assets, chainId:CHAIN_ID, source:'Robinhood Chain Stock Token API' }); }
  catch(e){ res.status(502).json({ error:e.message }); }
});
app.get('/api/stock/prices/:symbol', async (req,res) => {
  try { res.json(await rhFetch(`https://api.robinhood.com/rhj/prices/${encodeURIComponent(req.params.symbol.toUpperCase())}`)); }
  catch(e){ res.status(502).json({error:e.message}); }
});
app.get('/api/stock/corporate-actions', async (_req,res) => {
  try { res.json(await rhFetch('https://api.robinhood.com/rhj/corporate-actions')); }
  catch(e){ res.status(502).json({error:e.message}); }
});

app.get('/api/address/:address', async (req,res) => {
  const address=req.params.address;
  if(!isAddress(address)) return res.status(400).json({error:'Invalid EVM address'});
  try {
    const [balance, code, nonce] = await Promise.all([provider.getBalance(address), provider.getCode(address), provider.getTransactionCount(address)]);
    const bytecodeBytes = code === '0x' ? 0 : (code.length - 2) / 2;
    res.json({ address, type:code==='0x'?'EOA':'CONTRACT', ethBalance:formatEther(balance), nonce, bytecodeBytes, explorer:`${EXPLORER}/address/${address}` });
  } catch(e){res.status(502).json({error:e.message});}
});

app.get('/api/token/:address', async (req,res) => {
  const address=req.params.address;
  if(!isAddress(address)) return res.status(400).json({error:'Invalid token address'});
  try {
    const code=await provider.getCode(address);
    if(code==='0x') return res.status(400).json({error:'Address is not a deployed contract'});
    const token=new Contract(address,ERC20_ABI,provider);
    const [name,symbol,decimals,totalSupply]=await Promise.allSettled([token.name(),token.symbol(),token.decimals(),token.totalSupply()]);
    res.json({ address, contract:true, name:name.status==='fulfilled'?name.value:null, symbol:symbol.status==='fulfilled'?symbol.value:null, decimals:decimals.status==='fulfilled'?Number(decimals.value):null, totalSupply:totalSupply.status==='fulfilled'&&decimals.status==='fulfilled'?formatUnits(totalSupply.value,decimals.value):null, explorer:`${EXPLORER}/address/${address}` });
  }catch(e){res.status(502).json({error:e.message});}
});

app.get('/api/wallet/:address', async (req,res) => {
  const address=req.params.address;
  if(!isAddress(address)) return res.status(400).json({error:'Invalid EVM address'});
  try {
    const eth=await provider.getBalance(address);
    let assets=[];
    try {
      const stock=await getAssets();
      const mapped=stock.filter(a=>a.status==='ASSET_STATUS_ACTIVE' || !a.status).map(a=>{const d=chainDeployment(a);return d?{symbol:a.tokenSymbol,name:a.tokenName,address:d.contractAddress,decimals:18,multiplier:a.currentMultiplier||'1',kind:'STOCK',logo:a.logoUrl||''}:null}).filter(Boolean);
      assets=[...STATIC_ASSETS,...mapped];
    } catch {}
    assets=assets.slice(0, Number(process.env.WALLET_TOKEN_LIMIT || 80));
    const results=[];
    const chunk=10;
    for(let i=0;i<assets.length;i+=chunk){
      const part=assets.slice(i,i+chunk);
      const out=await Promise.all(part.map(async a=>{
        try { const c=new Contract(a.address,ERC20_ABI,provider); const raw=await c.balanceOf(address); const amount=formatUnits(raw,a.decimals); if(Number(amount)===0) return null; return {...a,balance:amount}; } catch { return null; }
      }));
      results.push(...out.filter(Boolean));
    }
    res.json({ address, eth:formatEther(eth), tokens:results, tokenScanCount:assets.length, explorer:`${EXPLORER}/address/${address}` });
  }catch(e){res.status(502).json({error:e.message});}
});

app.get('/api/projects', (req,res) => {
  const status=req.query.status==='all'?null:(req.query.status||'approved');
  const rows=status?db.prepare('SELECT * FROM projects WHERE status=? ORDER BY id DESC').all(status):db.prepare('SELECT * FROM projects ORDER BY id DESC').all();
  res.json(rows);
});
app.post('/api/projects', (req,res) => {
  const {name,category='OTHER',contract='',website='',description,logo=''}=req.body||{};
  if(!name || !description || String(name).trim().length>80 || String(description).trim().length>500) return res.status(400).json({error:'Project name and description are required (80/500 chars max).'});
  if(contract && !isAddress(contract)) return res.status(400).json({error:'Contract must be a valid EVM address.'});
  if(website && !safeUrl(website)) return res.status(400).json({error:'Website must be a valid http(s) URL.'});
  const now=new Date().toISOString();
  const info=db.prepare('INSERT INTO projects(name,category,contract,website,description,logo,status,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?)').run(String(name).trim(),String(category).trim().slice(0,20),contract,website,description.trim(),logo,'pending',now,now);
  res.status(201).json({ok:true,id:Number(info.lastInsertRowid),status:'pending'});
});
app.post('/api/projects/:id/approve',admin,(req,res)=>{db.prepare('UPDATE projects SET status=?,updated_at=? WHERE id=?').run('approved',new Date().toISOString(),req.params.id);res.json({ok:true});});
app.post('/api/projects/:id/reject',admin,(req,res)=>{db.prepare('UPDATE projects SET status=?,updated_at=? WHERE id=?').run('rejected',new Date().toISOString(),req.params.id);res.json({ok:true});});
app.delete('/api/projects/:id',admin,(req,res)=>{db.prepare('DELETE FROM projects WHERE id=?').run(req.params.id);res.json({ok:true});});

app.get('/api/watchlist',(_req,res)=>res.json(db.prepare('SELECT * FROM watchlist ORDER BY created_at DESC').all()));
app.post('/api/watchlist',(req,res)=>{const {address,label=''}=req.body||{};if(!isAddress(address))return res.status(400).json({error:'Invalid address'});db.prepare('INSERT OR REPLACE INTO watchlist(address,label,created_at) VALUES(?,?,?)').run(address.toLowerCase(),String(label).slice(0,60),new Date().toISOString());res.status(201).json({ok:true});});
app.delete('/api/watchlist/:address',(req,res)=>{if(!isAddress(req.params.address))return res.status(400).json({error:'Invalid address'});db.prepare('DELETE FROM watchlist WHERE address=?').run(req.params.address.toLowerCase());res.json({ok:true});});

app.get('/api/bridge-info',(_req,res)=>{
  if(Date.now()-bridgeCache.at<60_000 && bridgeCache.data) return res.json(bridgeCache.data);
  const data={updatedAt:new Date().toISOString(),routes:[
    {name:'Arbitrum canonical bridge',kind:'CANONICAL',bestFor:'Native ETH and supported canonical transfers',details:'Trust-minimized canonical route; withdrawal timing is protocol-dependent.',docs:'https://docs.robinhood.com/chain/bridging/'},
    {name:'LayerZero / Stargate',kind:'MESSAGING',bestFor:'Supported cross-chain token movement',details:'Availability, fee and route depend on source asset and destination.',docs:'https://docs.robinhood.com/chain/bridging/'},
    {name:'Chainlink CCIP / Transporter',kind:'MESSAGING',bestFor:'Supported cross-chain token transfer and messaging',details:'Availability, fee and route depend on supported lanes/assets.',docs:'https://docs.robinhood.com/chain/bridging/'}
  ],note:'This interface does not invent live bridge fees or ETAs. Execution should be connected to a verified route provider before launch.'};
  bridgeCache={at:Date.now(),data};res.json(data);
});

app.get('/api/docs',(_req,res)=>res.json({chain:{chainId:CHAIN_ID,rpc:RPC,explorer:EXPLORER,native:'ETH'},links:[
 {label:'Robinhood Chain docs',url:'https://docs.robinhood.com/chain/'},
 {label:'Connecting / network',url:'https://docs.robinhood.com/chain/connecting/'},
 {label:'Stock Token APIs',url:'https://docs.robinhood.com/chain/stock-token-apis/'},
 {label:'Token contracts',url:'https://docs.robinhood.com/chain/contracts/'},
 {label:'Bridging',url:'https://docs.robinhood.com/chain/bridging/'},
 {label:'Blockscout',url:EXPLORER}
]}));

app.get('/{*splat}',(req,res)=>res.sendFile(path.join(__dirname,'index.html')));
app.listen(PORT,()=>console.log(`RH//COPILOT running on http://localhost:${PORT}`));
