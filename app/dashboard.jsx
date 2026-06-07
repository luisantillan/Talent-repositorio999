/* Strata — Dashboard / Portfolio screen. */
const { useState, useRef, useEffect, useMemo } = React;

const ALLOC_COLORS = [
  "var(--accent)", "var(--accent-2)",
  "oklch(0.7 0.13 200)", "oklch(0.72 0.13 150)",
  "oklch(0.74 0.13 90)", "oklch(0.68 0.13 20)",
  "oklch(0.66 0.12 320)", "oklch(0.7 0.1 260)",
];

function AreaChart({ data, height = 150, color = "var(--accent)" }) {
  const [ref, W] = useMeasure();
  const [hover, setHover] = useState(null);
  const padB = 4, padT = 8;
  const { path, area, pts, min, max } = useMemo(() => {
    if (!data || data.length < 2) return { path: "", area: "", pts: [], min: 0, max: 1 };
    const min = Math.min(...data), max = Math.max(...data);
    const rng = max - min || 1;
    const stepX = W / (data.length - 1);
    const pts = data.map((d, i) => [i * stepX, padT + (1 - (d - min) / rng) * (height - padT - padB)]);
    const path = pts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" ");
    const area = path + ` L ${W} ${height} L 0 ${height} Z`;
    return { path, area, pts, min, max };
  }, [data, W, height]);
  const gid = useMemo(() => "ar" + Math.random().toString(36).slice(2, 7), []);
  function move(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    let i = Math.round((x / W) * (data.length - 1));
    i = Math.max(0, Math.min(data.length - 1, i));
    setHover({ i, x: pts[i][0], y: pts[i][1] });
  }
  return (
    <div ref={ref} style={{ position: "relative", width: "100%" }}>
      <svg width={W} height={height} style={{ display: "block" }} onMouseMove={move} onMouseLeave={() => setHover(null)}>
        <defs><linearGradient id={gid} x1="0" y1="0" x2="0" y2="1"><stop offset="0" style={{ stopColor: color, stopOpacity: 0.28 }} /><stop offset="1" style={{ stopColor: color, stopOpacity: 0 }} /></linearGradient></defs>
        <path d={area} fill={`url(#${gid})`} />
        <path d={path} fill="none" style={{ stroke: color }} strokeWidth="2" strokeLinejoin="round" />
        {hover && <><line x1={hover.x} x2={hover.x} y1={padT} y2={height} style={{ stroke: "var(--text-mute)" }} strokeDasharray="2 3" opacity="0.5" /><circle cx={hover.x} cy={hover.y} r="4" style={{ fill: color, stroke: "var(--surface-1)" }} strokeWidth="2" /></>}
      </svg>
      {hover && (
        <div style={{ position: "absolute", top: 0, left: Math.min(W - 92, Math.max(0, hover.x - 40)), background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 6, padding: "3px 8px", fontFamily: "var(--mono)", fontSize: 11.5, fontWeight: 600, pointerEvents: "none", whiteSpace: "nowrap" }}>
          {fmtPrice(data[hover.i])}
        </div>
      )}
    </div>
  );
}

const PF_RANGES = { "1M": 22, "3M": 60, "6M": 90, "1Y": 120 };

