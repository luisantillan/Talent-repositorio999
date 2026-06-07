/* Strata — candlestick chart with crosshair, volume, live price tag. */
const { useState, useRef, useEffect, useMemo } = React;
function useMeasure() {
  const ref = useRef(null);
  const [w, setW] = useState(800);
  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver((es) => { for (const e of es) setW(e.contentRect.width); });
    ro.observe(ref.current);
    setW(ref.current.clientWidth);
    return () => ro.disconnect();
  }, []);
  return [ref, w];
}

function CandleChart({ series, labels, height = 420, lastDir = 1, range = "3M" }) {
  const [ref, W] = useMeasure();
  const [hover, setHover] = useState(null); // {idx, x, y}

  const padL = 6, padR = 60, padT = 12, padB = 24;
  const plotW = Math.max(80, W - padL - padR);
  const innerH = height - padT - padB;
  const volH = innerH * 0.16;
  const gap = 14;
  const priceH = innerH - volH - gap;

  const dims = useMemo(() => {
    if (!series || !series.length) return null;
    let pmin = Infinity, pmax = -Infinity, vmax = 0;
    series.forEach((b) => { pmin = Math.min(pmin, b.l); pmax = Math.max(pmax, b.h); vmax = Math.max(vmax, b.v); });
    const pad = (pmax - pmin) * 0.06 || 1;
    pmin -= pad; pmax += pad;
    const n = series.length;
    const slot = plotW / n;
    const bodyW = Math.max(1.2, Math.min(slot * 0.64, 11));
    const yP = (p) => padT + (1 - (p - pmin) / (pmax - pmin)) * priceH;
    const xC = (i) => padL + slot * (i + 0.5);
    const yV = (v) => (v / vmax) * volH;
    return { pmin, pmax, vmax, n, slot, bodyW, yP, xC, yV };
  }, [series, plotW, priceH, volH, padT, padL]);

  if (!dims) return <div ref={ref} style={{ height }} />;
  const { pmin, pmax, n, slot, bodyW, yP, xC, yV } = dims;
  const last = series[n - 1];
  const upCol = "var(--up)", downCol = "var(--down)";
  const lastCol = lastDir >= 0 ? upCol : downCol;
  const volBase = padT + priceH + gap + volH;

  // price gridlines
  const gridN = 5;
  const grids = Array.from({ length: gridN + 1 }, (_, i) => pmin + ((pmax - pmin) * i) / gridN);

  // x labels positioned evenly
  const xlabels = labels || [];

  function onMove(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    let idx = Math.floor((x - padL) / slot);
    idx = Math.max(0, Math.min(n - 1, idx));
    setHover({ idx, x: xC(idx), y: e.clientY - rect.top });
  }
  const hb = hover ? series[hover.idx] : null;
  const hUp = hb ? hb.c >= hb.o : true;

  return (
    <div ref={ref} style={{ position: "relative", width: "100%", userSelect: "none" }}>
      <svg width={W} height={height} style={{ display: "block" }}
        onMouseMove={onMove} onMouseLeave={() => setHover(null)}>
        {/* grid */}
        {grids.map((g, i) => (
          <g key={i}>
            <line x1={padL} x2={padL + plotW} y1={yP(g)} y2={yP(g)} style={{ stroke: "var(--grid)" }} strokeWidth="1" />
            <text x={W - padR + 7} y={yP(g) + 3.5} style={{ fill: "var(--text-mute)" }} fontSize="10.5">{g.toFixed(2)}</text>
          </g>
        ))}
        {/* volume */}
        {series.map((b, i) => {
          const up = b.c >= b.o;
          const h = Math.max(0.6, yV(b.v));
          return <rect key={"v" + i} x={xC(i) - bodyW / 2} y={volBase - h} width={bodyW} height={h}
            style={{ fill: up ? "var(--up)" : "var(--down)" }} opacity="0.28" rx="0.5" />;
        })}
        {/* candles */}
        {series.map((b, i) => {
          const up = b.c >= b.o;
          const col = up ? upCol : downCol;
          const oY = yP(b.o), cY = yP(b.c);
          const top = Math.min(oY, cY), bh = Math.max(1, Math.abs(cY - oY));
          return (
            <g key={"c" + i}>
              <line x1={xC(i)} x2={xC(i)} y1={yP(b.h)} y2={yP(b.l)} style={{ stroke: col }} strokeWidth="1" />
              <rect x={xC(i) - bodyW / 2} y={top} width={bodyW} height={bh} style={{ fill: col }} rx="0.5" />
            </g>
          );
        })}
        {/* last price dashed line + tag */}
        <line x1={padL} x2={padL + plotW} y1={yP(last.c)} y2={yP(last.c)} style={{ stroke: lastCol }} strokeWidth="1" strokeDasharray="3 3" opacity="0.9" />
        <g>
          <rect x={W - padR + 1} y={yP(last.c) - 9} width={padR - 3} height={18} rx="3" style={{ fill: lastCol }} />
          <text x={W - padR + (padR - 3) / 2 + 1} y={yP(last.c) + 3.5} textAnchor="middle" fill="#0b0d12" fontSize="10.5" fontWeight="700">{last.c.toFixed(2)}</text>
        </g>
        {/* x labels */}
        {xlabels.map((lb, i) => {
          const x = padL + (plotW * (i + 0.5)) / xlabels.length;
          return <text key={"x" + i} x={x} y={height - 7} textAnchor="middle" style={{ fill: "var(--text-mute)" }} fontSize="10.5">{lb}</text>;
        })}
        {/* crosshair */}
        {hover && (
          <g pointerEvents="none">
            <line x1={hover.x} x2={hover.x} y1={padT} y2={volBase} style={{ stroke: "var(--text-mute)" }} strokeWidth="1" strokeDasharray="2 3" opacity="0.6" />
            <line x1={padL} x2={padL + plotW} y1={Math.max(padT, Math.min(volBase, hover.y))} y2={Math.max(padT, Math.min(volBase, hover.y))} style={{ stroke: "var(--text-mute)" }} strokeWidth="1" strokeDasharray="2 3" opacity="0.45" />
            <circle cx={hover.x} cy={yP(hb.c)} r="3" style={{ fill: hUp ? upCol : downCol, stroke: "var(--surface-1)" }} strokeWidth="1.5" />
          </g>
        )}
      </svg>

      {/* OHLC readout (top-left) */}
      {hb && (
        <div style={{ position: "absolute", top: 8, left: 10, display: "flex", gap: 12, fontFamily: "var(--mono)", fontSize: 11.5, background: "color-mix(in srgb, var(--surface-1) 86%, transparent)", padding: "4px 9px", borderRadius: 6, border: "1px solid var(--border)", pointerEvents: "none", whiteSpace: "nowrap" }}>
          {[["O", hb.o], ["H", hb.h], ["L", hb.l], ["C", hb.c]].map(([k, v]) => (
            <span key={k} style={{ color: "var(--text-mute)" }}>{k} <span style={{ color: hUp ? upCol : downCol }}>{v.toFixed(2)}</span></span>
          ))}
          <span style={{ color: "var(--text-mute)" }}>Vol <span style={{ color: "var(--text)" }}>{fmtCompact(hb.v)}</span></span>
        </div>
      )}

      {/* hover tooltip box near cursor */}
      {hover && hb && (
        <div style={{
          position: "absolute", top: 36,
          left: Math.min(W - 150, Math.max(0, hover.x + 10)),
          background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 8,
          padding: "8px 10px", fontFamily: "var(--mono)", fontSize: 11, pointerEvents: "none",
          boxShadow: "0 8px 24px rgba(0,0,0,.4)", minWidth: 120,
        }}>
          <div style={{ color: "var(--text-mute)", marginBottom: 5, fontSize: 10 }}>{xlabels.length ? xlabels[Math.min(xlabels.length - 1, Math.floor((hover.idx / n) * xlabels.length))] : ""} · #{hover.idx + 1}</div>
          {[["Open", hb.o], ["High", hb.h], ["Low", hb.l], ["Close", hb.c]].map(([k, v]) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", gap: 14, marginBottom: 2 }}>
              <span style={{ color: "var(--text-mute)" }}>{k}</span><span style={{ color: "var(--text)" }}>{v.toFixed(2)}</span>
            </div>
          ))}
          <div style={{ display: "flex", justifyContent: "space-between", gap: 14, marginTop: 3, paddingTop: 4, borderTop: "1px solid var(--border)" }}>
            <span style={{ color: "var(--text-mute)" }}>Chg</span>
            <span style={{ color: hUp ? upCol : downCol }}>{fmtPct(((hb.c - hb.o) / hb.o) * 100)}</span>
          </div>
        </div>
      )}
    </div>
  );
}

window.CandleChart = CandleChart;
window.useMeasure = useMeasure;
