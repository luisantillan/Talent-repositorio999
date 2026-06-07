/* Strata — mock market data. Plain JS, attached to window.STRATA. */
(function () {
  // ---- seeded RNG (mulberry32) ----
  function hashStr(s) {
    let h = 1779033703 ^ s.length;
    for (let i = 0; i < s.length; i++) {
      h = Math.imul(h ^ s.charCodeAt(i), 3432918353);
      h = (h << 13) | (h >>> 19);
    }
    return h >>> 0;
  }
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // ---- ticker universe ----
  const TICKERS = [
    { sym: "AAPL", name: "Apple Inc.", ex: "NASDAQ", sector: "Technology", tags: ["Technology", "Consumer Electronics"], price: 309.03, prevClose: 304.89, open: 306.20, dayHigh: 311.30, dayLow: 305.45, vol: 58.21e6, avgVol: 63.72e6, mcap: 4.74e12, w52h: 327.85, w52l: 164.08, logo: "" },
    { sym: "NVDA", name: "NVIDIA Corp.", ex: "NASDAQ", sector: "Technology", tags: ["Technology", "Semiconductors"], price: 148.22, prevClose: 145.05, open: 145.80, dayHigh: 149.90, dayLow: 145.10, vol: 201.4e6, avgVol: 224.1e6, mcap: 3.62e12, w52h: 153.13, w52l: 86.62, logo: "" },
    { sym: "MSFT", name: "Microsoft Corp.", ex: "NASDAQ", sector: "Technology", tags: ["Technology", "Software"], price: 472.10, prevClose: 468.30, open: 469.00, dayHigh: 474.20, dayLow: 467.55, vol: 18.9e6, avgVol: 21.3e6, mcap: 3.51e12, w52h: 481.00, w52l: 366.50, logo: "" },
    { sym: "GOOGL", name: "Alphabet Inc.", ex: "NASDAQ", sector: "Communication Svcs", tags: ["Communication", "Internet"], price: 181.44, prevClose: 183.10, open: 182.90, dayHigh: 183.40, dayLow: 180.20, vol: 24.6e6, avgVol: 28.0e6, mcap: 2.24e12, w52h: 208.70, w52l: 142.66, logo: "" },
    { sym: "AMZN", name: "Amazon.com Inc.", ex: "NASDAQ", sector: "Consumer Disc.", tags: ["Consumer", "E-commerce"], price: 214.88, prevClose: 211.20, open: 211.90, dayHigh: 216.10, dayLow: 211.05, vol: 33.1e6, avgVol: 39.4e6, mcap: 2.25e12, w52h: 242.52, w52l: 151.61, logo: "" },
    { sym: "TSLA", name: "Tesla, Inc.", ex: "NASDAQ", sector: "Consumer Disc.", tags: ["Automotive", "Clean Energy"], price: 256.73, prevClose: 268.40, open: 266.10, dayHigh: 267.30, dayLow: 254.10, vol: 96.8e6, avgVol: 102.5e6, mcap: 0.82e12, w52h: 488.54, w52l: 138.80, logo: "" },
    { sym: "META", name: "Meta Platforms", ex: "NASDAQ", sector: "Communication Svcs", tags: ["Communication", "Social Media"], price: 612.34, prevClose: 605.10, open: 606.20, dayHigh: 615.90, dayLow: 604.40, vol: 12.7e6, avgVol: 15.1e6, mcap: 1.55e12, w52h: 740.91, w52l: 442.65, logo: "" },
    { sym: "AMD", name: "Adv. Micro Devices", ex: "NASDAQ", sector: "Technology", tags: ["Technology", "Semiconductors"], price: 122.45, prevClose: 124.80, open: 124.30, dayHigh: 125.10, dayLow: 121.30, vol: 41.2e6, avgVol: 45.8e6, mcap: 0.20e12, w52h: 187.28, w52l: 76.48, logo: "" },
    { sym: "JPM", name: "JPMorgan Chase", ex: "NYSE", sector: "Financials", tags: ["Financials", "Banking"], price: 268.12, prevClose: 266.05, open: 266.50, dayHigh: 269.40, dayLow: 265.80, vol: 7.9e6, avgVol: 9.2e6, mcap: 0.75e12, w52h: 280.25, w52l: 190.90, logo: "" },
    { sym: "NFLX", name: "Netflix, Inc.", ex: "NASDAQ", sector: "Communication Svcs", tags: ["Communication", "Streaming"], price: 1042.60, prevClose: 1028.00, open: 1030.10, dayHigh: 1051.20, dayLow: 1026.40, vol: 3.4e6, avgVol: 4.1e6, mcap: 0.45e12, w52h: 1064.50, w52l: 588.41, logo: "" },
  ];

  // derive change fields + extra metrics
  TICKERS.forEach((t) => {
    t.change = +(t.price - t.prevClose).toFixed(2);
    t.changePct = +((t.change / t.prevClose) * 100).toFixed(2);
    const r = mulberry32(hashStr(t.sym + "metrics"));
    t.metrics = {
      peTTM: +(15 + r() * 30).toFixed(2),
      fwdPE: +(12 + r() * 25).toFixed(2),
      epsTTM: +(t.price / (15 + r() * 20)).toFixed(2),
      revenueTTM: t.mcap / (4 + r() * 12),
      revGrowth: +((r() * 28 - 4)).toFixed(2),
      grossMargin: +(34 + r() * 35).toFixed(2),
      roe: +(12 + r() * 160).toFixed(2),
      debtEquity: +(0.2 + r() * 2).toFixed(2),
      divYield: +(r() * 1.6).toFixed(2),
      beta: +(0.8 + r() * 1.2).toFixed(2),
      sharesOut: t.mcap / t.price,
      float: (t.mcap / t.price) * (0.9 + r() * 0.09),
      shortInt: +(r() * 4).toFixed(2),
      shortChg: +((r() * 24 - 12)).toFixed(2),
    };
    // analyst ratings
    const buy = 6 + Math.floor(r() * 26);
    const hold = 2 + Math.floor(r() * 10);
    const sell = Math.floor(r() * 5);
    t.analyst = { buy, hold, sell, total: buy + hold + sell };
    // ownership split
    const inst = 50 + r() * 25;
    const insider = r() * 12;
    t.ownership = { inst: +inst.toFixed(2), insider: +insider.toFixed(2), retail: +(100 - inst - insider).toFixed(2) };
    // multi-horizon performance
    t.perf = {
      "1D": t.changePct,
      "5D": +((r() * 8 - 3)).toFixed(2),
      "1M": +((r() * 18 - 6)).toFixed(2),
      "3M": +((r() * 26 - 8)).toFixed(2),
      "YTD": +((r() * 40 - 10)).toFixed(2),
      "1Y": +((r() * 80 - 15)).toFixed(2),
      "5Y": +((r() * 320 - 30)).toFixed(2),
    };
  });

  const BY_SYM = Object.fromEntries(TICKERS.map((t) => [t.sym, t]));

  // ---- OHLC series generator ----
  const RANGE_BARS = { "1D": 78, "5D": 65, "1M": 22, "3M": 64, "6M": 128, "YTD": 110, "1Y": 252, "5Y": 260, "All": 320 };
  function genSeries(sym, range) {
    const t = BY_SYM[sym];
    const n = RANGE_BARS[range] || 64;
    const rnd = mulberry32(hashStr(sym + range));
    const end = t.price;
    // target a start so the series ends near current price, magnitude scaled by range
    const spanPct = { "1D": 0.018, "5D": 0.04, "1M": 0.08, "3M": 0.16, "6M": 0.26, "YTD": 0.24, "1Y": 0.42, "5Y": 1.6, "All": 2.4 }[range] || 0.12;
    let drift = (rnd() - 0.42) * spanPct;
    let start = end / (1 + drift);
    const bars = [];
    let prevC = start;
    const vol0 = t.avgVol;
    for (let i = 0; i < n; i++) {
      const prog = i / (n - 1);
      // blend a smooth path toward end + noise
      const path = start + (end - start) * prog;
      const noise = (rnd() - 0.5) * end * spanPct * 0.22;
      const o = i === 0 ? start : prevC;
      let c = path + noise;
      // pull final bar exactly to price
      if (i === n - 1) c = end;
      const hi = Math.max(o, c) * (1 + rnd() * spanPct * 0.12);
      const lo = Math.min(o, c) * (1 - rnd() * spanPct * 0.12);
      const v = vol0 * (0.45 + rnd() * 1.3) / (range === "1D" || range === "5D" ? 6 : 1);
      bars.push({ i, o: +o.toFixed(2), h: +hi.toFixed(2), l: +lo.toFixed(2), c: +c.toFixed(2), v });
      prevC = c;
    }
    return bars;
  }

  // x-axis tick labels per range
  function axisLabels(range) {
    if (range === "1D") return ["10:00", "11:00", "12:00", "13:00", "14:00", "15:00"];
    if (range === "5D") return ["Mon", "Tue", "Wed", "Thu", "Fri"];
    if (range === "1M") return ["May 19", "May 26", "Jun 2"];
    if (range === "3M") return ["Mar", "Apr", "May", "Jun"];
    if (range === "6M") return ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
    if (range === "YTD") return ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
    if (range === "1Y") return ["Jul", "Sep", "Nov", "Jan", "Mar", "May"];
    if (range === "5Y") return ["2021", "2022", "2023", "2024", "2025"];
    return ["2018", "2020", "2022", "2024"];
  }

  // ---- portfolio (user holdings) ----
  const HOLDINGS = [
    { sym: "AAPL", shares: 120, avgCost: 198.40 },
    { sym: "NVDA", shares: 340, avgCost: 92.15 },
    { sym: "MSFT", shares: 65, avgCost: 410.20 },
    { sym: "AMZN", shares: 80, avgCost: 178.60 },
    { sym: "TSLA", shares: 150, avgCost: 290.10 },
    { sym: "JPM", shares: 90, avgCost: 221.30 },
  ];
  HOLDINGS.forEach((h) => {
    const t = BY_SYM[h.sym];
    h.value = h.shares * t.price;
    h.cost = h.shares * h.avgCost;
    h.gain = h.value - h.cost;
    h.gainPct = (h.gain / h.cost) * 100;
    h.dayChange = h.shares * t.change;
  });
  const WATCHLIST = ["GOOGL", "META", "AMD", "NFLX"];

  // ---- portfolio equity curve (1Y of daily-ish points) ----
  function portfolioCurve() {
    const rnd = mulberry32(hashStr("portfolio-curve"));
    const totalNow = HOLDINGS.reduce((s, h) => s + h.value, 0);
    const n = 120;
    const pts = [];
    let v = totalNow * 0.74;
    for (let i = 0; i < n; i++) {
      const prog = i / (n - 1);
      const path = totalNow * (0.74 + 0.26 * prog);
      v = path + (rnd() - 0.5) * totalNow * 0.05;
      if (i === n - 1) v = totalNow;
      pts.push(+v.toFixed(2));
    }
    return pts;
  }

  // ---- news ----
  const NEWS = [
    { sym: "AAPL", t: "Apple unveils new AI features across iPhone, iPad and Mac", src: "Reuters", time: "May 16, 2025", cat: "Product" },
    { sym: "AAPL", t: "Apple services revenue hits all-time high in Q2 2025", src: "Bloomberg", time: "May 15, 2025", cat: "Earnings" },
    { sym: "AAPL", t: "Apple expands U.S. manufacturing investment with new Texas facility", src: "CNBC", time: "May 14, 2025", cat: "Operations" },
    { sym: "NVDA", t: "NVIDIA data-center demand outpaces supply into 2026, says CEO", src: "Reuters", time: "May 16, 2025", cat: "Markets" },
    { sym: "TSLA", t: "Tesla deliveries slip as competition intensifies in China", src: "Bloomberg", time: "May 15, 2025", cat: "Markets" },
    { sym: "MSFT", t: "Microsoft Copilot adoption accelerates among enterprise clients", src: "WSJ", time: "May 14, 2025", cat: "Product" },
    { sym: "META", t: "Meta Reality Labs narrows losses ahead of new headset launch", src: "The Verge", time: "May 13, 2025", cat: "Product" },
  ];

  // ---- market indices for top bar ticker ----
  const INDICES = [
    { name: "S&P 500", val: 5942.18, chg: 0.62 },
    { name: "Nasdaq", val: 19284.40, chg: 0.94 },
    { name: "Dow", val: 42360.10, chg: 0.21 },
    { name: "VIX", val: 13.84, chg: -3.10 },
    { name: "10Y", val: 4.28, chg: 0.04 },
    { name: "BTC", val: 71240, chg: 1.82 },
  ];

  window.STRATA = {
    TICKERS, BY_SYM, HOLDINGS, WATCHLIST, NEWS, INDICES,
    genSeries, axisLabels, portfolioCurve, RANGE_BARS,
  };
})();
