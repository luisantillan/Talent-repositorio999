/* Strata — Stock Detail screen. */
const { useState, useMemo } = React;
const COMPANY_ABOUT = {
  AAPL: "Apple Inc. designs, manufactures and markets smartphones, personal computers, tablets, wearables and accessories worldwide, and sells a range of related services. Its flagship products include iPhone, Mac, iPad, Apple Watch and AirPods, complemented by the App Store, iCloud, Apple Pay and a growing services portfolio.",
  NVDA: "NVIDIA Corporation provides graphics, compute and networking solutions. Its platforms power gaming, professional visualization, data centers and automotive markets, and underpin much of the world's accelerated computing and AI infrastructure.",
  MSFT: "Microsoft Corporation develops and supports software, services, devices and solutions. Segments span productivity and business processes, intelligent cloud (Azure) and more personal computing, including Windows, Office and Xbox.",
  TSLA: "Tesla, Inc. designs, develops, manufactures and sells electric vehicles and energy generation and storage systems, operating through automotive and energy generation & storage segments.",
};
const SECTOR_HUE = { Technology: 265, "Communication Svcs": 200, "Consumer Disc.": 150, Financials: 40, "Consumer Electronics": 265 };

function TickerBadge({ sym, sector, size = 56 }) {
  const hue = SECTOR_HUE[sector] || 265;
  return (
    <div style={{ width: size, height: size, borderRadius: 13, flexShrink: 0,
      background: `oklch(0.32 0.06 ${hue})`, border: `1px solid oklch(0.45 0.09 ${hue})`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "var(--mono)", fontWeight: 700, fontSize: size * 0.3, color: `oklch(0.9 0.08 ${hue})`, letterSpacing: "-.02em" }}>
      {sym.slice(0, 4)}
    </div>
  );
}

const RANGES = ["1D", "5D", "1M", "3M", "6M", "YTD", "1Y", "5Y", "All"];
const DRAW_TOOLS = ["chart", "scale", "filter", "bolt", "eye", "dots"];

function ChartPanel({ t }) {
  const [range, setRange] = useState("6M");
  const [logScale, setLogScale] = useState(false);
  const series = useMemo(() => STRATA.genSeries(t.sym, range), [t.sym, range]);
  const labels = STRATA.axisLabels(range);
  return (
    <div>
      {/* chart toolbar */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderBottom: "1px solid var(--border)", flexWrap: "wrap" }}>
        <div className="seg">
          <button className="seg-b active">{range === "1D" ? "1D" : "1D"}<Icon name="chevDown" size={13} /></button>
        </div>
        <div className="seg"><button className="seg-b">Indicators</button></div>
        <div className="seg"><button className="seg-b"><Icon name="scale" size={13} /> Compare</button></div>
        <div style={{ flex: 1 }} />
        <button className="icon-btn" title="Reset"><Icon name="refresh" size={15} /></button>
        <button className="icon-btn" title="Fullscreen"><Icon name="expand" size={15} /></button>
      </div>

      <div style={{ display: "flex" }}>
        {/* drawing rail */}
        <div style={{ width: 40, borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "10px 0", flexShrink: 0 }}>
          {DRAW_TOOLS.map((d, i) => (
            <button key={i} className="rail-btn" title="Drawing tool"><Icon name={d} size={16} /></button>
          ))}
        </div>
        <div style={{ flex: 1, minWidth: 0, padding: "6px 8px 0" }}>
          <CandleChart series={series} labels={labels} height={400} lastDir={t.change >= 0 ? 1 : -1} range={range} />
        </div>
      </div>

      {/* range toolbar */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 14px", borderTop: "1px solid var(--border)", flexWrap: "wrap" }}>
        {RANGES.map((r) => (
          <button key={r} className={"rangebtn" + (range === r ? " active" : "")} onClick={() => setRange(r)}>{r}</button>
        ))}
        <div style={{ flex: 1 }} />
        <span style={{ fontFamily: "var(--mono)", fontSize: 11.5, color: "var(--text-mute)" }}>4:00:00 PM (ET)</span>
        <button className={"rangebtn" + (logScale ? " active" : "")} onClick={() => setLogScale(!logScale)}>log</button>
      </div>
    </div>
  );
}

