/* Strata — app shell, routing, search, live ticks. */
const { useState: uS, useEffect: uE, useRef: uR, useMemo: uM } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": ["oklch(0.66 0.17 285)", "oklch(0.78 0.13 75)"],
  "livePrices": true,
  "showTape": true
}/*EDITMODE-END*/;

function MarketTape() {
  return (
    <div className="tape">
      <div className="tape-inner">
        {STRATA.INDICES.concat(STRATA.INDICES).map((ix, i) => (
          <span key={i} className="tape-item">
            <span style={{ color: "var(--text-mute)" }}>{ix.name}</span>
            <span style={{ fontWeight: 600 }}>{ix.val.toLocaleString("en-US", { minimumFractionDigits: ix.val < 100 ? 2 : 0, maximumFractionDigits: 2 })}</span>
            <span style={{ color: dirColor(ix.chg), fontSize: 11.5 }}>{fmtPct(ix.chg)}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function SearchBox({ onOpen }) {
  const [q, setQ] = uS("");
  const [open, setOpen] = uS(false);
  const ref = uR(null);
  uE(() => {
    function h(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  const results = uM(() => {
    const s = q.trim().toLowerCase();
    const list = s ? STRATA.TICKERS.filter((t) => t.sym.toLowerCase().includes(s) || t.name.toLowerCase().includes(s)) : STRATA.TICKERS.slice(0, 6);
    return list.slice(0, 7);
  }, [q]);
  return (
    <div className="search" ref={ref}>
      <Icon name="search" size={16} style={{ color: "var(--text-mute)", flexShrink: 0 }} />
      <input value={q} onChange={(e) => setQ(e.target.value)} onFocus={() => setOpen(true)} placeholder="Search ticker or company" />
      {open && (
        <div className="search-pop">
          <div style={{ padding: "7px 12px", fontSize: 10.5, color: "var(--text-mute)", letterSpacing: ".06em", textTransform: "uppercase" }}>{q ? "Results" : "Trending"}</div>
          {results.map((t) => (
            <button key={t.sym} className="search-item" onMouseDown={() => { onOpen(t.sym); setOpen(false); setQ(""); }}>
              <span className="mini-badge" style={{ background: `oklch(0.3 0.05 ${SECTOR_HUE[t.sector] || 265})`, color: `oklch(0.88 0.08 ${SECTOR_HUE[t.sector] || 265})` }}>{t.sym.slice(0, 2)}</span>
              <div style={{ flex: 1, textAlign: "left", minWidth: 0 }}>
                <div style={{ fontFamily: "var(--mono)", fontWeight: 700, fontSize: 12.5 }}>{t.sym}</div>
                <div style={{ fontSize: 11, color: "var(--text-mute)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.name}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontFamily: "var(--mono)", fontSize: 12.5, fontWeight: 600 }}>{fmtPrice(t.price)}</div>
                <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: dirColor(t.changePct) }}>{fmtPct(t.changePct)}</div>
              </div>
            </button>
          ))}
          {!results.length && <div style={{ padding: "16px 12px", fontSize: 12.5, color: "var(--text-mute)" }}>No matches for “{q}”.</div>}
        </div>
      )}
    </div>
  );
}

const NAV = [
  { label: "Trade", view: "detail" },
  { label: "Markets", view: "dashboard" },
  { label: "Watchlist", view: "dashboard" },
  { label: "Scan", view: "dashboard" },
  { label: "News", view: "dashboard" },
  { label: "Tools", view: "dashboard" },
];

function TopNav({ view, onHome, onOpen, lastSym }) {
  return (
    <header className="nav">
      <div className="nav-left">
        <button className="brand" onClick={onHome}><Logo size={24} /><span>Strata</span></button>
        <nav className="nav-items">
          {NAV.map((n) => (
            <button key={n.label} className={"nav-item" + ((n.label === "Markets" && view === "dashboard") || (n.label === "Trade" && view === "detail") ? " active" : "")}
              onClick={() => n.view === "detail" ? onOpen(lastSym) : onHome()}>{n.label}</button>
          ))}
        </nav>
      </div>
      <div className="nav-right">
        <SearchBox onOpen={onOpen} />
        <button className="icon-btn"><Icon name="bell" size={18} /><span className="dot" /></button>
        <button className="icon-btn"><Icon name="gear" size={18} /></button>
        <button className="icon-btn"><Icon name="info" size={18} /></button>
        <button className={"pf-btn" + (view === "dashboard" ? " active" : "")} onClick={onHome}><Icon name="wallet" size={16} /> Portfolio</button>
      </div>
    </header>
  );
}

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [view, setView] = uS("dashboard"); // "dashboard" | "detail"
  const [sym, setSym] = uS("AAPL");
  const [portfolio, setPortfolio] = uS(() => new Set(STRATA.HOLDINGS.map((h) => h.sym)));
  const [watchlist, setWatchlist] = uS(() => [...STRATA.WATCHLIST]);
  const [, setTick] = uS(0);

  // apply accent
  uE(() => {
    const a = Array.isArray(t.accent) ? t.accent : [t.accent, "oklch(0.78 0.13 75)"];
    document.documentElement.style.setProperty("--accent", a[0]);
    document.documentElement.style.setProperty("--accent-2", a[1] || "oklch(0.78 0.13 75)");
  }, [t.accent]);

  // live price ticks (after-hours drift)
  uE(() => {
    if (!t.livePrices) return;
    const id = setInterval(() => {
      STRATA.TICKERS.forEach((tk) => {
        const drift = (Math.random() - 0.5) * tk.price * 0.0012;
        tk.price = +(tk.price + drift).toFixed(2);
        tk.change = +(tk.price - tk.prevClose).toFixed(2);
        tk.changePct = +((tk.change / tk.prevClose) * 100).toFixed(2);
        tk.perf["1D"] = tk.changePct;
      });
      // refresh derived holding values
      STRATA.HOLDINGS.forEach((h) => {
        const tk = STRATA.BY_SYM[h.sym];
        h.value = h.shares * tk.price; h.gain = h.value - h.cost; h.gainPct = (h.gain / h.cost) * 100; h.dayChange = h.shares * tk.change;
      });
      setTick((x) => x + 1);
    }, 2600);
    return () => clearInterval(id);
  }, [t.livePrices]);

  function open(s) { if (!s) return; setSym(s); setView("detail"); window.scrollTo({ top: 0 }); }
  function home() { setView("dashboard"); window.scrollTo({ top: 0 }); }
  function togglePf() { setPortfolio((p) => { const n = new Set(p); n.has(sym) ? n.delete(sym) : n.add(sym); return n; }); }
  function toggleWatch() { setWatchlist((w) => w.includes(sym) ? w.filter((x) => x !== sym) : [...w, sym]); }

  return (
    <div className="app">
      <TopNav view={view} onHome={home} onOpen={open} lastSym={sym} />
      {t.showTape && <MarketTape />}
      <main className="main">
        {view === "dashboard"
          ? <Dashboard portfolio={portfolio} watchlist={watchlist} onOpen={open} />
          : <>
              <button className="back" onClick={home}><Icon name="arrowLeft" size={15} /> Portfolio</button>
              <StockDetail sym={sym} inPortfolio={portfolio.has(sym)} onTogglePortfolio={togglePf} watched={watchlist.includes(sym)} onToggleWatch={toggleWatch} />
            </>}
      </main>

      <TweaksPanel>
        <TweakSection label="Brand accent" />
        <TweakColor label="Accent" value={t.accent}
          options={[["oklch(0.66 0.17 285)", "oklch(0.78 0.13 75)"], ["oklch(0.77 0.14 70)", "oklch(0.7 0.14 205)"], ["oklch(0.68 0.15 245)", "oklch(0.78 0.12 95)"], ["oklch(0.72 0.13 178)", "oklch(0.76 0.13 85)"]]}
          onChange={(v) => setTweak("accent", v)} />
        <TweakSection label="Behaviour" />
        <TweakToggle label="Live prices" value={t.livePrices} onChange={(v) => setTweak("livePrices", v)} />
        <TweakToggle label="Market tape" value={t.showTape} onChange={(v) => setTweak("showTape", v)} />
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
