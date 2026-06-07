/* Strata — shared UI primitives, formatters, icons. Exported to window. */
const { useState, useRef, useEffect, useMemo } = React;

// ---------- formatters ----------
function fmtPrice(n, dollar = true) {
  if (n == null || isNaN(n)) return "—";
  const s = n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return (dollar ? "$" : "") + s;
}
function fmtCompact(n) {
  if (n == null || isNaN(n)) return "—";
  const a = Math.abs(n);
  if (a >= 1e12) return (n / 1e12).toFixed(2) + "T";
  if (a >= 1e9) return (n / 1e9).toFixed(2) + "B";
  if (a >= 1e6) return (n / 1e6).toFixed(2) + "M";
  if (a >= 1e3) return (n / 1e3).toFixed(2) + "K";
  return n.toFixed(2);
}
function fmtPct(n, withSign = true) {
  if (n == null || isNaN(n)) return "—";
  const sign = n > 0 ? "+" : "";
  return (withSign ? sign : "") + n.toFixed(2) + "%";
}
function fmtSigned(n) {
  if (n == null || isNaN(n)) return "—";
  return (n > 0 ? "+" : "") + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function dirColor(n) { return n > 0 ? "var(--up)" : n < 0 ? "var(--down)" : "var(--text-mute)"; }

// ---------- icons (simple line glyphs) ----------
function Icon({ name, size = 18, stroke = 1.6, style }) {
  const common = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: stroke, strokeLinecap: "round", strokeLinejoin: "round", style };
  const P = {
    search: <><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></>,
    bell: <><path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 0 1-3.4 0" /></>,
    gear: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1A2 2 0 1 1 7 4.3l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z" /></>,
    star: <path d="M12 3l2.7 5.5 6 .9-4.3 4.2 1 6L12 17.8 6.6 19.6l1-6L3.3 9.4l6-.9z" />,
    plus: <><path d="M12 5v14" /><path d="M5 12h14" /></>,
    info: <><circle cx="12" cy="12" r="9" /><path d="M12 16v-4" /><path d="M12 8h.01" /></>,
    grid: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
    chart: <><path d="M3 3v18h18" /><path d="M7 14l3-4 3 3 4-6" /></>,
    wallet: <><rect x="3" y="6" width="18" height="13" rx="2" /><path d="M3 10h18" /><circle cx="17" cy="14" r="1.3" /></>,
    list: <><path d="M8 6h13" /><path d="M8 12h13" /><path d="M8 18h13" /><path d="M3 6h.01" /><path d="M3 12h.01" /><path d="M3 18h.01" /></>,
    bolt: <path d="M13 2L4 14h7l-1 8 9-12h-7z" />,
    news: <><path d="M4 5h13v14H6a2 2 0 0 1-2-2z" /><path d="M17 8h3v9a2 2 0 0 1-2 2" /><path d="M7 8h7M7 12h7M7 16h4" /></>,
    arrowUp: <path d="M12 19V5M6 11l6-6 6 6" />,
    arrowDown: <path d="M12 5v14M6 13l6 6 6-6" />,
    arrowRight: <path d="M5 12h14M13 6l6 6-6 6" />,
    arrowLeft: <path d="M19 12H5M11 6l-6 6 6 6" />,
    chevDown: <path d="M6 9l6 6 6-6" />,
    check: <path d="M5 12l5 5L20 6" />,
    x: <path d="M6 6l12 12M18 6L6 18" />,
    expand: <><path d="M8 3H3v5" /><path d="M21 8V3h-5" /><path d="M16 21h5v-5" /><path d="M3 16v5h5" /></>,
    refresh: <><path d="M3 12a9 9 0 0 1 15-6.7L21 8" /><path d="M21 3v5h-5" /><path d="M21 12a9 9 0 0 1-15 6.7L3 16" /><path d="M3 21v-5h5" /></>,
    filter: <path d="M4 5h16l-6 8v5l-4 2v-7z" />,
    dots: <><circle cx="5" cy="12" r="1.4" /><circle cx="12" cy="12" r="1.4" /><circle cx="19" cy="12" r="1.4" /></>,
    eye: <><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></>,
    scale: <><path d="M12 3v18" /><path d="M5 7l-3 6h6z" /><path d="M19 7l-3 6h6z" /><path d="M5 7h14" /><path d="M8 21h8" /></>,
  };
  return <svg {...common}>{P[name] || null}</svg>;
}

