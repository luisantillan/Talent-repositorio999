/* ============ TraderPro — chart components ============ */
const {useState,useRef,useEffect,useLayoutEffect,useMemo}=React;

function useWidth(){
  const ref=useRef(null);const[w,setW]=useState(720);
  useLayoutEffect(()=>{
    if(!ref.current)return;
    const ro=new ResizeObserver(es=>{for(const e of es)setW(e.contentRect.width)});
    ro.observe(ref.current);setW(ref.current.clientWidth);
    return()=>ro.disconnect();
  },[]);
  return[ref,w];
}

// ---------- Interactive candlestick ----------
function CandleChart({stock,tf,onHover,height=348}){
  const[ref,W]=useWidth();
  const[hi,setHi]=useState(null); // hovered index
  const[mouseY,setMouseY]=useState(null);
  const bars=useMemo(()=>seriesFor(stock,tf),[stock.symbol,tf]);

  const axisW=54,botH=24,padTop=10;
  const plotW=Math.max(10,W-axisW);
  const H=height;
  const volH=Math.round((H-botH)*0.20);
  const priceH=H-botH-volH-padTop;

  const lo=Math.min(...bars.map(b=>b.l));
  const hiP=Math.max(...bars.map(b=>b.h));
  const pad=(hiP-lo)*0.06||1;
  const min=lo-pad,max=hiP+pad;
  const maxVol=Math.max(...bars.map(b=>b.v));
  const n=bars.length;
  const step=plotW/n;
  const cw=Math.max(1.5,Math.min(step*0.66,14));

  const yPrice=p=>padTop+(1-(p-min)/(max-min))*priceH;
  const yVol=v=>(H-botH)-(v/maxVol)*volH;
  const xCenter=i=>i*step+step/2;

  const up=stock.change>=0;
  const last=bars[n-1];
  const lastY=yPrice(stock.price);

  // gridlines
  const ticks=5;const gl=[];for(let i=0;i<=ticks;i++){const p=min+(max-min)*i/ticks;gl.push({p,y:yPrice(p)})}

  // date labels
  const baseDate=new Date(2025,4,16);
  const lab=[];const count=6;
  for(let i=0;i<count;i++){
    const idx=Math.round((n-1)*i/(count-1));
    const d=new Date(baseDate);d.setDate(d.getDate()-(n-1-idx)*(tf==='1D'||tf==='5D'?0:(tf==='5Y'||tf==='All'?9:1)));
    let text;
    if(tf==='1D'){const h=9+Math.floor(idx/ (n/6.5));text=(h>12?h-12:h)+(h>=12?' PM':' AM')}
    else if(tf==='5D'){text=MONTHS[(4+Math.floor(idx/13))%12]+' '+(12+Math.floor(idx/13))}
    else text=MONTHS[d.getMonth()]+(i===0||d.getMonth()===0?" '"+String(d.getFullYear()).slice(2):'');
    lab.push({idx,x:xCenter(idx),text});
  }

  function move(e){
    const rect=e.currentTarget.getBoundingClientRect();
    const x=e.clientX-rect.left, y=e.clientY-rect.top;
    let idx=Math.floor(x/step);idx=Math.max(0,Math.min(n-1,idx));
    setHi(idx);setMouseY(y);
    onHover&&onHover(bars[idx],idx,n);
  }
  function leave(){setHi(null);setMouseY(null);onHover&&onHover(null);}

  const hoverPrice=mouseY!=null?min+(1-(mouseY-padTop)/priceH)*(max-min):null;

  return(
    <div ref={ref} style={{position:'relative',width:'100%',userSelect:'none'}}>
      <svg width={W} height={H} onMouseMove={move} onMouseLeave={leave} style={{display:'block',cursor:'crosshair'}}>
        {/* gridlines */}
        {gl.map((g,i)=>(
          <g key={i}>
            <line x1={0} x2={plotW} y1={g.y} y2={g.y} stroke="#141a23" strokeWidth="1"/>
            <text x={W-axisW+8} y={g.y+3.5} fill="#586069" fontSize="10.5" fontFamily="var(--mono)">{g.p.toFixed(2)}</text>
          </g>
        ))}
        {/* volume baseline */}
        <line x1={0} x2={plotW} y1={H-botH} y2={H-botH} stroke="#1b232e" strokeWidth="1"/>
        {/* candles */}
        {bars.map((b,i)=>{
          const c=b.c>=b.o;const col=c?'#3ad07f':'#f0676b';
          const x=xCenter(i);
          const oy=yPrice(b.o),cy=yPrice(b.c),hy=yPrice(b.h),ly=yPrice(b.l);
          const top=Math.min(oy,cy),h=Math.max(1,Math.abs(cy-oy));
          return(
            <g key={i} opacity={hi==null||hi===i?1:.82}>
              <line x1={x} x2={x} y1={hy} y2={ly} stroke={col} strokeWidth="1"/>
              <rect x={x-cw/2} y={top} width={cw} height={h} fill={col} rx=".5"/>
              <rect x={x-cw/2} y={yVol(b.v)} width={cw} height={(H-botH)-yVol(b.v)} fill={col} opacity=".26" rx=".5"/>
            </g>
          );
        })}
        {/* current price dashed line + tag */}
        <line x1={0} x2={plotW} y1={lastY} y2={lastY} stroke="rgba(45,212,191,.55)" strokeWidth="1" strokeDasharray="4 3"/>
        <g>
          <rect x={W-axisW} y={lastY-9} width={axisW} height={18} rx="3" fill="#15b8a6"/>
          <text x={W-axisW/2} y={lastY+3.5} fill="#04110f" fontSize="10.5" fontWeight="600" textAnchor="middle" fontFamily="var(--mono)">{stock.price.toFixed(2)}</text>
        </g>
        {/* date labels */}
        {lab.map((l,i)=>(
          <text key={i} x={Math.min(Math.max(l.x,14),plotW-14)} y={H-7} fill="#586069" fontSize="10.5" textAnchor="middle" fontFamily="var(--mono)">{l.text}</text>
        ))}
        {/* crosshair */}
        {hi!=null&&(
          <g pointerEvents="none">
            <line x1={xCenter(hi)} x2={xCenter(hi)} y1={0} y2={H-botH} stroke="#3a4654" strokeWidth="1" strokeDasharray="3 3"/>
            {mouseY!=null&&mouseY<H-botH&&(
              <g>
                <line x1={0} x2={plotW} y1={mouseY} y2={mouseY} stroke="#3a4654" strokeWidth="1" strokeDasharray="3 3"/>
                <rect x={W-axisW} y={mouseY-9} width={axisW} height={18} rx="3" fill="#2a3441"/>
                <text x={W-axisW/2} y={mouseY+3.5} fill="#e8ecf2" fontSize="10.5" textAnchor="middle" fontFamily="var(--mono)">{hoverPrice.toFixed(2)}</text>
              </g>
            )}
          </g>
        )}
      </svg>
    </div>
  );
}

