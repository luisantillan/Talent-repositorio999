/* ============ TraderPro — Stock detail screen ============ */
const DTOOLS=[
  {k:'cross',d:'<path d="M12 3v18M3 12h18"/>'},
  {k:'trend',d:'<path d="M4 20L20 4M14 4h6v6"/>'},
  {k:'hline',d:'<path d="M3 12h18"/>'},
  {k:'fib',d:'<path d="M3 6h18M3 10h18M3 14h18M3 18h18"/>'},
  {k:'text',d:'<path d="M4 6h16M12 6v14"/>'},
  {k:'brush',d:'<path d="M4 20c4 0 4-4 8-4s4 4 8-8"/>'},
  {k:'ruler',d:'<path d="M5 19L19 5l-3-3L2 16z"/>'},
  {k:'magnet',d:'<path d="M6 4v7a6 6 0 0 0 12 0V4M6 9h4M14 9h4"/>'},
  {k:'eye',d:'<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="2.5"/>'},
  {k:'zoom',d:'<circle cx="11" cy="11" r="7"/><path d="M20 20l-3-3M11 8v6M8 11h6"/>'},
  {k:'lock',d:'<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>'},
];

function StockDetail({stock,onBack,onPick,watchlist,toggleWatch,inPortfolio,togglePortfolio}){
  const[tab,setTab]=useState('Chart');
  const[tf,setTf]=useState('1Y');
  const[ctype,setCtype]=useState('Candles');
  const[hover,setHover]=useState(null);
  const up=stock.change>=0;
  const sign=up?'+':'';
  const bar=hover&&hover.bar;
  const inWatch=watchlist.includes(stock.symbol);

  const tabs=['Chart','Overview','Financials','Options','Historical Data'];
  const tfs=['1D','5D','1M','3M','6M','YTD','1Y','5Y','All'];

  const own=[
    {label:'Institutional',v:stock.ownership.inst,color:'#1ab9a8'},
    {label:'Insider',v:stock.ownership.insider,color:'#f0a93a'},
    {label:'Retail / Other',v:stock.ownership.retail,color:'#2f3a47'},
  ];
  const a=stock.analyst;
  const ratingColor=a.rating.includes('Strong Buy')||a.rating==='Buy'?'var(--accent-bright)':a.rating==='Hold'?'var(--warn)':'var(--neg)';

  return(
    <div className="dpage wrap fade-in" key={stock.symbol}>
      <div className="crumb">
        <a onClick={onBack}>Markets</a><span>›</span><span>{stock.sector}</span><span>›</span>
        <span style={{color:'var(--text-2)'}}>{stock.symbol}</span>
      </div>

      {/* header */}
      <div className="head">
        <div className="head-logo" style={{background:stock.bg,color:stock.color}}>
          {stock.symbol==='AAPL'?<AppleGlyph/>:<span style={{fontSize:24}}>{stock.letter}</span>}
        </div>
        <div>
          <div className="head-name">
            <h1>{stock.name}</h1>
            <span className="tk">{stock.symbol}</span>
          </div>
          <div className="head-meta">{stock.exchange} · {stock.sector} · {stock.industry}</div>
        </div>
        <div className="head-actions">
          <button className="btn btn-ghost" onClick={()=>togglePortfolio(stock.symbol)}>
            <Icon d={inPortfolio?'<path d=\'M20 6L9 17l-5-5\'/>':I.plus} s={15}/> {inPortfolio?'In portfolio':'Add to portfolio'}
          </button>
          <button className={'star-btn'+(inWatch?' on':'')} onClick={()=>toggleWatch(stock.symbol)} title="Watchlist">
            <Icon d={I.star} s={17} sw={inWatch?0:1.6}/>
          </button>
        </div>
      </div>

      {/* price */}
      <div className="price-row">
        <div className="price num">US${stock.price.toFixed(2)}</div>
        <div className={'price-chg num '+(up?'pos':'neg')}>{sign}{stock.change.toFixed(2)}</div>
        <div className={'price-chg num '+(up?'pos':'neg')}>({sign}{stock.chgPct.toFixed(2)}%)</div>
      </div>
      <div className="price-sub"><span className="dot"></span> Market Closed · May 16, 2025 4:00 PM ET</div>

      {/* stats strip */}
      <div className="stats">
        {[['Open',stock.open.toFixed(2)],['High',stock.high.toFixed(2)],['Low',stock.low.toFixed(2)],
          ['Prev Close',stock.prevClose.toFixed(2)],['Volume',fmtVol(stock.volume)],['Avg Vol (3M)',fmtVol(stock.avgVol)],
          ['Market Cap',fmtCap(stock.marketCap)],['52W Range',stock.week52Low.toFixed(2)+' – '+stock.week52High.toFixed(2)]
        ].map(([l,v],i)=>(
          <div className="stat" key={i}><div className="l">{l}</div><div className="v num">{v}</div></div>
        ))}
      </div>

      {/* main grid */}
      <div className="dgrid">
        <div className="dmain">
          <div className="card">
            <div className="tabs" style={{padding:'0 8px'}}>
              {tabs.map(t=><button key={t} className={'tab'+(tab===t?' active':'')} onClick={()=>setTab(t)}>{t}</button>)}
            </div>
            {tab==='Chart'?(
              <div style={{padding:'4px 12px 14px'}}>
                {/* toolbar */}
                <div className="ctool">
                  <button className="cbtn box">{tf} <span className="car"><Icon d={I.caret} s={13}/></span></button>
                  <button className="cbtn box" onClick={()=>setCtype(c=>c==='Candles'?'Line':'Candles')} title="Chart type">
                    <Icon d={ctype==='Candles'?'<rect x=\'6\' y=\'5\' width=\'4\' height=\'14\'/><rect x=\'14\' y=\'8\' width=\'4\' height=\'9\'/>':'<path d=\'M3 17l5-6 4 3 6-8\'/>'} s={14}/>
                  </button>
                  <div className="ctool-sep"></div>
                  <button className="cbtn"><Icon d="<path d='M4 6h16M4 12h10M4 18h7'/>" s={14}/> Indicators</button>
                  <button className="cbtn"><Icon d="<path d='M12 5v14M5 12h14'/>" s={14}/> Compare</button>
                  <div style={{marginLeft:'auto',display:'flex',gap:4}}>
                    <button className="ctool-ico"><Icon d={I.refresh} s={14}/></button>
                    <button className="ctool-ico"><Icon d="<path d='M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2'/>" s={14}/></button>
                    <button className="ctool-ico"><Icon d={I.gear} s={14}/></button>
                  </div>
                </div>
                {/* OHLC readout */}
                <div className="ohlc">
                  <span className="lbl mono">{stock.symbol} · {tf} · {stock.exchange}</span>
                  {(()=>{const b=bar||{o:stock.open,h:stock.high,l:stock.low,c:stock.price};
                    const c=(b.c>=b.o);
                    return(<>
                      <span><span className="k">O</span><span style={{color:c?'#3ad07f':'#f0676b'}}>{b.o.toFixed(2)}</span></span>
                      <span><span className="k">H</span><span style={{color:c?'#3ad07f':'#f0676b'}}>{b.h.toFixed(2)}</span></span>
                      <span><span className="k">L</span><span style={{color:c?'#3ad07f':'#f0676b'}}>{b.l.toFixed(2)}</span></span>
                      <span><span className="k">C</span><span style={{color:c?'#3ad07f':'#f0676b'}}>{b.c.toFixed(2)}</span></span>
                      <span className={up?'pos':'neg'}>{up?'+':''}{stock.change.toFixed(2)} ({up?'+':''}{stock.chgPct.toFixed(2)}%)</span>
                    </>);})()}
                </div>
                {/* chart + tools */}
                <div className="chart-wrap">
                  <div className="chart-tools">
                    {DTOOLS.map((t,i)=><button key={t.k} className={'ctool-ico'+(i===0?' active':'')}><Icon d={t.d} s={15}/></button>)}
                  </div>
                  <div className="chart-box">
                    {ctype==='Candles'
                      ? <CandleChart stock={stock} tf={tf} onHover={(b,i,n)=>setHover(b?{bar:b,i,n}:null)} height={344}/>
                      : <LineChart stock={stock} tf={tf} onHover={(b,i,n)=>setHover(b?{bar:b,i,n}:null)} height={344}/>}
                  </div>
                </div>
                {/* timeframe */}
                <div className="tf-row">
                  {tfs.map(t=><button key={t} className={'tf'+(tf===t?' active':'')} onClick={()=>setTf(t)}>{t}</button>)}
                  <div className="tf-right">
                    <span style={{marginRight:8}}>{stock.exchange==='NASDAQ'?'4:00:00 PM (ET)':'4:00:00 PM (ET)'}</span>
                    <button className="tf">%</button><button className="tf">log</button><button className="tf active">auto</button>
                  </div>
                </div>
              </div>
            ):(
              <OverviewPane stock={stock} tab={tab}/>
            )}
          </div>

          {/* bottom three cards */}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1.05fr',gap:18}}>
            <div className="card card-pad">
              <div className="card-h">Performance</div>
              <div className="perf mlist" style={{marginTop:6}}>
                {Object.entries(stock.performance).map(([k,v])=>(
                  <div className="mrow" key={k}><span className="l">{k}</span>
                    <span className={'v '+(v>=0?'pos':'neg')}>{v>=0?'+':''}{v.toFixed(2)}%</span></div>
                ))}
              </div>
            </div>
            <div className="card card-pad">
              <div className="card-h">Key Stats</div>
              <div className="mlist" style={{marginTop:6}}>
                {Object.entries(stock.keyStats).map(([k,v])=>(
                  <div className="mrow" key={k}><span className="l">{k}</span><span className="v">{v}</span></div>
                ))}
              </div>
            </div>
            <div className="card card-pad">
              <div className="card-h">Ownership</div>
              <div className="own-wrap" style={{marginTop:14}}>
                <Donut segments={own} size={120} thick={17}/>
                <div className="own-legend">
                  {own.map((o,i)=>(
                    <div className="own-leg" key={i}>
                      <span className="sw" style={{background:o.color}}></span>{o.label}
                      <span className="lp">{o.v.toFixed(2)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* sidebar */}
        <div className="dside">
          <div className="card card-pad">
            <div className="card-h" style={{marginBottom:6}}>Key Metrics</div>
            <div className="mlist">
              {Object.entries(stock.metrics).map(([k,v])=>(
                <div className="mrow" key={k}><span className="l">{k}</span><span className="v">{v}</span></div>
              ))}
            </div>
          </div>

          <div className="card card-pad">
            <div className="card-h" style={{marginBottom:4}}>News Feed</div>
            {stock.news.map((n,i)=>(
              <div className="news-item" key={i}>
                <div className="news-thumb" style={{background:stock.bg}}></div>
                <div><div className="nt">{n.t}</div><div className="nmeta">{n.d} · {n.s}</div></div>
              </div>
            ))}
            <span className="news-all">View all news</span>
          </div>

          <div className="card card-pad">
            <div className="card-h" style={{marginBottom:10}}>Analyst Rating</div>
            <div className="rating" style={{color:ratingColor}}>{a.rating}</div>
            <div className="rating-sub">Based on {a.count} analysts</div>
            <div className="rbar">
              <i style={{width:(a.buy/a.count*100)+'%',background:'#1ab9a8'}}></i>
              <i style={{width:(a.hold/a.count*100)+'%',background:'#2f3a47'}}></i>
              <i style={{width:(a.sell/a.count*100)+'%',background:'#f0676b'}}></i>
            </div>
            <div className="rbar-legend">
              <span style={{color:'var(--accent-bright)'}}>{a.buy} Buy</span>
              <span>{a.hold} Hold</span>
              <span style={{color:'var(--neg)'}}>{a.sell} Sell</span>
            </div>
          </div>
        </div>
      </div>

      {/* related */}
      <div style={{marginTop:24}}>
        <div className="card-h" style={{marginBottom:12,fontSize:15}}>More in {stock.sector}</div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:14}}>
          {STOCKS.filter(s=>s.sector===stock.sector&&s.symbol!==stock.symbol).slice(0,4).map(s=>(
            <div className="card card-pad" key={s.symbol} style={{cursor:'pointer'}} onClick={()=>onPick(s.symbol)}>
              <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:10}}>
                <div className="lg" style={{width:30,height:30,borderRadius:8,display:'grid',placeItems:'center',background:s.bg,color:s.color,fontWeight:700,fontSize:12,border:'1px solid var(--border)'}}>{s.letter||<AppleGlyph/>}</div>
                <div className="mono" style={{fontWeight:600}}>{s.symbol}</div>
                <Sparkline symbol={s.symbol} up={s.chgPct>=0} w={56} h={22} seed="rel"/>
              </div>
              <div className="num" style={{fontSize:16,fontWeight:600}}>${s.price.toFixed(2)}</div>
              <div className={'num '+(s.chgPct>=0?'pos':'neg')} style={{fontSize:12.5,fontWeight:600,marginTop:2}}>
                {s.chgPct>=0?'+':''}{s.chgPct.toFixed(2)}%</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Line chart variant (reuses candle layout for hover)
function LineChart({stock,tf,onHover,height}){
  const[ref,W]=useWidth();
  const bars=useMemo(()=>seriesFor(stock,tf),[stock.symbol,tf]);
  const[hi,setHi]=useState(null);
  const axisW=54,botH=24,padTop=10;const plotW=Math.max(10,W-axisW);const H=height;
  const priceH=H-botH-padTop;
  const lo=Math.min(...bars.map(b=>b.l)),hiP=Math.max(...bars.map(b=>b.h));
  const pad=(hiP-lo)*0.06||1,min=lo-pad,max=hiP+pad;const n=bars.length;const step=plotW/n;
  const y=p=>padTop+(1-(p-min)/(max-min))*priceH;const x=i=>i*step+step/2;
  const up=stock.change>=0;const col=up?'#3ad07f':'#f0676b';
  const d=bars.map((b,i)=>`${i===0?'M':'L'}${x(i).toFixed(1)} ${y(b.c).toFixed(1)}`).join(' ');
  const gl=[];for(let i=0;i<=5;i++){const p=min+(max-min)*i/5;gl.push({p,y:y(p)})}
  function move(e){const r=e.currentTarget.getBoundingClientRect();let idx=Math.floor((e.clientX-r.left)/step);idx=Math.max(0,Math.min(n-1,idx));setHi(idx);onHover&&onHover(bars[idx],idx,n)}
  function leave(){setHi(null);onHover&&onHover(null)}
  return(
    <div ref={ref} style={{position:'relative',width:'100%'}}>
      <svg width={W} height={H} onMouseMove={move} onMouseLeave={leave} style={{display:'block',cursor:'crosshair'}}>
        {gl.map((g,i)=>(<g key={i}><line x1={0} x2={plotW} y1={g.y} y2={g.y} stroke="#141a23"/><text x={W-axisW+8} y={g.y+3.5} fill="#586069" fontSize="10.5" fontFamily="var(--mono)">{g.p.toFixed(2)}</text></g>))}
        <path d={`${d} L ${x(n-1)} ${H-botH} L ${x(0)} ${H-botH} Z`} fill={up?'rgba(58,208,127,.08)':'rgba(240,103,107,.08)'}/>
        <path d={d} fill="none" stroke={col} strokeWidth="1.8" strokeLinejoin="round"/>
        <rect x={W-axisW} y={y(stock.price)-9} width={axisW} height={18} rx="3" fill="#15b8a6"/>
        <text x={W-axisW/2} y={y(stock.price)+3.5} fill="#04110f" fontSize="10.5" fontWeight="600" textAnchor="middle" fontFamily="var(--mono)">{stock.price.toFixed(2)}</text>
        {hi!=null&&(<g pointerEvents="none">
          <line x1={x(hi)} x2={x(hi)} y1={0} y2={H-botH} stroke="#3a4654" strokeDasharray="3 3"/>
          <circle cx={x(hi)} cy={y(bars[hi].c)} r="3.5" fill={col} stroke="#0d121a" strokeWidth="1.5"/>
        </g>)}
      </svg>
    </div>
  );
}

function OverviewPane({stock,tab}){
  if(tab==='Overview'){
    return(<div style={{padding:'20px 22px',color:'var(--text-2)',fontSize:13.5,lineHeight:1.7}}>
      <p style={{maxWidth:640}}><b style={{color:'var(--text)'}}>{stock.name}</b> ({stock.exchange}: {stock.symbol}) operates in the {stock.industry} industry within the {stock.sector} sector. The company is a constituent of major U.S. indices and is widely held by institutional investors, who own {stock.ownership.inst.toFixed(1)}% of shares outstanding.</p>
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:18,marginTop:24}}>
        {[['Sector',stock.sector],['Industry',stock.industry],['Exchange',stock.exchange],['Market Cap','$'+fmtCap(stock.marketCap)],['Shares Out.',stock.keyStats['Shares Outstanding']],['Beta (5Y)',stock.keyStats['Beta (5Y)']]].map(([l,v],i)=>(
          <div key={i}><div className="stat"><div className="l">{l}</div><div className="v" style={{marginTop:4}}>{v}</div></div></div>
        ))}
      </div>
    </div>);
  }
  const labels={Financials:'Financial statements',Options:'Options chain','Historical Data':'Historical prices'};
  return(<div style={{padding:'60px 22px',textAlign:'center',color:'var(--text-3)'}}>
    <div style={{fontSize:14,color:'var(--text-2)',marginBottom:6}}>{labels[tab]}</div>
    <div style={{fontSize:12.5}}>This panel is part of the prototype scope and is not populated in this demo.</div>
  </div>);
}

Object.assign(window,{StockDetail});
