/* ============ TraderPro — data & series generators ============ */

// seeded PRNG (mulberry32)
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function hashStr(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}

// Generate daily OHLC bars ending at `price`, spanning `days`
function genDaily(symbol, price, week52Low, week52High, days){
  const rnd=mulberry32(hashStr(symbol)+days);
  const bars=[];
  let p=price;
  // walk backwards from current price
  const vol=(week52High-week52Low)/price; // relative volatility
  for(let i=0;i<days;i++){
    const drift=(rnd()-0.5)*p*vol*0.10;
    const close=p;
    const open=close+(rnd()-0.5)*p*vol*0.04 - drift*0.4;
    const hi=Math.max(open,close)+rnd()*p*vol*0.03;
    const lo=Math.min(open,close)-rnd()*p*vol*0.03;
    const v=Math.floor((0.5+rnd())* (40+rnd()*80))*1e6/100;
    bars.push({o:open,h:hi,l:lo,c:close,v});
    p=open - drift; // previous day's close ~ this open
  }
  bars.reverse();
  // clamp into 52w range softly + ensure last close == price
  const lastC=bars[bars.length-1].c;
  const shift=price-lastC;
  for(const b of bars){b.o+=shift*0.0;b.c+=0;}
  bars[bars.length-1].c=price;
  return bars;
}

// Build timeframe-specific series from a long daily base
const TF_DAYS={'1D':1,'5D':5,'1M':22,'3M':66,'6M':130,'YTD':108,'1Y':252,'5Y':252,'All':252};
function seriesFor(stock,tf){
  const base=genDaily(stock.symbol,stock.price,stock.week52Low,stock.week52High,260);
  if(tf==='1D'){
    // intraday: 78 five-min bars
    const rnd=mulberry32(hashStr(stock.symbol)+'1D');
    const bars=[];let p=stock.prevClose;const v=Math.abs(stock.price-stock.prevClose)*1.8+stock.price*0.004;
    for(let i=0;i<78;i++){
      const close=p+(rnd()-0.5)*v;
      const open=p;
      const hi=Math.max(open,close)+rnd()*v*0.6;
      const lo=Math.min(open,close)-rnd()*v*0.6;
      bars.push({o:open,h:hi,l:lo,c:close,v:Math.floor((0.4+rnd())*1.2e6)});
      p=close;
    }
    bars[bars.length-1].c=stock.price;
    return bars;
  }
  if(tf==='5D'){
    const rnd=mulberry32(hashStr(stock.symbol)+'5D');
    const bars=[];let p=stock.price-stock.change*1.4;const v=stock.price*0.012;
    for(let i=0;i<5*13;i++){const close=p+(rnd()-0.5)*v;const open=p;const hi=Math.max(open,close)+rnd()*v*0.5;const lo=Math.min(open,close)-rnd()*v*0.5;bars.push({o:open,h:hi,l:lo,c:close,v:Math.floor((0.4+rnd())*1.4e6)});p=close}
    bars[bars.length-1].c=stock.price;return bars;
  }
  const n=TF_DAYS[tf]||252;
  let slice=base.slice(Math.max(0,base.length-n));
  if(tf==='5Y'||tf==='All'){
    // weekly bars over ~5y: build longer base
    const long=genDaily(stock.symbol+'L',stock.price,stock.week52Low*0.62,stock.week52High*1.05,260);
    slice=long;
  }
  return slice;
}

// axis date labels
const MONTHS=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// ---------- helpers to fabricate plausible detail ----------
function pf(seed,lo,hi){const r=mulberry32(hashStr(seed));return lo+r()*(hi-lo)}
function signed(v){return (v>=0?'+':'')+v.toFixed(2)}
function fmtB(n){if(n>=1e12)return (n/1e12).toFixed(2)+'T';if(n>=1e9)return (n/1e9).toFixed(2)+'B';if(n>=1e6)return (n/1e6).toFixed(2)+'M';return n.toFixed(2)}

function makeStock(s){
  const chgPct=s.change/(s.price-s.change)*100;
  const r=mulberry32(hashStr(s.symbol));
  const performance=s.performance||{
    '1D':+chgPct.toFixed(2),'5D':+(pf(s.symbol+'5',-4,6)).toFixed(2),'1M':+(pf(s.symbol+'m',-8,12)).toFixed(2),
    '3M':+(pf(s.symbol+'3',-12,18)).toFixed(2),'YTD':+(pf(s.symbol+'y',-15,30)).toFixed(2),
    '1Y':+(pf(s.symbol+'1',-20,60)).toFixed(2),'5Y':+(pf(s.symbol+'5y',10,400)).toFixed(2)
  };
  return Object.assign({
    chgPct:+chgPct.toFixed(2),
    performance,
    sparkUp:chgPct>=0,
  },s);
}