// ---------- brand mark ----------
function Logo({ size = 26 }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
        <rect x="3" y="19" width="6" height="10" rx="1.5" style={{ fill: "var(--accent)" }} opacity="0.55" />
        <rect x="13" y="12" width="6" height="17" rx="1.5" style={{ fill: "var(--accent)" }} opacity="0.8" />
        <rect x="23" y="4" width="6" height="25" rx="1.5" style={{ fill: "var(--accent)" }} />
      </svg>
    </div>
  );
}

// ---------- change pill ----------
function Pill({ value, suffix = "%", size = 13, solid = false }) {
  const up = value > 0, down = value < 0;
  const col = up ? "var(--up)" : down ? "var(--down)" : "var(--text-mute)";
  const bg = up ? "var(--up-soft)" : down ? "var(--down-soft)" : "var(--surface-3)";
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 3, fontFamily: "var(--mono)",
      fontSize: size, fontWeight: 600, color: solid ? "#fff" : col, whiteSpace: "nowrap",
      background: solid ? col : bg, padding: "2px 7px", borderRadius: 6, lineHeight: 1.4,
    }}>
      {up ? "▲" : down ? "▼" : ""} {Math.abs(value).toFixed(2)}{suffix}
    </span>
  );
}

// ---------- sparkline ----------
function Sparkline({ data, width = 120, height = 34, color, fill = true, strokeW = 1.6 }) {
  const { path, area, up } = useMemo(() => {
    if (!data || data.length < 2) return { path: "", area: "", up: true };
    const min = Math.min(...data), max = Math.max(...data);
    const rng = max - min || 1;
    const stepX = width / (data.length - 1);
    const pts = data.map((d, i) => [i * stepX, height - ((d - min) / rng) * (height - 4) - 2]);
    const path = pts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" ");
    const area = path + ` L ${width} ${height} L 0 ${height} Z`;
    return { path, area, up: data[data.length - 1] >= data[0] };
  }, [data, width, height]);
  const c = color || (up ? "var(--up)" : "var(--down)");
  const gid = useMemo(() => "spk" + Math.random().toString(36).slice(2, 8), []);
  return (
    <svg width={width} height={height} style={{ display: "block", overflow: "visible" }}>
      {fill && <defs><linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" style={{ stopColor: c, stopOpacity: 0.22 }} /><stop offset="1" style={{ stopColor: c, stopOpacity: 0 }} />
      </linearGradient></defs>}
      {fill && <path d={area} fill={`url(#${gid})`} />}
      <path d={path} fill="none" style={{ stroke: c }} strokeWidth={strokeW} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

// ---------- donut ----------
function Donut({ segments, size = 132, thickness = 16, children }) {
  const r = (size - thickness) / 2;
  const cx = size / 2, cy = size / 2;
  const circ = 2 * Math.PI * r;
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  let acc = 0;
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={cx} cy={cy} r={r} fill="none" style={{ stroke: "var(--surface-3)" }} strokeWidth={thickness} />
        {segments.map((s, i) => {
          const len = (s.value / total) * circ;
          const el = (
            <circle key={i} cx={cx} cy={cy} r={r} fill="none" style={{ stroke: s.color }} strokeWidth={thickness}
              strokeDasharray={`${len} ${circ - len}`} strokeDashoffset={-acc} strokeLinecap="butt" />
          );
          acc += len;
          return el;
        })}
      </svg>
      {children && <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}>{children}</div>}
    </div>
  );
}

// ---------- card shell ----------
function Card({ title, action, children, pad = 16, style, bodyStyle }) {
  return (
    <section className="card" style={style}>
      {title && (
        <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "13px 16px 11px", borderBottom: "1px solid var(--border)" }}>
          <h3 style={{ margin: 0, fontSize: 13.5, fontWeight: 600, letterSpacing: ".01em", color: "var(--text)" }}>{title}</h3>
          {action}
        </header>
      )}
      <div style={{ padding: pad, ...bodyStyle }}>{children}</div>
    </section>
  );
}

// ---------- tiny stat ----------
function Stat({ label, value, sub, mono = true, align = "left" }) {
  return (
    <div style={{ textAlign: align }}>
      <div style={{ fontSize: 11, color: "var(--text-mute)", marginBottom: 3, letterSpacing: ".02em" }}>{label}</div>
      <div style={{ fontFamily: mono ? "var(--mono)" : "var(--sans)", fontSize: 14.5, fontWeight: 600, color: "var(--text)" }}>{value}</div>
      {sub && <div style={{ fontSize: 11, marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

Object.assign(window, {
  fmtPrice, fmtCompact, fmtPct, fmtSigned, dirColor,
  Icon, Logo, Pill, Sparkline, Donut, Card, Stat,
});
