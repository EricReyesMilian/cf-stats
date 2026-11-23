import { useMemo, useState } from 'react';
import { useAccent } from '../theme.js';
import { ymd } from '../stats.js';

const DAY = 86400000;
const CELL = 13;
const GAP = 3;
const LEFT = 28;
const TOP = 20;

export default function Heatmap({ heat, years }) {
  const accent = useAccent();
  const [view, setView] = useState('last');
  const [metric, setMetric] = useState('n');

  const { cells, cols, months, total, activeDays, max } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let start;
    let end;
    if (view === 'last') {
      end = today;
      start = new Date(today.getTime() - 364 * DAY);
    } else {
      start = new Date(Number(view), 0, 1);
      end = new Date(Number(view), 11, 31);
    }
    const aligned = new Date(start);
    aligned.setDate(aligned.getDate() - ((aligned.getDay() + 6) % 7)); // lunes
    const cells = [];
    const months = [];
    let total = 0;
    let activeDays = 0;
    let max = 0;
    let lastMonth = -1;
    let col = 0;
    for (let d = new Date(aligned); d <= end; d = new Date(d.getTime() + DAY)) {
      const row = (d.getDay() + 6) % 7;
      if (row === 0 && d > aligned) col++;
      if (d < start) continue;
      const v = heat.get(ymd(d))?.[metric] || 0;
      total += v;
      if (v > 0) activeDays++;
      if (v > max) max = v;
      if (row === 0 || cells.length === 0) {
        if (d.getMonth() !== lastMonth) {
          months.push({ col, label: d.toLocaleDateString('es', { month: 'short' }) });
          lastMonth = d.getMonth();
        }
      }
      cells.push({ col, row, v, label: d.toLocaleDateString('es', { dateStyle: 'medium' }) });
    }
    return { cells, cols: col + 1, months, total, activeDays, max };
  }, [heat, view, metric]);

  const level = (v) => {
    if (!v) return 0;
    const q = max <= 4 ? v / max : Math.min(v / Math.max(max * 0.8, 1), 1);
    return 0.28 + 0.72 * q;
  };

  const width = LEFT + cols * (CELL + GAP);
  const height = TOP + 7 * (CELL + GAP);
  const noun = metric === 'n' ? 'envíos' : 'aceptados';

  return (
    <div>
      <div className="heat-controls">
        <div className="seg">
          <button className={metric === 'n' ? 'on' : ''} onClick={() => setMetric('n')}>Envíos</button>
          <button className={metric === 'ac' ? 'on' : ''} onClick={() => setMetric('ac')}>Aceptados</button>
        </div>
        <select value={view} onChange={(e) => setView(e.target.value)} aria-label="Periodo">
          <option value="last">Último año</option>
          {[...years].reverse().map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
        <span className="heat-sum">
          <b>{total.toLocaleString('es')}</b> {noun} en <b>{activeDays}</b> días
        </span>
      </div>
      <div className="heat-scroll">
        <svg width={width} height={height} role="img" aria-label="Calendario de actividad">
          {months.map((m) => (
            <text key={m.col + m.label} x={LEFT + m.col * (CELL + GAP)} y={12} className="heat-label">
              {m.label}
            </text>
          ))}
          {['Lun', 'Mié', 'Vie'].map((l, i) => (
            <text key={l} x={0} y={TOP + i * 2 * (CELL + GAP) + CELL - 2} className="heat-label">
              {l}
            </text>
          ))}
          {cells.map((c) => (
            <rect
              key={`${c.col}-${c.row}`}
              x={LEFT + c.col * (CELL + GAP)}
              y={TOP + c.row * (CELL + GAP)}
              width={CELL}
              height={CELL}
              rx={3}
              fill={c.v ? accent : '#e6eaf1'}
              fillOpacity={c.v ? level(c.v) : 1}
            >
              <title>{`${c.label}: ${c.v} ${noun}`}</title>
            </rect>
          ))}
        </svg>
      </div>
    </div>
  );
}
