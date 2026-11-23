import { useAccent } from '../theme.js';

export function Card({ title, sub, children, className = '', right }) {
  return (
    <section className={`card ${className}`}>
      {(title || right) && (
        <header className="card-head">
          <div>
            <h3>{title}</h3>
            {sub && <p>{sub}</p>}
          </div>
          {right}
        </header>
      )}
      {children}
    </section>
  );
}

export function Empty({ children }) {
  return <div className="empty">{children}</div>;
}

// Franja de cifras separadas por líneas finas.
export function Strip({ items }) {
  return (
    <div className="strip">
      {items.map((it) => (
        <div className="strip-item" key={it.label}>
          <span className="strip-value">{it.value}</span>
          <span className="strip-label">{it.label}</span>
          {it.hint && <span className="strip-hint">{it.hint}</span>}
        </div>
      ))}
    </div>
  );
}

// Anillo de progreso (0–100)
export function Ring({ value, label, sub, color }) {
  const accent = useAccent();
  const c = color || accent;
  const r = 44;
  const len = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(100, value || 0));
  return (
    <div className="ring">
      <svg viewBox="0 0 110 110" width="116" height="116" role="img" aria-label={`${label}: ${v.toFixed(0)}%`}>
        <circle cx="55" cy="55" r={r} fill="none" stroke="#e6eaf1" strokeWidth="11" />
        <circle
          cx="55"
          cy="55"
          r={r}
          fill="none"
          stroke={c}
          strokeWidth="11"
          strokeLinecap="round"
          strokeDasharray={`${(len * v) / 100} ${len}`}
          transform="rotate(-90 55 55)"
        />
        <text x="55" y="60" textAnchor="middle" className="ring-num">
          {v.toFixed(0)}%
        </text>
      </svg>
      <b>{label}</b>
      {sub && <span>{sub}</span>}
    </div>
  );
}

export function Chip({ color, children }) {
  return (
    <span className="chip" style={{ '--chip': color }}>
      {children}
    </span>
  );
}

export function ProblemList({ items, extra }) {
  if (!items?.length) return <Empty>Sin datos todavía.</Empty>;
  return (
    <ol className="plist">
      {items.map((p) => (
        <li key={p.key}>
          <div className="plist-main">
            <a href={p.url} target="_blank" rel="noreferrer">
              {p.contestId}
              {p.index} · {p.name}
            </a>
            <span className="plist-tags">{p.tags.slice(0, 4).join(', ') || 'sin etiquetas'}</span>
          </div>
          <div className="plist-side">
            {p.rating && <b>{p.rating}</b>}
            {extra && <span>{extra(p)}</span>}
          </div>
        </li>
      ))}
    </ol>
  );
}
