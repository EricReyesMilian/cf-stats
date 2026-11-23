import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, AreaChart, Area, LineChart, Line, ReferenceLine, Legend,
} from 'recharts';
import { PALETTE, useAccent, verdictInfo, fmtDate } from '../theme.js';
import { Empty } from './ui.jsx';

const tick = { fontSize: 12, fill: '#5b6479' };
const tipStyle = { borderRadius: 8, border: '1px solid #d9dfea', fontSize: 13 };
const GRID = '#e6eaf1';

export function Donut({ data, center }) {
  const sum = data.reduce((a, d) => a + d.value, 0);
  if (!sum) return <Empty>Sin datos.</Empty>;
  return (
    <div className="donut">
      <div className="donut-chart">
        <ResponsiveContainer width="100%" height={210}>
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius={60} outerRadius={92} paddingAngle={1} stroke="none" isAnimationActive={false}>
              {data.map((d) => (
                <Cell key={d.name} fill={d.color} />
              ))}
            </Pie>
            <Tooltip contentStyle={tipStyle} formatter={(v, n) => [`${v.toLocaleString('es')} (${((v / sum) * 100).toFixed(1)}%)`, n]} />
          </PieChart>
        </ResponsiveContainer>
        {center && (
          <div className="donut-center">
            <b>{center.value}</b>
            <span>{center.label}</span>
          </div>
        )}
      </div>
      <ul className="legend">
        {data.slice(0, 9).map((d) => (
          <li key={d.name}>
            <i style={{ background: d.color }} />
            <span>{d.name}</span>
            <b>{d.value.toLocaleString('es')}</b>
            <em>{((d.value / sum) * 100).toFixed(1)}%</em>
          </li>
        ))}
      </ul>
    </div>
  );
}

export const colorize = (rows) => rows.map((r, i) => ({ ...r, color: PALETTE[i % PALETTE.length] }));

export function VerdictDonut({ verdicts, total }) {
  const data = verdicts.map((v) => ({ name: verdictInfo(v.name).label, value: v.value, color: verdictInfo(v.name).color }));
  return <Donut data={data} center={{ value: total.toLocaleString('es'), label: 'envíos' }} />;
}

export function SimpleBars({ data, x, y = 'value', height = 240, color, name, unit }) {
  const accent = useAccent();
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis dataKey={x} tick={tick} tickLine={false} axisLine={false} />
        <YAxis tick={tick} tickLine={false} axisLine={false} allowDecimals={false} />
        <Tooltip contentStyle={tipStyle} cursor={{ fill: '#eef1f6' }} formatter={(v) => [`${v}${unit || ''}`, name || 'Problemas']} />
        <Bar dataKey={y} fill={color || accent} radius={[4, 4, 0, 0]} isAnimationActive={false} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function DifficultyBars({ buckets, coverage }) {
  const accent = useAccent();
  if (!buckets.some((b) => b.solved)) return <Empty>Aún no hay problemas resueltos con dificultad.</Empty>;
  const data = coverage
    ? coverage.filter((c) => c.rating <= Math.max(...buckets.map((b) => b.rating), 0) + 300)
    : buckets;
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis dataKey="rating" tick={tick} tickLine={false} axisLine={false} interval="preserveStartEnd" />
        <YAxis tick={tick} tickLine={false} axisLine={false} allowDecimals={false} />
        <Tooltip
          contentStyle={tipStyle}
          cursor={{ fill: '#eef1f6' }}
          formatter={(v, n) => [v, n]}
          labelFormatter={(l) => `Dificultad ${l}`}
        />
        <Bar dataKey="solved" name="Resueltos" stackId="a" fill={accent} isAnimationActive={false} />
        {coverage && <Bar dataKey="left" name="Por resolver" stackId="a" fill="#dfe4ee" radius={[4, 4, 0, 0]} isAnimationActive={false} />}
        {coverage && <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />}
      </BarChart>
    </ResponsiveContainer>
  );
}

export function TagBars({ tags, totals, limit = 16 }) {
  const accent = useAccent();
  const data = tags.slice(0, limit).map((t) => ({
    ...t,
    left: totals ? Math.max((totals[t.tag] || 0) - t.solved, 0) : 0,
  }));
  if (!data.length) return <Empty>Sin etiquetas aún.</Empty>;
  return (
    <ResponsiveContainer width="100%" height={Math.max(260, data.length * 26)}>
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 12, bottom: 0, left: 8 }}>
        <CartesianGrid stroke={GRID} horizontal={false} />
        <XAxis type="number" tick={tick} tickLine={false} axisLine={false} />
        <YAxis type="category" dataKey="tag" tick={tick} tickLine={false} axisLine={false} width={104} />
        <Tooltip contentStyle={tipStyle} cursor={{ fill: '#eef1f6' }} />
        <Bar dataKey="solved" name="Resueltos" stackId="a" fill={accent} isAnimationActive={false} />
        {totals && <Bar dataKey="left" name="Por resolver" stackId="a" fill="#dfe4ee" radius={[0, 4, 4, 0]} isAnimationActive={false} />}
      </BarChart>
    </ResponsiveContainer>
  );
}

export function TagRadar({ tags }) {
  const accent = useAccent();
  const data = tags.slice(0, 10).map((t) => ({ tag: t.tag, solved: t.solved }));
  if (data.length < 3) return <Empty>Se necesitan al menos 3 etiquetas.</Empty>;
  return (
    <ResponsiveContainer width="100%" height={320}>
      <RadarChart data={data} outerRadius="72%">
        <PolarGrid stroke="#d9dfea" />
        <PolarAngleAxis dataKey="tag" tick={{ fontSize: 12, fill: '#3a4358' }} />
        <PolarRadiusAxis tick={false} axisLine={false} />
        <Tooltip contentStyle={tipStyle} />
        <Radar dataKey="solved" name="Resueltos" stroke={accent} fill={accent} fillOpacity={0.3} isAnimationActive={false} />
      </RadarChart>
    </ResponsiveContainer>
  );
}

