import { useEffect, useMemo, useState } from 'react';
import { fetchUser, fetchCatalog } from './api.js';
import { computeStats, catalogStats } from './stats.js';
import { AccentCtx, rankOf, PALETTE, fmtDate, num, pct } from './theme.js';
import { Card, Strip, Ring, ProblemList, Empty } from './components/ui.jsx';
import Hero from './components/Hero.jsx';
import RatingChart from './components/RatingChart.jsx';
import Heatmap from './components/Heatmap.jsx';
import { ContestTable, SubmissionsTable } from './components/Tables.jsx';
import {
  Donut, VerdictDonut, SimpleBars, DifficultyBars, TagBars, TagRadar, TagRates, StackedTime,
  WeekHourBars, CumulativeArea, DeltaBars, RankLine, colorize,
} from './components/Charts.jsx';

const TABS = [
  ['resumen', 'Resumen'],
  ['concursos', 'Concursos'],
  ['problemas', 'Problemas'],
  ['actividad', 'Actividad'],
  ['envios', 'Envíos'],
];
const EXAMPLES = ['tourist', 'jiangly', 'Benq', 'Petr'];

const getHash = () => decodeURIComponent(location.hash.replace(/^#\/?/, '')).trim();
const loadRecents = () => {
  try {
    return JSON.parse(localStorage.getItem('cf-recents') || '[]');
  } catch {
    return [];
  }
};
const saveRecent = (h) => {
  try {
    const list = [h, ...loadRecents().filter((x) => x.toLowerCase() !== h.toLowerCase())].slice(0, 6);
    localStorage.setItem('cf-recents', JSON.stringify(list));
  } catch {
    /* sin almacenamiento disponible */
  }
};

function SearchBar({ initial, onSubmit, recents }) {
  const [v, setV] = useState(initial);
  useEffect(() => setV(initial), [initial]);
  return (
    <div className="searchbar">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (v.trim()) onSubmit(v.trim());
        }}
      >
        <input value={v} onChange={(e) => setV(e.target.value)} placeholder="Handle de Codeforces, p. ej. tourist" aria-label="Handle de Codeforces" autoFocus />
        <button type="submit">Ver estadísticas</button>
      </form>
      {recents.length > 0 && (
        <div className="recents">
          {recents.map((r) => (
            <button key={r} onClick={() => onSubmit(r)}>{r}</button>
          ))}
        </div>
      )}
    </div>
  );
}

function Resumen({ s, cat }) {
  const t = s.totals;
  const langData = colorize(s.langs.map((l) => ({ name: l.name, value: l.value })));
  return (
    <>
      <Strip
        items={[
          { value: num(t.solved), label: 'Problemas resueltos', hint: `${num(t.attempted)} intentados` },
          { value: num(t.subs), label: 'Envíos', hint: `${num(t.acSubs)} aceptados` },
          { value: pct(t.acSubs, t.subs), label: 'Tasa de aceptación' },
          { value: num(s.contests?.count ?? 0), label: 'Concursos con rating' },
          { value: s.contests ? `#${s.contests.bestRank.rank}` : '—', label: 'Mejor puesto' },
          { value: t.maxSolvedRating ?? '—', label: 'Problema más difícil', hint: t.avgSolvedRating ? `media ${Math.round(t.avgSolvedRating)}` : undefined },
          { value: `${s.streaks.subs.best} d`, label: 'Racha más larga', hint: `actual ${s.streaks.subs.cur} d` },
          { value: num(t.last30), label: 'Resueltos en 30 días', hint: `${num(t.last7)} en 7 días` },
        ]}
      />
      <Card title="Historial de rating" sub="Las bandas de color son los rangos de Codeforces. Pasa el cursor por un punto para ver el concurso.">
        <RatingChart rows={s.contestRows} />
      </Card>
      <Card title="Calendario de actividad" sub="Cada celda es un día. Cambia entre envíos y aceptados, o entre años.">
        <Heatmap heat={s.heat} years={s.years} />
      </Card>
      <div className="grid2">
        <Card title="Veredictos" sub="Cómo terminan tus envíos.">
          <VerdictDonut verdicts={s.verdicts} total={t.subs} />
        </Card>
        <Card title="Lenguajes" sub="Agrupados por familia (C++17, C++20… cuentan como C++).">
          <Donut data={langData} center={{ value: langData[0]?.name || '—', label: 'más usado' }} />
        </Card>
      </div>
      <div className="grid3">
        <Card title="Resueltos a la primera"><Ring value={(t.firstTry / Math.max(t.solved, 1)) * 100} label="Sin fallos previos" sub={`${t.firstTry} de ${t.solved} problemas`} /></Card>
        <Card title="Durante concurso"><Ring value={(t.solvedIn.contest / Math.max(t.solved, 1)) * 100} label="Resueltos en vivo" sub={`${t.solvedIn.contest} en concurso, ${t.solvedIn.virtual} virtual, ${t.solvedIn.practice} práctica`} /></Card>
        <Card title="Terminados"><Ring value={(t.solved / Math.max(t.attempted, 1)) * 100} label="Intentados y resueltos" sub={`${t.unsolved} problemas sin resolver`} /></Card>
      </div>
    </>
  );
}

