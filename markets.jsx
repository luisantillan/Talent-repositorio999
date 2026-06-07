/* ============ TraderPro — Markets screen ============ */
function Icon({d,s=16,sw=1.6}){return <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" dangerouslySetInnerHTML={{__html:d}}/>;}
const I={
  search:'<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  star:'<path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L4.5 9.7l5.9-.9z"/>',
  bell:'<path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/>',
  gear:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1V21a2 2 0 1 1-4 0v-.1A1.6 1.6 0 0 0 7 19.4a1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0-1.1-2.7H1a2 2 0 1 1 0-4h.1A1.6 1.6 0 0 0 2.6 7a1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H7a1.6 1.6 0 0 0 1-1.5V1a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V7a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z"/>',
  info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',
  arrow:'<path d="M6 9l6 6 6-6"/>',
  caret:'<path d="M6 9l6 6 6-6"/>',
  briefcase:'<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
  back:'<path d="M15 18l-6-6 6-6"/>',
  refresh:'<path d="M3 12a9 9 0 0 1 15-6.7L21 8M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16M3 21v-5h5"/>',
};

function MarketsScreen({onPick,watchlist,toggleWatch,initialTab}){
  const[tab,setTab]=useState(initialTab||'Most Active');
  const[sector,setSector]=useState('All');
  const[q,setQ]=useState('');
  const[sort,setSort]=useState({key:'marketCap',dir:-1});

  const tabs=['Most Active','Gainers','Losers','Trending','Watchlist'];

  let rows=STOCKS.slice();
  if(sector!=='All')rows=rows.filter(s=>s.sector===sector);
  if(q)rows=rows.filter(s=>s.symbol.toLowerCase().includes(q.toLowerCase())||s.name.toLowerCase().includes(q.toLowerCase()));
  if(tab==='Gainers')rows=rows.filter(s=>s.chgPct>0).sort((a,b)=>b.chgPct-a.chgPct);
  else if(tab==='Losers')rows=rows.filter(s=>s.chgPct<0).sort((a,b)=>a.chgPct-b.chgPct);
  else if(tab==='Trending')rows.sort((a,b)=>b.volume-a.volume);
  else if(tab==='Watchlist')rows=rows.filter(s=>watchlist.includes(s.symbol));
  else rows.sort((a,b)=>b.volume-a.volume);

  if(tab==='Most Active'||tab==='Watchlist'){
    rows=rows.slice().sort((a,b)=>{
      const m={symbol:s=>s.symbol,price:s=>s.price,chgPct:s=>s.chgPct,volume:s=>s.volume,marketCap:s=>s.marketCap};
      const f=m[sort.key]||m.marketCap;const av=f(a),bv=f(b);
      if(typeof av==='string')return av<bv?-sort.dir:av>bv?sort.dir:0;
      return (av-bv)*sort.dir;
    });
  }
  const maxCap=Math.max(...STOCKS.map(s=>s.marketCap));
  function th(key,label,cls){
    const on=sort.key===key;
    return <th className={(cls||'')+(on?' sorted':'')} onClick={()=>setSort(s=>({key,dir:s.key===key?-s.dir:-1}))}>
      {label}<span className="sa">{on?(sort.dir<0?'▼':'▲'):'⇅'}</span></th>;
  }

  return(
    <div className="mkt wrap fade-in">
      <div className="mkt-head">
        <div>
          <h1>Markets</h1>
          <p><span className="dot live"></span> U.S. markets open · Real-time · May 16, 2025 1:24 PM ET</p>
        </div>
        <button className="btn btn-soft"><Icon d={I.refresh} s={15}/> Refresh</button>
      </div>

      <div className="indices">
        {INDICES.map((x,i)=>(
          <div className="idx" key={i}>
            <div className="spark"><Sparkline symbol={x.nm} up={x.up} w={170} h={46} seed="idx"/></div>
            <div className="nm">{x.nm}</div>
            <div className="v num">{x.v}</div>
            <div className={'c '+(x.up?'pos':'neg')}>{x.c} <span className="dim">today</span></div>
          </div>
        ))}
      </div>

      <div className="mkt-bar">
        <div className="segm">
          {tabs.map(t=>(
            <button key={t} className={'seg'+(tab===t?' active':'')} onClick={()=>setTab(t)}>
              {t}{t==='Watchlist'&&watchlist.length>0?` (${watchlist.length})`:''}
            </button>
          ))}
        </div>
        <div className="search mkt-search">
          <span className="ico"><Icon d={I.search} s={15}/></span>
          <input placeholder="Filter symbol or name" value={q} onChange={e=>setQ(e.target.value)}/>
        </div>
      </div>

      <div className="chips" style={{marginBottom:6}}>
        {SECTORS.map(s=>(
          <button key={s} className={'chip'+(sector===s?' active':'')} onClick={()=>setSector(s)}>{s}</button>
        ))}
      </div>

      <div className="card" style={{marginTop:14,overflow:'hidden'}}>
        <div style={{overflowX:'auto'}}>
        <table className="tbl">
          <thead><tr>
            {th('symbol','Symbol','l')}
            <th className="l">Sector</th>
            {th('price','Price')}
            {th('chgPct','Change')}
            {th('volume','Volume')}
            {th('marketCap','Mkt Cap')}
            <th>30D</th>
            <th style={{width:40}}></th>
          </tr></thead>
          <tbody>
            {rows.length===0&&(
              <tr><td colSpan="8" className="l" style={{textAlign:'center',color:'var(--text-3)',padding:'40px'}}>
                {tab==='Watchlist'?'Your watchlist is empty — tap the star on any row to add it.':'No matches.'}
              </td></tr>
            )}
            {rows.map(s=>{
              const up=s.chgPct>=0;
              return(
                <tr key={s.symbol} onClick={()=>onPick(s.symbol)}>
                  <td className="l">
                    <div className="cell-sym">
                      <div className="lg" style={{background:s.bg,color:s.color}}>{s.letter||<AppleGlyph/>}</div>
                      <div className="tx"><div className="s">{s.symbol}</div><div className="n">{s.name}</div></div>
                    </div>
                  </td>
                  <td className="l"><span className="sector-tag">{s.sector}</span></td>
                  <td>${s.price.toFixed(2)}</td>
                  <td><span className={'pill '+(up?'up':'down')}>{up?'▲':'▼'} {Math.abs(s.chgPct).toFixed(2)}%</span></td>
                  <td className="muted">{fmtVol(s.volume)}</td>
                  <td>${fmtCap(s.marketCap)}<span className="capbar"><i style={{width:(s.marketCap/maxCap*100)+'%'}}></i></span></td>
                  <td><Sparkline symbol={s.symbol} up={up} w={88} h={28} seed="t"/></td>
                  <td onClick={e=>{e.stopPropagation();toggleWatch(s.symbol)}}>
                    <span className={'wl-star'+(watchlist.includes(s.symbol)?' on':'')}>
                      <Icon d={I.star} s={16} sw={watchlist.includes(s.symbol)?0:1.6}/>
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>
      </div>
      <p style={{color:'var(--text-3)',fontSize:12,marginTop:14,textAlign:'center'}}>
        Showing {rows.length} of {STOCKS.length} symbols · Data delayed for demonstration · Click any row to open the security
      </p>
    </div>
  );
}

function AppleGlyph(){return <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M17.5 12.5c0-2.1 1.7-3.1 1.8-3.2-1-1.4-2.5-1.6-3-1.6-1.3-.1-2.5.7-3.1.7-.6 0-1.6-.7-2.7-.7-1.4 0-2.7.8-3.4 2-1.5 2.5-.4 6.3 1 8.3.7 1 1.5 2.1 2.6 2.1 1 0 1.4-.7 2.7-.7 1.2 0 1.6.7 2.7.7 1.1 0 1.8-1 2.5-2 .8-1.1 1.1-2.2 1.1-2.3-.1 0-2.2-.8-2.2-3.3zM15.3 6.3c.6-.7 1-1.7.9-2.7-.9 0-1.9.6-2.5 1.3-.5.6-1 1.6-.9 2.6 1 .1 2-.5 2.5-1.2z"/></svg>;}

Object.assign(window,{MarketsScreen,Icon,I,AppleGlyph});