// Tasa de acierto por etiqueta: qué tan seguido se resuelve un problema de esa etiqueta una vez intentado.
export function TagRates({ tags }) {
  const data = tags.filter((t) => t.tried >= 5).sort((a, b) => b.rate - a.rate);
  if (data.length < 2) return <Empty>Se necesitan más problemas intentados por etiqueta.</Empty>;
  const best = data.slice(0, 6);
  const worst = data.slice(-6).reverse();
  const row = (t, good) => (
    <li key={t.tag}>
      <span>{t.tag}</span>
      <div className="meter"><div style={{ width: `${t.rate * 100}%`, background: good ? '#1f9d55' : '#e0201b' }} /></div>
      <b>{Math.round(t.rate * 100)}%</b>
      <em>{t.solved}/{t.tried}</em>
    </li>
  );
  return (
    <div className="rates">
      <div>
        <h4>Donde más aciertas</h4>
        <ul>{best.map((t) => row(t, true))}</ul>
      </div>
      <div>
        <h4>Donde más te atascas</h4>
        <ul>{worst.map((t) => row(t, false))}</ul>
      </div>
    </div>
  );
}

export function StackedTime({ data, x, height = 260, labelFmt }) {
  const accent = useAccent();
  if (!data.length) return <Empty>Sin datos.</Empty>;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis dataKey={x} tick={tick} tickLine={false} axisLine={false} tickFormatter={labelFmt} minTickGap={24} />
        <YAxis tick={tick} tickLine={false} axisLine={false} allowDecimals={false} />
        <Tooltip contentStyle={tipStyle} cursor={{ fill: '#eef1f6' }} />
        <Bar dataKey="ac" name="Aceptados" stackId="a" fill={accent} isAnimationActive={false} />
        <Bar dataKey="other" name="Otros veredictos" stackId="a" fill="#cfd6e4" isAnimationActive={false} />
        <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function WeekHourBars({ data, height = 220 }) {
  const accent = useAccent();
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis dataKey="label" tick={tick} tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={10} />
        <YAxis tick={tick} tickLine={false} axisLine={false} allowDecimals={false} />
        <Tooltip contentStyle={tipStyle} cursor={{ fill: '#eef1f6' }} />
        <Bar dataKey="subs" name="Envíos" fill="#cfd6e4" radius={[4, 4, 0, 0]} isAnimationActive={false} />
        <Bar dataKey="ac" name="Aceptados" fill={accent} radius={[4, 4, 0, 0]} isAnimationActive={false} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function CumulativeArea({ data }) {
  const accent = useAccent();
  if (!data.length) return <Empty>Sin datos.</Empty>;
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis dataKey="key" tick={tick} tickLine={false} axisLine={false} tickFormatter={(k) => k.slice(2, 7)} minTickGap={36} />
        <YAxis tick={tick} tickLine={false} axisLine={false} allowDecimals={false} />
        <Tooltip contentStyle={tipStyle} formatter={(v) => [v, 'Problemas únicos resueltos']} labelFormatter={(k) => `Hasta ${k}`} />
        <Area dataKey="cumulative" stroke={accent} fill={accent} fillOpacity={0.18} strokeWidth={2.5} isAnimationActive={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function DeltaBars({ rows }) {
  if (!rows.length) return <Empty>Sin concursos.</Empty>;
  const data = rows.map((r) => ({ n: r.n, delta: r.delta, name: r.name }));
  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis dataKey="n" tick={tick} tickLine={false} axisLine={false} minTickGap={20} />
        <YAxis tick={tick} tickLine={false} axisLine={false} />
        <ReferenceLine y={0} stroke="#9aa3b8" />
        <Tooltip
          contentStyle={tipStyle}
          cursor={{ fill: '#eef1f6' }}
          formatter={(v) => [`${v > 0 ? '+' : ''}${v}`, 'Cambio']}
          labelFormatter={(n, p) => `#${n} · ${p?.[0]?.payload?.name || ''}`}
        />
        <Bar dataKey="delta" isAnimationActive={false}>
          {data.map((d) => (
            <Cell key={d.n} fill={d.delta >= 0 ? '#1f9d55' : '#e0201b'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function RankLine({ rows }) {
  const accent = useAccent();
  if (!rows.length) return <Empty>Sin concursos.</Empty>;
  const data = rows.map((r) => ({ n: r.n, rank: r.rank, name: r.name, at: r.at }));
  return (
    <ResponsiveContainer width="100%" height={250}>
      <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -4 }}>
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis dataKey="n" tick={tick} tickLine={false} axisLine={false} minTickGap={20} />
        <YAxis reversed scale="log" domain={['dataMin', 'dataMax']} tick={tick} tickLine={false} axisLine={false} allowDataOverflow />
        <Tooltip
          contentStyle={tipStyle}
          formatter={(v) => [`#${v}`, 'Puesto']}
          labelFormatter={(n, p) => `#${n} · ${p?.[0]?.payload?.name || ''} (${p?.[0] ? fmtDate(p[0].payload.at) : ''})`}
        />
        <Line dataKey="rank" stroke={accent} strokeWidth={2} dot={{ r: 2.5, fill: accent, strokeWidth: 0 }} isAnimationActive={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