const RAW=[
 {symbol:'AAPL',name:'Apple Inc.',sector:'Technology',industry:'Consumer Electronics',exchange:'NASDAQ',color:'#e8ecf2',bg:'#1a1f27',letter:'',
  price:309.03,change:4.14,prevClose:304.89,open:306.20,high:311.30,low:305.45,
  volume:58.21e6,avgVol:63.72e6,marketCap:4.74e12,week52Low:164.08,week52High:327.85,
  metrics:{'P/E (TTM)':'28.42','Forward P/E':'25.15','EPS (TTM)':'10.87','Revenue (TTM)':'394.33B','Revenue Growth (YoY)':'5.14%','Gross Margin':'46.48%','ROE (TTM)':'164.95%','Debt / Equity':'1.73','Dividend Yield (TTM)':'0.47%'},
  keyStats:{'Shares Outstanding':'15.33B','Float':'15.28B','Beta (5Y)':'1.19','Short Interest':'0.64%','Short Interest Change':'-8.21%','52W High':'327.85','52W Low':'164.08'},
  ownership:{inst:62.45,insider:7.48,retail:30.07},
  analyst:{rating:'Strong Buy',count:36,buy:23,hold:9,sell:4},
  performance:{'1D':1.36,'5D':2.18,'1M':8.37,'3M':3.92,'YTD':12.21,'1Y':25.84,'5Y':154.62},
  news:[
   {t:'Apple unveils new AI features across iPhone, iPad and Mac',d:'May 16, 2025',s:'Reuters'},
   {t:'Apple services revenue hits all-time high in Q2 2025',d:'May 15, 2025',s:'Bloomberg'},
   {t:'Apple expands U.S. manufacturing investment with new Texas facility',d:'May 14, 2025',s:'CNBC'}]},

 {symbol:'NVDA',name:'NVIDIA Corporation',sector:'Technology',industry:'Semiconductors',exchange:'NASDAQ',color:'#76b900',bg:'#16210a',letter:'N',
  price:131.26,change:3.88,prevClose:127.38,open:128.10,high:132.40,low:127.90,
  volume:241.6e6,avgVol:268.4e6,marketCap:3.23e12,week52Low:66.25,week52High:153.13,
  analyst:{rating:'Strong Buy',count:54,buy:46,hold:7,sell:1}},

 {symbol:'MSFT',name:'Microsoft Corporation',sector:'Technology',industry:'Software—Infrastructure',exchange:'NASDAQ',color:'#5bbcf0',bg:'#0a1a24',letter:'M',
  price:452.18,change:-1.92,prevClose:454.10,open:453.60,high:455.20,low:450.10,
  volume:18.9e6,avgVol:22.1e6,marketCap:3.36e12,week52Low:366.50,week52High:468.35,
  analyst:{rating:'Buy',count:48,buy:39,hold:8,sell:1}},

 {symbol:'GOOGL',name:'Alphabet Inc.',sector:'Communication Svcs',industry:'Internet Content',exchange:'NASDAQ',color:'#f0a93a',bg:'#211806',letter:'G',
  price:176.45,change:2.31,prevClose:174.14,open:174.80,high:177.20,low:174.30,
  volume:24.6e6,avgVol:27.8e6,marketCap:2.17e12,week52Low:130.67,week52High:191.75,
  analyst:{rating:'Strong Buy',count:42,buy:34,hold:7,sell:1}},

 {symbol:'AMZN',name:'Amazon.com Inc.',sector:'Consumer Disc.',industry:'Internet Retail',exchange:'NASDAQ',color:'#f0a93a',bg:'#211806',letter:'A',
  price:201.88,change:-3.14,prevClose:205.02,open:204.50,high:205.10,low:200.90,
  volume:39.2e6,avgVol:44.6e6,marketCap:2.12e12,week52Low:151.61,week52High:215.90,
  analyst:{rating:'Buy',count:46,buy:40,hold:5,sell:1}},

 {symbol:'META',name:'Meta Platforms Inc.',sector:'Communication Svcs',industry:'Internet Content',exchange:'NASDAQ',color:'#5b8df0',bg:'#0a1224',letter:'M',
  price:618.74,change:9.42,prevClose:609.32,open:611.00,high:621.50,low:610.20,
  volume:14.1e6,avgVol:16.8e6,marketCap:1.57e12,week52Low:414.50,week52High:638.40,
  analyst:{rating:'Strong Buy',count:50,buy:43,hold:6,sell:1}},

 {symbol:'TSLA',name:'Tesla, Inc.',sector:'Consumer Disc.',industry:'Auto Manufacturers',exchange:'NASDAQ',color:'#f06363',bg:'#210b0c',letter:'T',
  price:342.69,change:-8.27,prevClose:350.96,open:349.80,high:351.20,low:339.50,
  volume:98.4e6,avgVol:104.2e6,marketCap:1.10e12,week52Low:138.80,week52High:488.54,
  analyst:{rating:'Hold',count:38,buy:14,hold:16,sell:8}},

 {symbol:'AMD',name:'Advanced Micro Devices',sector:'Technology',industry:'Semiconductors',exchange:'NASDAQ',color:'#f0676b',bg:'#210b0c',letter:'A',
  price:118.92,change:1.74,prevClose:117.18,open:117.40,high:120.10,low:116.90,
  volume:42.7e6,avgVol:48.3e6,marketCap:192.4e9,week52Low:94.20,week52High:227.30,
  analyst:{rating:'Buy',count:40,buy:30,hold:9,sell:1}},

 {symbol:'NFLX',name:'Netflix, Inc.',sector:'Communication Svcs',industry:'Entertainment',exchange:'NASDAQ',color:'#f0676b',bg:'#210b0c',letter:'N',
  price:1042.16,change:14.88,prevClose:1027.28,open:1030.00,high:1048.20,low:1028.40,
  volume:3.2e6,avgVol:4.1e6,marketCap:445.7e9,week52Low:587.04,week52High:1064.50,
  analyst:{rating:'Buy',count:44,buy:33,hold:9,sell:2}},

 {symbol:'JPM',name:'JPMorgan Chase & Co.',sector:'Financials',industry:'Banks—Diversified',exchange:'NYSE',color:'#5b8df0',bg:'#0a1224',letter:'J',
  price:248.31,change:1.12,prevClose:247.19,open:247.50,high:249.40,low:246.80,
  volume:8.4e6,avgVol:9.9e6,marketCap:704.2e9,week52Low:179.20,week52High:254.31,
  analyst:{rating:'Buy',count:34,buy:24,hold:9,sell:1}},

 {symbol:'V',name:'Visa Inc.',sector:'Financials',industry:'Credit Services',exchange:'NYSE',color:'#5b8df0',bg:'#0a1224',letter:'V',
  price:332.07,change:-0.84,prevClose:332.91,open:332.60,high:334.10,low:330.90,
  volume:6.1e6,avgVol:7.0e6,marketCap:651.8e9,week52Low:252.70,week52High:345.20,
  analyst:{rating:'Strong Buy',count:36,buy:29,hold:6,sell:1}},

 {symbol:'JNJ',name:'Johnson & Johnson',sector:'Healthcare',industry:'Drug Manufacturers',exchange:'NYSE',color:'#f06363',bg:'#210b0c',letter:'J',
  price:152.44,change:0.61,prevClose:151.83,open:151.90,high:153.10,low:151.40,
  volume:7.3e6,avgVol:8.2e6,marketCap:367.1e9,week52Low:140.68,week52High:169.99,
  analyst:{rating:'Hold',count:28,buy:12,hold:14,sell:2}},

 {symbol:'XOM',name:'Exxon Mobil Corp.',sector:'Energy',industry:'Oil & Gas Integrated',exchange:'NYSE',color:'#f0676b',bg:'#210b0c',letter:'X',
  price:114.78,change:2.06,prevClose:112.72,open:112.90,high:115.30,low:112.60,
  volume:15.8e6,avgVol:17.4e6,marketCap:507.3e9,week52Low:95.77,week52High:126.34,
  analyst:{rating:'Buy',count:30,buy:19,hold:10,sell:1}},

 {symbol:'WMT',name:'Walmart Inc.',sector:'Consumer Staples',industry:'Discount Stores',exchange:'NYSE',color:'#5bbcf0',bg:'#0a1a24',letter:'W',
  price:98.62,change:0.93,prevClose:97.69,open:97.80,high:99.10,low:97.50,
  volume:19.2e6,avgVol:21.6e6,marketCap:793.4e9,week52Low:65.18,week52High:105.30,
  analyst:{rating:'Strong Buy',count:38,buy:32,hold:5,sell:1}},

 {symbol:'DIS',name:'Walt Disney Co.',sector:'Communication Svcs',industry:'Entertainment',exchange:'NYSE',color:'#5b8df0',bg:'#0a1224',letter:'D',
  price:112.35,change:-1.48,prevClose:113.83,open:113.60,high:114.20,low:111.90,
  volume:9.6e6,avgVol:11.1e6,marketCap:203.6e9,week52Low:83.91,week52High:123.74,
  analyst:{rating:'Buy',count:32,buy:22,hold:9,sell:1}},

 {symbol:'BA',name:'Boeing Co.',sector:'Industrials',industry:'Aerospace & Defense',exchange:'NYSE',color:'#5b8df0',bg:'#0a1224',letter:'B',
  price:178.94,change:3.27,prevClose:175.67,open:176.00,high:180.20,low:175.80,
  volume:12.4e6,avgVol:13.8e6,marketCap:134.9e9,week52Low:137.03,week52High:218.62,
  analyst:{rating:'Hold',count:26,buy:11,hold:12,sell:3}},
];