function FinancialsTab({ t }) {
  const rnd = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return ((h >>> 0) % 1000) / 1000; };
  const base = t.metrics.revenueTTM / 4;
  const q = ["Q3'24", "Q4'24", "Q1'25", "Q2'25"].map((lbl, i) => {
    const rev = base * (0.86 + rnd(t.sym + i) * 0.4);
    const ni = rev * (t.metrics.grossMargin / 100) * (0.32 + rnd(t.sym + "ni" + i) * 0.25);
    return { lbl, rev, ni };
  });
  const max = Math.max(...q.map((x) => x.rev));
  return (
    <div style={{ padding: 22 }}>
      <h3 style={{ margin: "0 0 18px", fontSize: 14 }}>Quarterly Revenue & Net Income</h3>
      <div style={{ display: "flex", gap: 28, alignItems: "flex-end", height: 220, padding: "0 8px" }}>
        {q.map((x) => (
          <div key={x.lbl} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
            <div style={{ display: "flex", gap: 6, alignItems: "flex-end", height: 170, width: "100%", justifyContent: "center" }}>
              <div style={{ width: "34%", height: `${(x.rev / max) * 100}%`, background: "var(--accent)", borderRadius: "3px 3px 0 0", position: "relative" }} title={"Revenue " + fmtCompact(x.rev)} />
              <div style={{ width: "34%", height: `${(x.ni / max) * 100}%`, background: "var(--up)", borderRadius: "3px 3px 0 0" }} title={"Net income " + fmtCompact(x.ni)} />
            </div>
            <span style={{ fontFamily: "var(--mono)", fontSize: 11.5, color: "var(--text-mute)" }}>{x.lbl}</span>
            <span style={{ fontFamily: "var(--mono)", fontSize: 12, fontWeight: 600 }}>{fmtCompact(x.rev)}</span>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 18, marginTop: 22, fontSize: 12 }}>
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}><i style={{ width: 10, height: 10, borderRadius: 2, background: "var(--accent)" }} /> Revenue</span>
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}><i style={{ width: 10, height: 10, borderRadius: 2, background: "var(--up)" }} /> Net Income</span>
      </div>
    </div>
  );
}