function PortfolioHero({ rows, onOpen }) {
  const [range, setRange] = useState("1Y");
  const total = rows.reduce((s, h) => s + h.value, 0);
  const totalCost = rows.reduce((s, h) => s + h.cost, 0);
  const totalGain = total - totalCost;
  const dayChange = rows.reduce((s, h) => s + h.dayChange, 0);
  const dayPct = (dayChange / (total - dayChange)) * 100;
  const gainPct = (totalGain / totalCost) * 100;

  const fullCurve = useMemo(() => STRATA.portfolioCurve(), []);
  const curve = useMemo(() => {
    const n = PF_RANGES[range];
    const sliced = fullCurve.slice(-n);
    // rescale so it ends at the real current total
    const scale = total / sliced[sliced.length - 1];
    return sliced.map((v) => v * scale);
  }, [range, fullCurve, total]);
  const periodChg = curve[curve.length - 1] - curve[0];
  const periodPct = (periodChg / curve[0]) * 100;

  return (
    <div className="card" style={{ padding: 22 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
        <div>
          <div style={{ fontSize: 12.5, color: "var(--text-mute)", marginBottom: 6 }}>Portfolio Value</div>
          <div style={{ fontFamily: "var(--mono)", fontSize: 38, fontWeight: 700, letterSpacing: "-.02em" }}>{fmtPrice(total)}</div>
          <div style={{ display: "flex", gap: 12, marginTop: 8, alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ fontFamily: "var(--mono)", fontSize: 14, fontWeight: 600, color: dirColor(dayChange) }}>{fmtSigned(dayChange)} <span style={{ fontSize: 12 }}>today</span></span>
            <Pill value={dayPct} />
          </div>
        </div>
        <div style={{ display: "flex", gap: 28 }}>
          <Stat label="Total Gain/Loss" value={<span style={{ color: dirColor(totalGain) }}>{fmtSigned(totalGain)}</span>} sub={<span style={{ color: dirColor(totalGain), fontFamily: "var(--mono)", fontWeight: 600 }}>{fmtPct(gainPct)}</span>} />
          <Stat label="Total Cost" value={fmtPrice(totalCost)} />
          <Stat label="Positions" value={rows.length} />
        </div>
      </div>

      <div style={{ marginTop: 18 }}>
        <AreaChart data={curve} height={170} color={periodChg >= 0 ? "var(--up)" : "var(--down)"} />
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 12 }}>
        {Object.keys(PF_RANGES).map((r) => (
          <button key={r} className={"rangebtn" + (range === r ? " active" : "")} onClick={() => setRange(r)}>{r}</button>
        ))}
        <div style={{ flex: 1 }} />
        <span style={{ fontFamily: "var(--mono)", fontSize: 12, color: dirColor(periodChg) }}>{fmtSigned(periodChg)} ({fmtPct(periodPct)})</span>
      </div>
    </div>
  );
}

function AllocationCard({ rows, onOpen }) {
  const total = rows.reduce((s, h) => s + h.value, 0);
  const sorted = [...rows].sort((a, b) => b.value - a.value);
  const segs = sorted.map((h, i) => ({ label: h.sym, value: h.value, color: ALLOC_COLORS[i % ALLOC_COLORS.length] }));
  return (
    <Card title="Allocation">
      <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
        <Donut segments={segs} size={128} thickness={16}>
          <div style={{ fontFamily: "var(--mono)", fontSize: 13, fontWeight: 700 }}>{rows.length}</div>
          <div style={{ fontSize: 9.5, color: "var(--text-mute)" }}>assets</div>
        </Donut>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
          {sorted.slice(0, 6).map((h, i) => (
            <button key={h.sym} className="alloc-row" onClick={() => onOpen(h.sym)}>
              <span style={{ width: 9, height: 9, borderRadius: 2, background: ALLOC_COLORS[i % ALLOC_COLORS.length], flexShrink: 0 }} />
              <span style={{ fontFamily: "var(--mono)", fontSize: 12.5, fontWeight: 600, flex: 1, textAlign: "left" }}>{h.sym}</span>
              <span style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--text-mute)" }}>{((h.value / total) * 100).toFixed(1)}%</span>
            </button>
          ))}
        </div>
      </div>
    </Card>
  );
}

