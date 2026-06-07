/* Strata — side & bottom panels for the stock detail view. */

function PerformanceCard({ t }) {
  const rows = ["1D", "5D", "1M", "3M", "YTD", "1Y", "5Y"];
  return (
    <Card title="Performance" pad={0}>
      <div>
        {rows.map((r, i) => (
          <div key={r} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 16px", borderTop: i ? "1px solid var(--border)" : "none" }}>
            <span style={{ fontSize: 12.5, color: "var(--text-mute)", fontFamily: "var(--mono)" }}>{r}</span>
            <span style={{ fontFamily: "var(--mono)", fontSize: 13, fontWeight: 600, color: dirColor(t.perf[r]) }}>{fmtPct(t.perf[r])}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

function KeyStatsCard({ t }) {
  const m = t.metrics;
  const rows = [
    ["Shares Out", fmtCompact(m.sharesOut)],
    ["Float", fmtCompact(m.float)],
    ["Beta (5Y)", m.beta.toFixed(2)],
    ["Short Interest", m.shortInt.toFixed(2) + "%"],
    ["Short Int. Chg", fmtPct(m.shortChg)],
    ["52W High", t.w52h.toFixed(2)],
    ["52W Low", t.w52l.toFixed(2)],
  ];
  return (
    <Card title="Key Stats" pad={0}>
      <div>
        {rows.map((r, i) => (
          <div key={r[0]} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 16px", borderTop: i ? "1px solid var(--border)" : "none" }}>
            <span style={{ fontSize: 12.5, color: "var(--text-mute)", whiteSpace: "nowrap" }}>{r[0]}</span>
            <span style={{ fontFamily: "var(--mono)", fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{r[1]}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

function OwnershipCard({ t }) {
  const o = t.ownership;
  const segs = [
    { label: "Institutional", value: o.inst, color: "var(--accent)" },
    { label: "Insider", value: o.insider, color: "var(--accent-2)" },
    { label: "Retail / Other", value: o.retail, color: "var(--surface-4)" },
  ];
  return (
    <Card title="Ownership">
      <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
        <Donut segments={segs} size={120} thickness={15}>
          <div style={{ fontFamily: "var(--mono)", fontSize: 17, fontWeight: 700 }}>{o.inst.toFixed(0)}%</div>
          <div style={{ fontSize: 9.5, color: "var(--text-mute)" }}>Inst.</div>
        </Donut>
        <div style={{ display: "flex", flexDirection: "column", gap: 11, flex: 1 }}>
          {segs.map((s) => (
            <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 9, height: 9, borderRadius: 2, background: s.color, flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: "var(--text-mute)", flex: 1, whiteSpace: "nowrap" }}>{s.label}</span>
              <span style={{ fontFamily: "var(--mono)", fontSize: 12.5, fontWeight: 600 }}>{s.value.toFixed(2)}%</span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

function KeyMetricsCard({ t }) {
  const m = t.metrics;
  const rows = [
    ["P/E (TTM)", m.peTTM.toFixed(2)],
    ["Forward P/E", m.fwdPE.toFixed(2)],
    ["EPS (TTM)", m.epsTTM.toFixed(2)],
    ["Revenue (TTM)", fmtCompact(m.revenueTTM)],
    ["Revenue Growth (YoY)", fmtPct(m.revGrowth)],
    ["Gross Margin", m.grossMargin.toFixed(2) + "%"],
    ["ROE (TTM)", m.roe.toFixed(2) + "%"],
    ["Debt / Equity", m.debtEquity.toFixed(2)],
    ["Dividend Yield (TTM)", m.divYield.toFixed(2) + "%"],
  ];
  return (
    <Card title="Key Metrics" pad={0}>
      <div>
        {rows.map((r, i) => (
          <div key={r[0]} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px", borderTop: i ? "1px solid var(--border)" : "none" }}>
            <span style={{ fontSize: 12.5, color: "var(--text-mute)", whiteSpace: "nowrap" }}>{r[0]}</span>
            <span style={{ fontFamily: "var(--mono)", fontSize: 13, fontWeight: 600, color: r[0].includes("Growth") ? dirColor(m.revGrowth) : "var(--text)" }}>{r[1]}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

function NewsCard({ sym }) {
  const items = STRATA.NEWS.filter((n) => n.sym === sym);
  const list = items.length ? items : STRATA.NEWS.slice(0, 4);
  return (
    <Card title="News Feed" action={<button className="lnk">View all</button>} pad={0}>
      <div>
        {list.map((n, i) => (
          <article key={i} className="newsrow" style={{ display: "flex", gap: 11, padding: "12px 16px", borderTop: i ? "1px solid var(--border)" : "none", cursor: "pointer" }}>
            <div style={{ width: 38, height: 38, borderRadius: 7, background: "var(--surface-3)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-mute)" }}>
              <Icon name="news" size={17} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 12.5, lineHeight: 1.4, color: "var(--text)", fontWeight: 500, textWrap: "pretty" }}>{n.t}</div>
              <div style={{ fontSize: 11, color: "var(--text-mute)", marginTop: 4, fontFamily: "var(--mono)" }}>{n.time} · {n.src}</div>
            </div>
          </article>
        ))}
      </div>
    </Card>
  );
}

function AnalystCard({ t }) {
  const a = t.analyst;
  const buyPct = a.buy / a.total;
  const score = (a.buy * 1 + a.hold * 0.5) / a.total;
  const rating = score > 0.78 ? "Strong Buy" : score > 0.62 ? "Buy" : score > 0.45 ? "Hold" : "Sell";
  const rcol = score > 0.62 ? "var(--up)" : score > 0.45 ? "var(--accent-2)" : "var(--down)";
  return (
    <Card title="Analyst Rating">
      <div style={{ fontFamily: "var(--mono)", fontSize: 26, fontWeight: 700, color: rcol, letterSpacing: "-.01em" }}>{rating}</div>
      <div style={{ fontSize: 11.5, color: "var(--text-mute)", marginTop: 3, marginBottom: 14 }}>Based on {a.total} analysts</div>
      <div style={{ display: "flex", height: 6, borderRadius: 3, overflow: "hidden", gap: 2 }}>
        <span style={{ flex: a.buy, background: "var(--up)" }} />
        <span style={{ flex: a.hold, background: "var(--surface-4)" }} />
        <span style={{ flex: Math.max(0.001, a.sell), background: "var(--down)" }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 9, fontFamily: "var(--mono)", fontSize: 11.5 }}>
        <span style={{ color: "var(--up)" }}>{a.buy} Buy</span>
        <span style={{ color: "var(--text-mute)" }}>{a.hold} Hold</span>
        <span style={{ color: "var(--down)" }}>{a.sell} Sell</span>
      </div>
    </Card>
  );
}

Object.assign(window, { PerformanceCard, KeyStatsCard, OwnershipCard, KeyMetricsCard, NewsCard, AnalystCard });