function HistoricalTab({ t }) {
  const rows = useMemo(() => STRATA.genSeries(t.sym, "3M").slice(-16).reverse(), [t.sym]);
  const day0 = 16;
  return (
    <div style={{ padding: "6px 0" }}>
      <table className="histtable">
        <thead>
          <tr>{["Date", "Open", "High", "Low", "Close", "Change", "Volume"].map((h) => <th key={h} style={{ textAlign: h === "Date" ? "left" : "right" }}>{h}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((b, i) => {
            const chg = ((b.c - b.o) / b.o) * 100;
            return (
              <tr key={i}>
                <td style={{ textAlign: "left", color: "var(--text-mute)" }}>May {String(day0 - i).padStart(2, "0")}, 2025</td>
                <td>{b.o.toFixed(2)}</td><td>{b.h.toFixed(2)}</td><td>{b.l.toFixed(2)}</td>
                <td style={{ color: "var(--text)", fontWeight: 600 }}>{b.c.toFixed(2)}</td>
                <td style={{ color: dirColor(chg) }}>{fmtPct(chg)}</td>
                <td style={{ color: "var(--text-mute)" }}>{fmtCompact(b.v)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function OverviewTab({ t }) {
  const about = COMPANY_ABOUT[t.sym] || `${t.name} is a publicly traded company listed on ${t.ex} within the ${t.sector} sector. The figures shown here are illustrative sample data for prototype purposes.`;
  const facts = [["CEO", "—"], ["Headquarters", "United States"], ["Founded", "—"], ["Employees", fmtCompact(t.metrics.sharesOut / 1200)], ["Exchange", t.ex], ["Sector", t.sector]];
  return (
    <div style={{ padding: 22, display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 28 }}>
      <div>
        <h3 style={{ margin: "0 0 10px", fontSize: 14 }}>About {t.name}</h3>
        <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.65, color: "var(--text-mute)", textWrap: "pretty" }}>{about}</p>
        <div style={{ display: "flex", gap: 8, marginTop: 16, flexWrap: "wrap" }}>
          {t.tags.map((tg) => <span key={tg} className="chip">{tg}</span>)}
        </div>
      </div>
      <div>
        <h3 style={{ margin: "0 0 10px", fontSize: 14 }}>Company Facts</h3>
        <div>
          {facts.map((f, i) => (
            <div key={f[0]} style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderTop: i ? "1px solid var(--border)" : "none" }}>
              <span style={{ fontSize: 12.5, color: "var(--text-mute)" }}>{f[0]}</span>
              <span style={{ fontFamily: "var(--mono)", fontSize: 12.5, fontWeight: 600 }}>{f[1]}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const TABS = ["Chart", "Overview", "Financials", "Options", "Historical Data"];

function StockDetail({ sym, inPortfolio, onTogglePortfolio, watched, onToggleWatch }) {
  const t = STRATA.BY_SYM[sym];
  const [tab, setTab] = useState("Chart");
  const up = t.change >= 0;

  const statRow = [
    ["Open", t.open.toFixed(2)], ["High", t.dayHigh.toFixed(2)], ["Low", t.dayLow.toFixed(2)],
    ["Prev Close", t.prevClose.toFixed(2)], ["Volume", fmtCompact(t.vol)], ["Avg Vol (3M)", fmtCompact(t.avgVol)],
    ["Market Cap", fmtCompact(t.mcap)], ["52W Range", `${t.w52l.toFixed(2)} – ${t.w52h.toFixed(2)}`],
  ];

  return (
    <div className="detail">
      {/* header */}
      <div className="detail-head">
        <div style={{ display: "flex", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
          <TickerBadge sym={t.sym} sector={t.sector} />
          <div style={{ flex: 1, minWidth: 220 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
              <h1 style={{ margin: 0, fontSize: 23, fontWeight: 600, letterSpacing: "-.01em" }}>{t.name}</h1>
              <span style={{ fontFamily: "var(--mono)", fontSize: 15, color: "var(--text-mute)", fontWeight: 600 }}>{t.sym}</span>
            </div>
            <div style={{ fontSize: 12, color: "var(--text-mute)", marginTop: 5, fontFamily: "var(--mono)" }}>{t.ex} · {t.tags.join(" · ")}</div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button className={"btn-ghost" + (watched ? " on" : "")} onClick={onToggleWatch} title="Watchlist">
              <Icon name="star" size={17} style={{ fill: watched ? "var(--accent)" : "none", color: watched ? "var(--accent)" : "currentColor" }} />
            </button>
            <button className={"btn-primary" + (inPortfolio ? " added" : "")} onClick={onTogglePortfolio}>
              <Icon name={inPortfolio ? "check" : "plus"} size={16} /> {inPortfolio ? "In portfolio" : "Add to portfolio"}
            </button>
          </div>
        </div>

        {/* price */}
        <div style={{ display: "flex", alignItems: "baseline", gap: 14, marginTop: 20, flexWrap: "wrap" }}>
          <span style={{ fontFamily: "var(--mono)", fontSize: 34, fontWeight: 700, letterSpacing: "-.02em" }}>US${t.price.toFixed(2)}</span>
          <span style={{ fontFamily: "var(--mono)", fontSize: 16, fontWeight: 600, color: dirColor(t.change) }}>{fmtSigned(t.change)}</span>
          <Pill value={t.changePct} size={15} />
        </div>
        <div style={{ fontSize: 11.5, color: "var(--text-mute)", marginTop: 7, fontFamily: "var(--mono)" }}>● Market Closed · May 16, 2025 4:00 PM ET</div>

        {/* stat strip */}
        <div className="statstrip">
          {statRow.map((s) => (
            <div key={s[0]} style={{ minWidth: 0 }}>
              <div style={{ fontSize: 10.5, color: "var(--text-mute)", marginBottom: 4, whiteSpace: "nowrap" }}>{s[0]}</div>
              <div style={{ fontFamily: "var(--mono)", fontSize: 13.5, fontWeight: 600, whiteSpace: "nowrap" }}>{s[1]}</div>
            </div>
          ))}
        </div>
      </div>

      {/* main grid */}
      <div className="detail-grid">
        <div style={{ display: "flex", flexDirection: "column", gap: 16, minWidth: 0 }}>
          <div className="card" style={{ overflow: "hidden" }}>
            <div className="tabs">
              {TABS.map((tb) => (
                <button key={tb} className={"tab" + (tab === tb ? " active" : "")} onClick={() => setTab(tb)}>{tb}</button>
              ))}
            </div>
            {tab === "Chart" && <ChartPanel t={t} />}
            {tab === "Overview" && <OverviewTab t={t} />}
            {tab === "Financials" && <FinancialsTab t={t} />}
            {tab === "Historical Data" && <HistoricalTab t={t} />}
            {tab === "Options" && (
              <div style={{ padding: 40, textAlign: "center", color: "var(--text-mute)" }}>
                <Icon name="scale" size={26} />
                <p style={{ fontSize: 13, marginTop: 10 }}>Options chain for {t.sym} — sample prototype view.</p>
              </div>
            )}
          </div>

          <div className="trio">
            <PerformanceCard t={t} />
            <KeyStatsCard t={t} />
            <OwnershipCard t={t} />
          </div>
        </div>

        <aside style={{ display: "flex", flexDirection: "column", gap: 16, minWidth: 0 }}>
          <KeyMetricsCard t={t} />
          <NewsCard sym={t.sym} />
          <AnalystCard t={t} />
        </aside>
      </div>
    </div>
  );
}

window.StockDetail = StockDetail;
window.SECTOR_HUE = SECTOR_HUE;