function Concursos({ s }) {
  const c = s.contests;
  if (!c) return <Card title="Concursos"><Empty>Este usuario no tiene concursos con rating.</Empty></Card>;
  const kinds = colorize(c.kinds);
  return (
    <>
      <Strip
        items={[
          { value: c.count, label: 'Concursos', hint: `${fmtDate(c.first.at)} – ${fmtDate(c.last.at)}` },
          { value: `#${c.bestRank.rank}`, label: 'Mejor puesto', hint: c.bestRank.name },
          { value: `#${Math.round(c.avgRank)}`, label: 'Puesto medio', hint: `peor #${c.worstRank.rank}` },
          { value: `+${c.maxUp.delta}`, label: 'Mayor subida', hint: c.maxUp.name },
          { value: c.maxDown.delta, label: 'Mayor bajada', hint: c.maxDown.name },
          { value: `${c.avgDelta >= 0 ? '+' : ''}${c.avgDelta.toFixed(1)}`, label: 'Cambio medio' },
          { value: `${c.positive} / ${c.negative}`, label: 'Subidas / bajadas' },
          { value: `${c.top100} · ${c.top500} · ${c.top1000}`, label: 'Top 100 · 500 · 1000' },
        ]}
      />
      <Card title="Historial de rating"><RatingChart rows={s.contestRows} /></Card>
      <div className="grid2">
        <Card title="Cambio de rating por concurso" sub="Verde sube, rojo baja. El eje X es el número de concurso."><DeltaBars rows={s.contestRows} /></Card>
        <Card title="Puesto en cada concurso" sub="Escala logarítmica; más arriba es mejor."><RankLine rows={s.contestRows} /></Card>
      </div>
      <div className="grid2">
        <Card title="Tipos de concurso"><Donut data={kinds} center={{ value: c.count, label: 'concursos' }} /></Card>
        <Card title="Concursos por año"><SimpleBars data={c.perYear} x="year" name="Concursos" /></Card>
      </div>
      <Card title="Todos los concursos" sub={`${c.solvedInContests} problemas resueltos durante concurso en total.`}>
        <ContestTable rows={s.contestRows} />
      </Card>
    </>
  );
}

