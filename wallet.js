
(function(){
  const KEY='rh_wallet_session';
  window.RHWallet = {
    address: null,
    provider: null,
    chainId: null,
    listeners: [],
    async connect(){
      if(!window.ethereum) throw new Error('No EVM wallet detected. Install MetaMask or another compatible wallet.');
      const accounts = await window.ethereum.request({method:'eth_requestAccounts'});
      if(!accounts?.[0]) throw new Error('No wallet account returned.');
      this.address = accounts[0];
      this.provider = window.ethereum;
      this.chainId = await window.ethereum.request({method:'eth_chainId'});
      localStorage.setItem(KEY, JSON.stringify({address:this.address, connected:true}));
      this.bind();
      this.render();
      this.emit();
      return this.address;
    },
    async switchNetwork(){
      if(!window.ethereum) return;
      try{
        await window.ethereum.request({method:'wallet_switchEthereumChain',params:[{chainId:'0x1237'}]});
      }catch(e){
        if(e.code===4902){
          await window.ethereum.request({method:'wallet_addEthereumChain',params:[{
            chainId:'0x1237', chainName:'Robinhood Chain',
            nativeCurrency:{name:'Ether',symbol:'ETH',decimals:18},
            rpcUrls:['https://rpc.mainnet.chain.robinhood.com'],
            blockExplorerUrls:['https://robinhoodchain.blockscout.com']
          }]});
        } else throw e;
      }
      this.chainId = await window.ethereum.request({method:'eth_chainId'});
      this.emit();
    },
    async disconnect(){
      // EVM wallets do not expose a universal programmatic disconnect.
      // Clear this site's session and permissions when the wallet supports it.
      this.address=null; this.provider=null; this.chainId=null;
      localStorage.removeItem(KEY);
      try{
        if(window.ethereum?.request) await window.ethereum.request({method:'wallet_revokePermissions',params:[{eth_accounts:{}}]});
      }catch(_){}
      this.render(); this.emit();
    },
    bind(){
      if(this._bound || !window.ethereum) return;
      this._bound=true;
      window.ethereum.on?.('accountsChanged', a=>{
        if(a?.[0]){this.address=a[0]; localStorage.setItem(KEY,JSON.stringify({address:this.address,connected:true}));}
        else {this.address=null; localStorage.removeItem(KEY);}
        this.render(); this.emit();
      });
      window.ethereum.on?.('chainChanged', c=>{this.chainId=c; this.emit();});
    },
    restore(){
      try{
        const s=JSON.parse(localStorage.getItem(KEY)||'null');
        if(s?.address){this.address=s.address; this.provider=window.ethereum||null; this.bind();}
      }catch(_){}
      this.render();
    },
    on(fn){this.listeners.push(fn)},
    emit(){this.listeners.forEach(fn=>fn(this))},
    short(a){return a?a.slice(0,6)+'…'+a.slice(-4):'Connect Wallet'},
    render(){
      document.querySelectorAll('[data-wallet]').forEach(b=>{
        b.textContent=this.address?this.short(this.address):'Connect Wallet';
        b.classList.toggle('connected',!!this.address);
      });
      document.querySelectorAll('[data-wallet-status]').forEach(e=>{
        e.textContent=this.address?this.short(this.address):'Not connected';
      });
    }
  };
  document.addEventListener('click', async e=>{
    const b=e.target.closest('[data-wallet]');
    if(!b) return;
    if(RHWallet.address){
      const action=await Promise.resolve(window.confirm('Disconnect wallet from this site?'));
      if(action) await RHWallet.disconnect();
    } else {
      try{ await RHWallet.connect(); }catch(err){ alert(err.message||'Wallet connection failed.'); }
    }
  });
  RHWallet.restore();
})();
