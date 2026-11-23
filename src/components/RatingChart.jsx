import { ComposedChart, Line, XAxis, YAxis, Tooltip, ReferenceArea, ResponsiveContainer, CartesianGrid } from 'recharts';
import { RANKS, useAccent, fmtDate } from '../theme.js';
import { Empty } from './ui.jsx';

function Tip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="tip">
      <b>{d.name}</b>
      <span>{fmtDate(d.at)}</span>
      <span>
        Puesto <b>{d.rank}</b>
      </span>
      <span>
        {d.oldRating} → <b>{d.newRating}</b>{' '}
        <i className={d.delta >= 0 ? 'up' : 'down'}>
          ({d.delta >= 0 ? '+' : ''}
          {d.delta})
        </i>
      </span>
    </div>
  );
}

export default function RatingChart({ rows, height = 340 }) {
  const accent = useAccent();
  if (!rows.length) return <Empty>Este usuario todavía no ha participado en concursos con rating.</Empty>;
  const data = rows.map((r) => ({ ...r, t: r.at * 1000 }));
  const vals = data.map((d) => d.newRating);
  const lo = Math.max(0, Math.floor((Math.min(...vals) - 150) / 100) * 100);
  const hi = Math.ceil((Math.max(...vals) + 150) / 100) * 100;
  const bands = RANKS.map((r, i) => ({ y1: r.min, y2: RANKS[i + 1] ? RANKS[i + 1].min : 4500, color: r.color })).filter(
    (b) => b.y2 > lo && b.y1 < hi
  );
  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={data} margin={{ top: 8, right: 18, bottom: 4, left: 0 }}>
        {bands.map((b) => (
          <ReferenceArea key={b.y1} y1={b.y1} y2={b.y2} fill={b.color} fillOpacity={0.1} ifOverflow="hidden" />
        ))}
        <CartesianGrid stroke="#ffffff" strokeOpacity={0.7} />
        <XAxis
          dataKey="t"
          type="number"
          scale="time"
          domain={['dataMin', 'dataMax']}
          tickFormatter={(t) => new Date(t).toLocaleDateString('es', { month: 'short', year: '2-digit' })}
          tick={{ fontSize: 12, fill: '#5b6479' }}
          tickLine={false}
          minTickGap={50}
        />
        <YAxis domain={[lo, hi]} tick={{ fontSize: 12, fill: '#5b6479' }} tickLine={false} axisLine={false} width={44} />
        <Tooltip content={<Tip />} />
        <Line
          type="monotone"
          dataKey="newRating"
          stroke={accent}
          strokeWidth={2.5}
          dot={{ r: 2.5, fill: accent, strokeWidth: 0 }}
          activeDot={{ r: 6 }}
          isAnimationActive={false}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
