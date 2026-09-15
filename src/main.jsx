import React,{useEffect,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {BrowserRouter,useNavigate,useLocation,Routes,Route,Link} from 'react-router-dom';
import {supabase} from './supabase';
import {connectAndVerify,verifyConnectedWallet,shortAddress,getBalanceOf,CONTRACT} from './chain';
import './styles.css';

const OPENSEA=import.meta.env.VITE_OPENSEA_URL||'https://opensea.io/';
const ADMIN_EMAIL=import.meta.env.VITE_ADMIN_EMAIL||'';

function Modal({title,text,children,onClose}){return <div className="modal"><div className="modalBox"><h2>{title}</h2><p className="muted">{text}</p>{children||<button className="btn primary" onClick={onClose}>Close</button>}</div></div>}
function Toast({text}){return text?<div className="toast">{text}</div>:null}

async function getSessionWallet(){
  try{
    const raw=sessionStorage.getItem('rhood_verified');
    return raw?JSON.parse(raw):null;
  }catch{return null}
}
function saveWallet(address){sessionStorage.setItem('rhood_verified',JSON.stringify({address}))}
function clearWallet(){sessionStorage.removeItem('rhood_verified')}

function Layout({children,wallet,onDisconnect}){
 const [menu,setMenu]=useState(false);
 return <div className="app"><div className="container"><header className="nav"><Link className="brand" to="/">RHOODSTONE</Link><div className="navRight">
 {wallet?<><span className="tag">{shortAddress(wallet)}</span><div className="menu"><button className="btn" onClick={()=>setMenu(!menu)}>•••</button>{menu&&<div className="menuItems"><Link to="/dashboard"><button>Dashboard</button></Link><Link to="/submit"><button>Submit Project</button></Link><button onClick={onDisconnect}>Disconnect</button></div>}</div></>:<a className="btn" href="https://x.com/rhoodstone" target="_blank">X / Twitter</a>}
 </div></header>{children}<footer className="footer">Rhoodstone Holder Utility • Robinhood Chain</footer></div></div>
}

function Home({setWallet}){
 const [modal,setModal]=useState(null),nav=useNavigate();
 async function connect(){
  try{
   const r=await connectAndVerify();
   if(!r.holder){setModal({type:'not'});return}
   saveWallet(r.address);setWallet(r.address);
   setModal({type:'ok'});
  }catch(e){setModal({type:'error',msg:e.message})}
 }
 return <Layout><section className="hero"><div><div className="eyebrow">ROBINHOOD CHAIN • HOLDER UTILITY</div><h1>More Than<br/>A Stone.</h1><p className="lead">Rhoodstone holders get access to exclusive GTD campaigns from partner NFT projects. Verify once and enter your private holder dashboard.</p><div className="actions"><button className="btn primary" onClick={connect}>Connect & Verify</button><a className="btn" href="https://x.com/rhoodstone" target="_blank">Follow on X</a></div></div><div className="art"><img src="/assets/hero-banner.jpg"/></div></section><section className="cards"><div className="card"><span className="tag">01</span><h3>Verify</h3><p className="muted">Your NFT ownership is checked directly against the Rhoodstone ERC-721 contract.</p></div><div className="card"><span className="tag">02</span><h3>Open Campaigns</h3><p className="muted">Verified holders see campaigns approved by the Rhoodstone admin.</p></div><div className="card"><span className="tag">03</span><h3>Claim Rewards</h3><p className="muted">Eligible GTD or points are reserved and tracked so the same campaign cannot be claimed twice.</p></div></section>
 {modal?.type==='ok'&&<Modal title="Holder verified" text="Your Rhoodstone NFT was verified successfully."><button className="btn primary" onClick={()=>nav('/dashboard')}>Go to Dashboard</button></Modal>}
 {modal?.type==='not'&&<Modal title="Not a holder" text="This wallet does not currently hold a Rhoodstone NFT."><div className="actions"><a className="btn primary" href={OPENSEA} target="_blank">Buy on OpenSea</a><button className="btn" onClick={()=>setModal(null)}>Close</button></div></Modal>}
 {modal?.type==='error'&&<Modal title="Connection failed" text={modal.msg} onClose={()=>setModal(null)}/>}
 </Layout>
}

function Protected({children,setWallet}){
 const nav=useNavigate(),[checking,setChecking]=useState(true);
 useEffect(()=>{(async()=>{const s=await getSessionWallet();if(!s){nav('/');return}try{const r=await verifyConnectedWallet();if(!r||!r.holder||r.address.toLowerCase()!==s.address.toLowerCase()){clearWallet();nav('/');return}setWallet(r.address)}catch{clearWallet();nav('/')}finally{setChecking(false)}})()},[]);
 useEffect(()=>{const id=setInterval(async()=>{try{const r=await verifyConnectedWallet();if(!r?.holder){clearWallet();nav('/')}}catch{}},30000);return()=>clearInterval(id)},[]);
 if(checking)return <div className="container page"><div className="notice">Verifying holder access…</div></div>;
 return children;
}

function Dashboard({wallet}){
 const [campaigns,setCampaigns]=useState([]),[loading,setLoading]=useState(true),[claim,setClaim]=useState(null),[toast,setToast]=useState('');
 async function load(){if(!supabase){setLoading(false);return}const {data,error}=await supabase.from('campaigns').select('*').eq('status','live').order('created_at',{ascending:false});if(!error)setCampaigns(data||[]);setLoading(false)}
 useEffect(()=>{load()},[]);
 async function open(c){
  if(!supabase){setClaim({title:'Demo mode',text:'Supabase is not configured yet. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY, then run the SQL schema.'});return}
  const {data,error}=await supabase.rpc('open_campaign_box',{p_campaign_id:c.id,p_wallet:wallet});
  if(error){setClaim({title:'Could not open',text:error.message});return}
  const r=data?.[0]||data;
  setClaim({title:r?.reward_type==='gtd'?'GTD Assigned':r?.reward_type==='points'?'Points Assigned':'Better Luck',text:r?.message||'Reward result recorded.'});load()
 }
 return <Layout wallet={wallet} onDisconnect={()=>{clearWallet();location.href='/'}}><main className="page"><div className="pageHead"><div><div className="eyebrow">PRIVATE HOLDER AREA</div><h1>Holder Dashboard</h1><p className="muted">Only a currently verified Rhoodstone holder can use this page.</p></div></div><div className="notice">Ownership is automatically checked every 30 seconds. If this wallet no longer holds the NFT, access ends.</div><h2>Active Campaigns</h2>{!supabase&&<div className="notice">Backend is not connected yet. The UI is ready; connect Supabase to make campaigns and claims live.</div>}{loading?<p className="muted">Loading campaigns…</p>:campaigns.length?<div className="campaignGrid">{campaigns.map(c=><div className="panel" key={c.id}><span className="tag">LIVE</span><h3>{c.name}</h3><p className="muted">{c.description}</p><div className="reward">{c.gtd_pool||0} GTD</div><button className="btn primary" onClick={()=>open(c)}>Open Box</button></div>)}</div>:supabase?<div className="empty">No live campaigns right now.</div>:null}<h2 style={{marginTop:42}}>My Rewards</h2><div className="panel"><div className="row"><span>Connected wallet</span><strong>{shortAddress(wallet)}</strong></div><div className="row"><span>Contract</span><span className="small">{shortAddress(CONTRACT)}</span></div></div></main>{claim&&<Modal title={claim.title} text={claim.text} onClose={()=>setClaim(null)}/>}<Toast text={toast}/></Layout>
}

function SubmitProject({wallet}){
 const [form,setForm]=useState({project_name:'',website:'',chain:'',gtd_quantity:'',claim_method:'',claim_link:'',instructions:'',expiry:'',contact:''}),[msg,setMsg]=useState('');
 async function submit(e){e.preventDefault();if(!supabase){setMsg('Supabase is not configured.');return}const {error}=await supabase.from('project_submissions').insert({...form,gtd_quantity:Number(form.gtd_quantity||0),submitted_by:wallet,status:'pending'});setMsg(error?error.message:'Submitted. Admin review is required before publication.')}
 return <Layout wallet={wallet} onDisconnect={()=>{clearWallet();location.href='/'}}><main className="page"><div className="pageHead"><div><div className="eyebrow">PARTNER SUBMISSION</div><h1>Submit a GTD</h1><p className="muted">Project owners can submit an allocation. Admin approval is required.</p></div></div><form className="panel" onSubmit={submit}><div className="formGrid">{[['project_name','Project Name'],['website','Website'],['chain','Blockchain'],['gtd_quantity','GTD Quantity'],['claim_method','Claim Method'],['claim_link','Claim Link'],['expiry','Expiry'],['contact','Contact']].map(([k,l])=><label key={k}>{l}<input required={['project_name','gtd_quantity'].includes(k)} value={form[k]} onChange={e=>setForm({...form,[k]:e.target.value})}/></label>)}<label className="full">Instructions<textarea rows="5" value={form.instructions} onChange={e=>setForm({...form,instructions:e.target.value})}/></label></div><div className="actions"><button className="btn primary">Submit for Review</button>{msg&&<span className="muted">{msg}</span>}</div></form></main></Layout>
}

function Admin(){
 const [session,setSession]=useState(null),[email,setEmail]=useState(''),[password,setPassword]=useState(''),[campaigns,setCampaigns]=useState([]),[form,setForm]=useState({name:'',description:'',gtd_pool:20,points_pool:0}),[msg,setMsg]=useState('');
 async function login(e){e.preventDefault();if(!supabase){setMsg('Configure Supabase first.');return}const {data,error}=await supabase.auth.signInWithPassword({email,password});if(error)setMsg(error.message);else setSession(data.session)}
 async function load(){if(!supabase)return;const {data}=await supabase.from('campaigns').select('*').order('created_at',{ascending:false});setCampaigns(data||[])}
 useEffect(()=>{if(supabase){supabase.auth.getSession().then(({data})=>setSession(data.session));}},[]);
 useEffect(()=>{if(session)load()},[session]);
 async function create(e){e.preventDefault();const {error}=await supabase.from('campaigns').insert({...form,gtd_pool:Number(form.gtd_pool),points_pool:Number(form.points_pool),status:'live'});setMsg(error?error.message:'Campaign created.');if(!error){setForm({name:'',description:'',gtd_pool:20,points_pool:0});load()}}
 if(!session)return <div className="container page"><div className="panel" style={{maxWidth:430,margin:'80px auto'}}><div className="eyebrow">ADMIN</div><h1>Sign in</h1><form onSubmit={login}><label>Email<input type="email" value={email} onChange={e=>setEmail(e.target.value)}/></label><label>Password<input type="password" value={password} onChange={e=>setPassword(e.target.value)}/></label><button className="btn primary">Sign in</button></form>{msg&&<p className="muted">{msg}</p>}</div></div>;
 return <div className="container"><header className="nav"><Link className="brand" to="/">RHOODSTONE ADMIN</Link><button className="btn" onClick={()=>supabase.auth.signOut()}>Sign out</button></header><main className="page"><div className="stats"><div className="panel"><h3>Received</h3><div className="reward">—</div></div><div className="panel"><h3>Assigned</h3><div className="reward">—</div></div><div className="panel"><h3>Remaining</h3><div className="reward">—</div></div></div><div className="panel" style={{marginTop:20}}><h2>Create Campaign</h2><form onSubmit={create}><div className="formGrid"><label>Campaign Name<input required value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></label><label>GTD Pool<input type="number" value={form.gtd_pool} onChange={e=>setForm({...form,gtd_pool:e.target.value})}/></label><label>Points Pool<input type="number" value={form.points_pool} onChange={e=>setForm({...form,points_pool:e.target.value})}/></label><label className="full">Description<textarea value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/></label></div><button className="btn primary">Create Campaign</button></form>{msg&&<p className="muted">{msg}</p>}</div><div className="panel" style={{marginTop:20}}><h2>Campaigns</h2>{campaigns.map(c=><div className="row" key={c.id}><span>{c.name}</span><span className="tag">{c.status}</span></div>)}</div></main></div>
}

function App(){
 const [wallet,setWallet]=useState(null),loc=useLocation();
 useEffect(()=>{getSessionWallet().then(s=>setWallet(s?.address||null))},[]);
 useEffect(()=>{if(window.ethereum)window.ethereum.on('accountsChanged',()=>{clearWallet();setWallet(null);if(loc.pathname!=='/')location.href='/'})},[]);
 const disconnect=()=>{clearWallet();setWallet(null);location.href='/'};
 return <Routes><Route path="/" element={<Home setWallet={setWallet}/>}/><Route path="/dashboard" element={<Protected setWallet={setWallet}><Dashboard wallet={wallet}/></Protected>}/><Route path="/submit" element={<Protected setWallet={setWallet}><SubmitProject wallet={wallet}/></Protected>}/><Route path="/admin" element={<Admin/>}/><Route path="*" element={<Home setWallet={setWallet}/>}/></Routes>
}
createRoot(document.getElementById('root')).render(<BrowserRouter><App/></BrowserRouter>);