function Problemas({ s, cat }) {
  const t = s.totals;
  return (
    <>
      <Strip
        items={[
          { value: num(t.solved), label: 'Resueltos', hint: cat ? `de ${num(cat.totalProblems)} en Codeforces` : undefined },
          { value: t.avgSolvedRating ? Math.round(t.avgSolvedRating) : '—', label: 'Dificultad media' },
          { value: t.maxSolvedRating ?? '—', label: 'Dificultad máxima' },
          { value: num(t.unratedSolved), label: 'Sin dificultad asignada' },
          { value: num(t.last365), label: 'Resueltos en 365 días' },
          { value: pct(t.firstTry, t.solved), label: 'A la primera' },
        ]}
      />
      <Card title="Problemas resueltos por dificultad" sub={cat ? 'La parte gris es lo que queda por resolver en esa dificultad.' : 'Cargando el catálogo completo para mostrar cuánto queda por resolver…'}>
        <DifficultyBars buckets={s.ratingBuckets} coverage={cat?.coverage} />
      </Card>
      <div className="grid2">
        <Card title="Etiquetas más resueltas" sub={cat ? 'Gris: problemas de esa etiqueta que aún no resuelves.' : undefined}>
          <TagBars tags={s.tagData} totals={cat?.tagTotals} />
        </Card>
        <Card title="Perfil por etiquetas" sub="Tus 10 etiquetas con más problemas resueltos.">
          <TagRadar tags={s.tagData} />
        </Card>
      </div>
      <div className="grid2">
        <Card title="Aciertos por etiqueta" sub="Solo etiquetas con al menos 5 problemas intentados.">
          <TagRates tags={s.tagData} />
        </Card>
        <Card title="Fallos antes del primer aceptado" sub="Cuántos intentos fallidos necesitaste en cada problema resuelto.">
          <SimpleBars data={s.wrongDist} x="label" />
        </Card>
      </div>
      <div className="grid2">
        <Card title="Resueltos por letra del problema" sub="A, B, C… según su posición en el concurso.">
          <SimpleBars data={s.letterData} x="letter" />
        </Card>
        <Card title="Lenguaje de los aceptados">
          <Donut data={colorize(s.langsOk)} center={{ value: num(t.acSubs), label: 'aceptados' }} />
        </Card>
      </div>
      <div className="grid2">
        <Card title="Los más difíciles que has resuelto"><ProblemList items={s.hardest} extra={(p) => (p.solvedAt ? fmtDate(p.solvedAt) : '')} /></Card>
        <Card title="Los que más fallos te costaron" sub="Problemas resueltos tras varios intentos fallidos."><ProblemList items={s.mostTries} extra={(p) => `${p.wrong} fallos`} /></Card>
      </div>
      <div className="grid2">
        <Card title="Intentados y sin resolver" sub="Ordenados por número de envíos."><ProblemList items={s.pending} extra={(p) => `${p.total} envíos`} /></Card>
        <Card title="Sugeridos para ti" sub={cat ? `Sin resolver, dificultad ${cat.lo}–${cat.hi}, de los más resueltos por la comunidad.` : 'Cargando catálogo…'}>
          {cat ? <ProblemList items={cat.suggestions} extra={(p) => `${num(p.solversCount)} lo resolvieron${p.tried ? ' · ya lo intentaste' : ''}`} /> : <Empty>Cargando…</Empty>}
        </Card>
      </div>
    </>
  );
}

function Actividad({ s }) {
  const t = s.totals;
  const best = t.bestDay;
  return (
    <>
      <Strip
        items={[
          { value: num(t.activeDays), label: 'Días con envíos', hint: `${num(t.acDays)} con algún aceptado` },
          { value: `${s.streaks.subs.best} d`, label: 'Racha más larga', hint: `actual ${s.streaks.subs.cur} d` },
          { value: `${s.streaks.ac.best} d`, label: 'Racha con aceptados', hint: `actual ${s.streaks.ac.cur} d` },
          { value: t.subsPerActiveDay.toFixed(1), label: 'Envíos por día activo' },
          { value: best ? best.n : '—', label: 'Máximo en un día', hint: best ? fmtDate(new Date(best.day + 'T12:00:00').getTime() / 1000) : undefined },
          { value: t.firstSub ? fmtDate(t.firstSub) : '—', label: 'Primer envío' },
          { value: t.maxTime ? `${t.maxTime} ms` : '—', label: 'Mayor tiempo aceptado' },
          { value: t.maxMem ? `${Math.round(t.maxMem / 1048576)} MB` : '—', label: 'Mayor memoria aceptada' },
        ]}
      />
      <Card title="Problemas únicos resueltos, acumulados" sub="Crecimiento mes a mes."><CumulativeArea data={s.monthly} /></Card>
      <Card title="Envíos por mes"><StackedTime data={s.monthly} x="key" labelFmt={(k) => k.slice(2, 7)} /></Card>
      <div className="grid2">
        <Card title="Envíos por año"><StackedTime data={s.yearly} x="year" /></Card>
        <Card title="Problemas nuevos resueltos por año"><SimpleBars data={s.yearly} x="year" y="newSolved" /></Card>
      </div>
      <div className="grid2">
        <Card title="Día de la semana" sub="Según la zona horaria de tu navegador."><WeekHourBars data={s.dowData} /></Card>
        <Card title="Hora del día" sub="Según la zona horaria de tu navegador."><WeekHourBars data={s.hourData} /></Card>
      </div>
    </>
  );
}