// ---------- Sparkline ----------
function Sparkline({symbol,up,w=120,h=40,seed=''}){
  const pts=useMemo(()=>{
    const r=mulberry32(hashStr(symbol+seed));const n=30;const a=[];let p=50+r()*20;
    for(let i=0;i<n;i++){p+=(r()-0.5)*10;a.push(p)}
    // bias end direction
    const adj=up?1:-1;for(let i=0;i<n;i++)a[i]+=adj*(i/n)*12;
    return a;
  },[symbol,seed,up]);
  const min=Math.min(...pts),max=Math.max(...pts);
  const d=pts.map((v,i)=>`${i===0?'M':'L'}${(i/(pts.length-1)*w).toFixed(1)} ${(h-((v-min)/(max-min||1))*(h-4)-2).toFixed(1)}`).join(' ');
  const col=up?'#3ad07f':'#f0676b';
  const gid='sg'+symbol+seed;
  return(
    <svg width={w} height={h} style={{display:'block',overflow:'visible'}}>
      <defs><linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={col} stopOpacity=".28"/><stop offset="1" stopColor={col} stopOpacity="0"/>
      </linearGradient></defs>
      <path d={`${d} L ${w} ${h} L 0 ${h} Z`} fill={`url(#${gid})`}/>
      <path d={d} fill="none" stroke={col} strokeWidth="1.5" strokeLinejoin="round"/>
    </svg>
  );
}

// ---------- Donut ----------
function Donut({segments,size=128,thick=18}){
  const r=(size-thick)/2,cx=size/2,cy=size/2,C=2*Math.PI*r;
  let acc=0;
  return(
    <svg width={size} height={size}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#161c25" strokeWidth={thick}/>
      {segments.map((s,i)=>{
        const frac=s.v/100;const dash=C*frac;const off=C*(1-acc-frac);
        acc+=frac;
        return <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={s.color} strokeWidth={thick}
          strokeDasharray={`${dash} ${C-dash}`} strokeDashoffset={off}
          transform={`rotate(-90 ${cx} ${cy})`} strokeLinecap="butt"/>;
      })}
    </svg>
  );
}

Object.assign(window,{CandleChart,Sparkline,Donut,useWidth});