// fill defaults for non-AAPL detail panes
function fillDetail(s){
  if(!s.metrics){
    const r=mulberry32(hashStr(s.symbol));
    s.metrics={
      'P/E (TTM)':(10+r()*40).toFixed(2),'Forward P/E':(9+r()*32).toFixed(2),'EPS (TTM)':(2+r()*22).toFixed(2),
      'Revenue (TTM)':fmtB(s.marketCap*(0.1+r()*0.25)),'Revenue Growth (YoY)':((r()*30-3).toFixed(2))+'%',
      'Gross Margin':(28+r()*45).toFixed(2)+'%','ROE (TTM)':(8+r()*50).toFixed(2)+'%','Debt / Equity':(0.2+r()*2).toFixed(2),
      'Dividend Yield (TTM)':(r()*2.4).toFixed(2)+'%'};
  }
  if(!s.keyStats){
    const r=mulberry32(hashStr(s.symbol)+9);
    s.keyStats={'Shares Outstanding':fmtB(s.marketCap/s.price),'Float':fmtB(s.marketCap/s.price*0.97),
      'Beta (5Y)':(0.6+r()*1.4).toFixed(2),'Short Interest':(r()*4).toFixed(2)+'%','Short Interest Change':((r()*30-15).toFixed(2))+'%',
      '52W High':s.week52High.toFixed(2),'52W Low':s.week52Low.toFixed(2)};
  }
  if(!s.ownership){const r=mulberry32(hashStr(s.symbol)+3);const inst=55+r()*25;const insider=2+r()*10;s.ownership={inst:+inst.toFixed(2),insider:+insider.toFixed(2),retail:+(100-inst-insider).toFixed(2)}}
  if(!s.news){
    s.news=[
     {t:s.name.split(/[ ,]/)[0]+' posts quarterly results above analyst expectations',d:'May 16, 2025',s:'Reuters'},
     {t:'Analysts raise price targets on '+s.symbol+' after guidance update',d:'May 15, 2025',s:'Bloomberg'},
     {t:s.name.split(/[ ,]/)[0]+' announces strategic expansion into new markets',d:'May 14, 2025',s:'CNBC'}];
  }
  return s;
}