export default function App() {
  const [handle, setHandle] = useState(getHash());
  const [state, setState] = useState({ status: 'idle' });
  const [catalog, setCatalog] = useState(null);
  const [tab, setTab] = useState('resumen');
  const [recents, setRecents] = useState(loadRecents());
  const [reload, setReload] = useState(0);

  useEffect(() => {
    const f = () => setHandle(getHash());
    window.addEventListener('hashchange', f);
    return () => window.removeEventListener('hashchange', f);
  }, []);

  useEffect(() => {
    if (!handle) {
      setState({ status: 'idle' });
      return;
    }
    let off = false;
    setState({ status: 'loading', step: 'Perfil' });
    setTab('resumen');
    (async () => {
      try {
        const data = await fetchUser(handle, (step) => !off && setState({ status: 'loading', step }));
        if (off) return;
        const stats = computeStats(data);
        saveRecent(data.user.handle);
        setRecents(loadRecents());
        setState({ status: 'ready', stats });
        document.title = `${data.user.handle} · Perfil CF`;
      } catch (e) {
        if (!off) setState({ status: 'error', message: e.message });
      }
    })();
    return () => {
      off = true;
    };
  }, [handle, reload]);

  useEffect(() => {
    let off = false;
    fetchCatalog()
      .then((c) => !off && setCatalog(c))
      .catch(() => {});
    return () => {
      off = true;
    };
  }, []);

  const stats = state.status === 'ready' ? state.stats : null;
  const cat = useMemo(() => (stats && catalog ? catalogStats(stats, catalog) : null), [stats, catalog]);
  const accent = stats ? rankOf(stats.user.rating).color : '#2a4bd7';

  const go = (h) => {
    if (h === handle) setReload((n) => n + 1); // mismo handle: recargar datos
    location.hash = `/${encodeURIComponent(h)}`;
  };

  return (
    <AccentCtx.Provider value={accent}>
      <div className="app" style={{ '--accent': accent }}>
        <header className="topbar">
          <a className="brand" href="#/">Perfil CF</a>
          <SearchBar initial={handle} onSubmit={go} recents={recents} />
        </header>

        {state.status === 'idle' && (
          <main className="landing">
            <h1>Todo lo que dice tu historial de Codeforces</h1>
            <p>Escribe un handle y obtén rating, concursos, problemas por dificultad y etiqueta, rachas, calendario de actividad y mucho más.</p>
            <div className="examples">
              {EXAMPLES.map((e) => (
                <button key={e} onClick={() => go(e)}>{e}</button>
              ))}
            </div>
          </main>
        )}

        {state.status === 'loading' && (
          <main className="status" role="status">
            <div className="spinner" />
            <p>Cargando <b>{handle}</b>…</p>
            <span>{state.step}</span>
          </main>
        )}

        {state.status === 'error' && (
          <main className="status error" role="alert">
            <p>No se pudo cargar «{handle}».</p>
            <span>{state.message}. Revisa que el handle esté bien escrito y que tengas conexión.</span>
          </main>
        )}

        {stats && (
          <main>
            <Hero stats={stats} />
            <nav className="tabs" role="tablist">
              {TABS.map(([id, label]) => (
                <button key={id} role="tab" aria-selected={tab === id} className={tab === id ? 'on' : ''} onClick={() => setTab(id)}>
                  {label}
                </button>
              ))}
            </nav>
            <div className="panel">
              {tab === 'resumen' && <Resumen s={stats} cat={cat} />}
              {tab === 'concursos' && <Concursos s={stats} />}
              {tab === 'problemas' && <Problemas s={stats} cat={cat} />}
              {tab === 'actividad' && <Actividad s={stats} />}
              {tab === 'envios' && (
                <Card title="Últimos envíos" sub="Los 150 más recientes. Haz clic en el veredicto para abrir el envío en Codeforces.">
                  <SubmissionsTable subs={stats.recent} />
                </Card>
              )}
            </div>
            <footer>Datos de la API pública de Codeforces. Las horas se muestran en la zona horaria de tu navegador.</footer>
          </main>
        )}
      </div>
    </AccentCtx.Provider>
  );
}
