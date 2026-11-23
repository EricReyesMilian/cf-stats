import { useMemo, useState } from 'react';
import { fmtDate, fmtDateTime, verdictInfo } from '../theme.js';
import { submissionUrl, problemUrl } from '../stats.js';
import { Chip, Empty } from './ui.jsx';

export function ContestTable({ rows }) {
  const [sort, setSort] = useState({ key: 'n', dir: -1 });
  const [q, setQ] = useState('');
  const data = useMemo(() => {
    const f = rows.filter((r) => r.name.toLowerCase().includes(q.toLowerCase()));
    return f.sort((a, b) => (a[sort.key] > b[sort.key] ? 1 : a[sort.key] < b[sort.key] ? -1 : 0) * sort.dir);
  }, [rows, sort, q]);
  if (!rows.length) return <Empty>Sin concursos con rating.</Empty>;
  const th = (key, label) => (
    <th onClick={() => setSort((s) => ({ key, dir: s.key === key ? -s.dir : -1 }))} className="sortable" aria-sort={sort.key === key ? (sort.dir > 0 ? 'ascending' : 'descending') : 'none'}>
      {label}
      {sort.key === key ? (sort.dir > 0 ? ' ▲' : ' ▼') : ''}
    </th>
  );
  return (
    <div>
      <input className="filter" placeholder="Filtrar concursos…" value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              {th('n', '#')}
              {th('at', 'Fecha')}
              {th('name', 'Concurso')}
              {th('kind', 'Tipo')}
              {th('rank', 'Puesto')}
              {th('solved', 'Resueltos')}
              {th('newRating', 'Rating')}
              {th('delta', 'Cambio')}
            </tr>
          </thead>
          <tbody>
            {data.map((r) => (
              <tr key={r.contestId}>
                <td>{r.n}</td>
                <td>{fmtDate(r.at)}</td>
                <td>
                  <a href={`https://codeforces.com/contest/${r.contestId}`} target="_blank" rel="noreferrer">{r.name}</a>
                </td>
                <td>{r.kind}</td>
                <td>{r.rank}</td>
                <td>{r.solved}</td>
                <td>{r.oldRating} → <b>{r.newRating}</b></td>
                <td className={r.delta >= 0 ? 'up' : 'down'}>{r.delta > 0 ? '+' : ''}{r.delta}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function SubmissionsTable({ subs }) {
  const [v, setV] = useState('ALL');
  const verdicts = useMemo(() => [...new Set(subs.map((s) => s.verdict || 'TESTING'))], [subs]);
  const data = subs.filter((s) => v === 'ALL' || (s.verdict || 'TESTING') === v);
  return (
    <div>
      <select className="filter" value={v} onChange={(e) => setV(e.target.value)} aria-label="Filtrar por veredicto">
        <option value="ALL">Todos los veredictos</option>
        {verdicts.map((x) => (
          <option key={x} value={x}>{verdictInfo(x).label}</option>
        ))}
      </select>
      <div className="table-scroll tall">
        <table>
          <thead>
            <tr><th>Fecha</th><th>Problema</th><th>Dificultad</th><th>Lenguaje</th><th>Veredicto</th><th>Tiempo</th><th>Memoria</th></tr>
          </thead>
          <tbody>
            {data.map((s) => {
              const vi = verdictInfo(s.verdict || 'TESTING');
              return (
                <tr key={s.id}>
                  <td>{fmtDateTime(s.creationTimeSeconds)}</td>
                  <td>
                    <a href={problemUrl(s.problem)} target="_blank" rel="noreferrer">{s.problem.contestId}{s.problem.index} · {s.problem.name}</a>
                  </td>
                  <td>{s.problem.rating || '—'}</td>
                  <td>{s.programmingLanguage}</td>
                  <td>
                    <a href={submissionUrl(s)} target="_blank" rel="noreferrer">
                      <Chip color={vi.color}>{vi.label}{s.passedTestCount != null && s.verdict !== 'OK' ? ` · test ${s.passedTestCount + 1}` : ''}</Chip>
                    </a>
                  </td>
                  <td>{s.timeConsumedMillis} ms</td>
                  <td>{Math.round((s.memoryBytes || 0) / 1024).toLocaleString('es')} KB</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