const STOCKS=RAW.map(makeStock).map(fillDetail);
const BY_SYM={};STOCKS.forEach(s=>BY_SYM[s.symbol]=s);

const SECTORS=['All','Technology','Communication Svcs','Consumer Disc.','Financials','Healthcare','Energy','Consumer Staples','Industrials'];

const INDICES=[
 {nm:'S&P 500',v:'5,872.34',c:'+0.62%',up:true},
 {nm:'Nasdaq 100',v:'21,043.88',c:'+0.94%',up:true},
 {nm:'Dow Jones',v:'42,318.61',c:'-0.18%',up:false},
 {nm:'Russell 2000',v:'2,318.07',c:'+0.41%',up:true},
];

function fmtVol(n){if(n>=1e9)return (n/1e9).toFixed(2)+'B';if(n>=1e6)return (n/1e6).toFixed(2)+'M';if(n>=1e3)return (n/1e3).toFixed(1)+'K';return ''+n}
function fmtCap(n){if(n>=1e12)return (n/1e12).toFixed(2)+'T';if(n>=1e9)return (n/1e9).toFixed(1)+'B';return (n/1e6).toFixed(0)+'M'}

Object.assign(window,{STOCKS,BY_SYM,SECTORS,INDICES,seriesFor,MONTHS,fmtVol,fmtCap,fmtB,signed,mulberry32,hashStr});