function HoldingsTable({ rows, onOpen }) {
  const [sort, setSort] = useState({ k: "value", dir: -1 });
  const total = rows.reduce((s, h) => s + h.value, 0);
  const sorted = useMemo(() => {
    const arr = [...rows];
    arr.sort((a, b) => {
      let av, bv;
      if (sort.k === "sym") { av = a.sym; bv = b.sym; return sort.dir * av.localeCompare(bv); }
      av = a[sort.k]; bv = b[sort.k];
      if (sort.k === "price") { av = STRATA.BY_SYM[a.sym].price; bv = STRATA.BY_SYM[b.sym].price; }
      if (sort.k === "dayPct") { av = STRATA.BY_SYM[a.sym].changePct; bv = STRATA.BY_SYM[b.sym].changePct; }
      return sort.dir * (av - bv);
    });
    return arr;
  }, [rows, sort]);
  function hdr(k, label, align = "right") {
    return <th style={{ textAlign: align, cursor: "pointer" }} onClick={() => setSort((s) => ({ k, dir: s.k === k ? -s.dir : -1 }))}>
      {label}{sort.k === k ? (sort.dir < 0 ? " ↓" : " ↑") : ""}
    </th>;
  }
  return (
    <Card title="Holdings" action={<span style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--text-mute)" }}>{rows.length} positions</span>} pad={0}>
      <div style={{ overflowX: "auto" }}>
        <table className="holdtable">
          <thead><tr>
            {hdr("sym", "Symbol", "left")}
            <th style={{ textAlign: "right" }}>Shares</th>
            {hdr("price", "Price")}
            {hdr("dayPct", "Day")}
            {hdr("value", "Market Value")}
            {hdr("gain", "Total Gain/Loss")}
            <th style={{ textAlign: "right" }}>Weight</th>
            <th style={{ textAlign: "right" }}>30D</th>
          </tr></thead>
          <tbody>
            {sorted.map((h) => {
              const t = STRATA.BY_SYM[h.sym];
              const spark = STRATA.genSeries(h.sym, "1M").map((b) => b.c);
              return (
                <tr key={h.sym} onClick={() => onOpen(h.sym)} style={{ cursor: "pointer" }}>
                  <td style={{ textAlign: "left" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span className="mini-badge" style={{ background: `oklch(0.3 0.05 ${SECTOR_HUE[t.sector] || 265})`, color: `oklch(0.88 0.08 ${SECTOR_HUE[t.sector] || 265})` }}>{h.sym.slice(0, 2)}</span>
                      <div>
                        <div style={{ fontFamily: "var(--mono)", fontWeight: 700, fontSize: 13 }}>{h.sym}</div>
                        <div style={{ fontSize: 11, color: "var(--text-mute)", maxWidth: 130, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.name}</div>
                      </div>
                    </div>
                  </td>
                  <td>{h.shares}</td>
                  <td>{fmtPrice(t.price)}</td>
                  <td style={{ color: dirColor(t.changePct) }}>{fmtPct(t.changePct)}</td>
                  <td style={{ fontWeight: 600 }}>{fmtPrice(h.value)}</td>
                  <td style={{ color: dirColor(h.gain) }}>{fmtSigned(h.gain)}<div style={{ fontSize: 10.5 }}>{fmtPct(h.gainPct)}</div></td>
                  <td style={{ color: "var(--text-mute)" }}>{((h.value / total) * 100).toFixed(1)}%</td>
                  <td style={{ padding: "0 14px" }}><Sparkline data={spark} width={72} height={26} fill={false} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function WatchlistCard({ syms, onOpen }) {
  return (
    <Card title="Watchlist" action={<button className="lnk">Edit</button>} pad={0}>
      <div>
        {syms.map((sym, i) => {
          const t = STRATA.BY_SYM[sym];
          const spark = STRATA.genSeries(sym, "5D").map((b) => b.c);
          return (
            <button key={sym} className="watchrow" onClick={() => onOpen(sym)} style={{ borderTop: i ? "1px solid var(--border)" : "none" }}>
              <div style={{ textAlign: "left", flex: 1 }}>
                <div style={{ fontFamily: "var(--mono)", fontWeight: 700, fontSize: 13 }}>{sym}</div>
                <div style={{ fontSize: 11, color: "var(--text-mute)", maxWidth: 110, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.name}</div>
              </div>
              <Sparkline data={spark} width={60} height={26} fill={false} />
              <div style={{ textAlign: "right", minWidth: 74 }}>
                <div style={{ fontFamily: "var(--mono)", fontSize: 13, fontWeight: 600 }}>{fmtPrice(t.price)}</div>
                <div style={{ fontFamily: "var(--mono)", fontSize: 11.5, color: dirColor(t.changePct) }}>{fmtPct(t.changePct)}</div>
              </div>
            </button>
          );
        })}
      </div>
    </Card>
  );
}

function MoversCard({ onOpen }) {
  const all = STRATA.TICKERS;
  const movers = [...all].sort((a, b) => b.changePct - a.changePct);
  const top = movers.slice(0, 3), bottom = movers.slice(-3).reverse();
  const Row = ({ t }) => (
    <button className="watchrow" onClick={() => onOpen(t.sym)}>
      <span style={{ fontFamily: "var(--mono)", fontWeight: 700, fontSize: 12.5, flex: 1, textAlign: "left" }}>{t.sym}</span>
      <span style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--text-mute)" }}>{fmtPrice(t.price)}</span>
      <span style={{ minWidth: 64, textAlign: "right" }}><Pill value={t.changePct} size={11.5} /></span>
    </button>
  );
  return (
    <Card title="Market Movers" pad={0}>
      <div style={{ padding: "8px 16px 4px", fontSize: 11, color: "var(--up)", fontFamily: "var(--mono)", fontWeight: 600 }}>▲ TOP GAINERS</div>
      {top.map((t) => <Row key={t.sym} t={t} />)}
      <div style={{ padding: "12px 16px 4px", fontSize: 11, color: "var(--down)", fontFamily: "var(--mono)", fontWeight: 600, borderTop: "1px solid var(--border)" }}>▼ TOP LOSERS</div>
      {bottom.map((t) => <Row key={t.sym} t={t} />)}
    </Card>
  );
}

function Dashboard({ portfolio, watchlist, onOpen }) {
  const rows = useMemo(() => {
    return [...portfolio].map((sym) => {
      const base = STRATA.HOLDINGS.find((h) => h.sym === sym);
      const t = STRATA.BY_SYM[sym];
      if (base) return base;
      const shares = 25;
      const avgCost = t.price * 0.92;
      const value = shares * t.price, cost = shares * avgCost;
      return { sym, shares, avgCost, value, cost, gain: value - cost, gainPct: ((value - cost) / cost) * 100, dayChange: shares * t.change };
    });
  }, [portfolio]);

  return (
    <div className="dash">
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 18, flexWrap: "wrap", gap: 10 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 600, letterSpacing: "-.01em" }}>Good afternoon, Alex</h1>
          <p style={{ margin: "5px 0 0", fontSize: 13, color: "var(--text-mute)" }}>Here's how your portfolio is doing today.</p>
        </div>
        <button className="btn-primary"><Icon name="plus" size={16} /> New trade</button>
      </div>

      <div className="dash-top">
        <PortfolioHero rows={rows} onOpen={onOpen} />
        <AllocationCard rows={rows} onOpen={onOpen} />
      </div>

      <div className="dash-grid">
        <div style={{ minWidth: 0, display: "flex", flexDirection: "column", gap: 16 }}>
          <HoldingsTable rows={rows} onOpen={onOpen} />
          <NewsCard sym={null} />
        </div>
        <aside style={{ minWidth: 0, display: "flex", flexDirection: "column", gap: 16 }}>
          <WatchlistCard syms={watchlist} onOpen={onOpen} />
          <MoversCard onOpen={onOpen} />
        </aside>
      </div>
    </div>
  );
}

window.Dashboard = Dashboard;
