/* ============ TraderPro — App shell, nav, router ============ */
const NAV=['Trade','Markets','Watchlist','Scan','News','Tools'];

function TopNav({active,onNav,onPick}){
  const[q,setQ]=useState('');
  const[open,setOpen]=useState(false);
  const[hl,setHl]=useState(0);
  const boxRef=useRef(null);
  const results=q?STOCKS.filter(s=>s.symbol.toLowerCase().includes(q.toLowerCase())||s.name.toLowerCase().includes(q.toLowerCase())).slice(0,7):STOCKS.slice(0,6);
  useEffect(()=>{
    function h(e){if(boxRef.current&&!boxRef.current.contains(e.target))setOpen(false)}
    document.addEventListener('mousedown',h);return()=>document.removeEventListener('mousedown',h);
  },[]);
  function pick(sym){setQ('');setOpen(false);onPick(sym)}
  function key(e){
    if(!open)return;
    if(e.key==='ArrowDown'){e.preventDefault();setHl(h=>Math.min(h+1,results.length-1))}
    else if(e.key==='ArrowUp'){e.preventDefault();setHl(h=>Math.max(h-1,0))}
    else if(e.key==='Enter'&&results[hl])pick(results[hl].symbol);
    else if(e.key==='Escape')setOpen(false);
  }
  return(
    <div className="nav">
      <div className="brand">
        <div className="logo"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M4 20V8l8-5 8 5v12h-5v-7H9v7z"/></svg></div>
        TraderPro
      </div>
      <div className="nav-links">
        {NAV.map(n=>(
          <button key={n} className={'nav-link'+(active===n?' active':'')} onClick={()=>onNav(n)}>{n}</button>
        ))}
      </div>
      <div className="nav-spacer"></div>
      <div className="search" ref={boxRef} style={{width:240}}>
        <span className="ico"><Icon d={I.search} s={15}/></span>
        <input placeholder="Search ticker" value={q}
          onChange={e=>{setQ(e.target.value);setOpen(true);setHl(0)}}
          onFocus={()=>setOpen(true)} onKeyDown={key}/>
        {open&&(
          <div className="search-pop">
            {results.length===0&&<div style={{padding:'10px 12px',color:'var(--text-3)',fontSize:12.5}}>No symbols found</div>}
            {results.map((s,i)=>(
              <div key={s.symbol} className={'search-row'+(i===hl?' hl':'')}
                onMouseEnter={()=>setHl(i)} onClick={()=>pick(s.symbol)}>
                <span className="sym">{s.symbol}</span>
                <span className="nm">{s.name}</span>
                <span className={'num '+(s.chgPct>=0?'pos':'neg')} style={{fontSize:12,fontWeight:600}}>{s.chgPct>=0?'+':''}{s.chgPct.toFixed(2)}%</span>
              </div>
            ))}
          </div>
        )}
      </div>
      <button className="nav-ico"><Icon d={I.bell} s={17}/></button>
      <button className="nav-ico"><Icon d={I.gear} s={17}/></button>
      <button className="nav-ico"><Icon d={I.info} s={17}/></button>
      <button className="btn btn-accent" onClick={()=>onNav('Portfolio')}><Icon d={I.briefcase} s={15}/> Portfolio</button>
    </div>
  );
}

function PortfolioStub({portfolio,onPick,onBack}){
  const items=STOCKS.filter(s=>portfolio.includes(s.symbol));
  return(
    <div className="mkt wrap fade-in">
      <div className="mkt-head"><div><h1>Portfolio</h1>
        <p><span className="dot live"></span> {items.length} position{items.length!==1?'s':''} · Paper trading demo</p></div>
        <button className="btn btn-soft" onClick={onBack}><Icon d={I.back} s={15}/> Back to Markets</button>
      </div>
      {items.length===0?(
        <div className="card card-pad" style={{textAlign:'center',padding:'60px',color:'var(--text-3)'}}>
          <div style={{fontSize:14,color:'var(--text-2)',marginBottom:6}}>No positions yet</div>
          <div style={{fontSize:12.5}}>Open any security and tap “Add to portfolio”.</div>
        </div>
      ):(
        <div className="card" style={{overflow:'hidden'}}>
          <table className="tbl"><thead><tr><th className="l">Symbol</th><th>Price</th><th>Change</th><th>Mkt Cap</th><th>30D</th></tr></thead>
          <tbody>{items.map(s=>(
            <tr key={s.symbol} onClick={()=>onPick(s.symbol)}>
              <td className="l"><div className="cell-sym"><div className="lg" style={{background:s.bg,color:s.color}}>{s.letter||<AppleGlyph/>}</div>
                <div className="tx"><div className="s">{s.symbol}</div><div className="n">{s.name}</div></div></div></td>
              <td>${s.price.toFixed(2)}</td>
              <td><span className={'pill '+(s.chgPct>=0?'up':'down')}>{s.chgPct>=0?'▲':'▼'} {Math.abs(s.chgPct).toFixed(2)}%</span></td>
              <td>${fmtCap(s.marketCap)}</td>
              <td><Sparkline symbol={s.symbol} up={s.chgPct>=0} w={88} h={28} seed="pf"/></td>
            </tr>
          ))}</tbody></table>
        </div>
      )}
    </div>
  );
}

function App(){
  const[view,setView]=useState({screen:'markets'});
  const[nav,setNav]=useState('Markets');
  const load=k=>{try{return JSON.parse(localStorage.getItem(k))||[]}catch(e){return[]}};
  const[watchlist,setWatchlist]=useState(()=>load('tp_watch'));
  const[portfolio,setPortfolio]=useState(()=>load('tp_port'));
  useEffect(()=>localStorage.setItem('tp_watch',JSON.stringify(watchlist)),[watchlist]);
  useEffect(()=>localStorage.setItem('tp_port',JSON.stringify(portfolio)),[portfolio]);

  const toggleWatch=s=>setWatchlist(w=>w.includes(s)?w.filter(x=>x!==s):[...w,s]);
  const togglePortfolio=s=>setPortfolio(p=>p.includes(s)?p.filter(x=>x!==s):[...p,s]);

  function pick(sym){setView({screen:'detail',sym});window.scrollTo({top:0});}
  function goNav(n){
    setNav(n);
    if(n==='Portfolio')setView({screen:'portfolio'});
    else if(n==='Watchlist'){setView({screen:'markets',tab:'Watchlist'});}
    else setView({screen:'markets'});
    window.scrollTo({top:0});
  }

  let body;
  if(view.screen==='detail'){
    const stock=BY_SYM[view.sym];
    body=<StockDetail stock={stock} onBack={()=>{setNav('Markets');setView({screen:'markets'})}}
      onPick={pick} watchlist={watchlist} toggleWatch={toggleWatch}
      inPortfolio={portfolio.includes(stock.symbol)} togglePortfolio={togglePortfolio}/>;
  }else if(view.screen==='portfolio'){
    body=<PortfolioStub portfolio={portfolio} onPick={pick} onBack={()=>goNav('Markets')}/>;
  }else{
    body=<MarketsScreen key={view.tab||'def'} onPick={pick} watchlist={watchlist} toggleWatch={toggleWatch} initialTab={view.tab}/>;
  }
  return(
    <div className="app">
      <TopNav active={nav} onNav={goNav} onPick={pick}/>
      {body}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
