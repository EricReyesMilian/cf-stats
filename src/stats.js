// Todo el cálculo de estadísticas vive aquí, separado de la interfaz.

export const ymd = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const dayNum = (d) => Math.round(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000);
export const pkey = (p) => `${p.contestId ?? p.problemsetName ?? 'x'}-${p.index}`;

export const problemUrl = (p) =>
  p.contestId == null
    ? '#'
    : p.contestId >= 100000
    ? `https://codeforces.com/gym/${p.contestId}/problem/${p.index}`
    : `https://codeforces.com/problemset/problem/${p.contestId}/${p.index}`;

export const submissionUrl = (s) =>
  s.contestId >= 100000
    ? `https://codeforces.com/gym/${s.contestId}/submission/${s.id}`
    : `https://codeforces.com/contest/${s.contestId}/submission/${s.id}`;

export function langFamily(l = '') {
  if (/c\+\+/i.test(l)) return 'C++';
  if (/pypy/i.test(l)) return 'PyPy';
  if (/python/i.test(l)) return 'Python';
  if (/c#|mono c|\.net/i.test(l)) return 'C#';
  if (/kotlin/i.test(l)) return 'Kotlin';
  if (/javascript|node/i.test(l)) return 'JavaScript';
  if (/java/i.test(l)) return 'Java';
  if (/rust/i.test(l)) return 'Rust';
  if (/\bgo\b/i.test(l)) return 'Go';
  if (/gnu c\d|\bc11\b|\bc17\b|\bc99\b/i.test(l)) return 'C';
  if (/ruby/i.test(l)) return 'Ruby';
  if (/php/i.test(l)) return 'PHP';
  if (/haskell/i.test(l)) return 'Haskell';
  if (/ocaml/i.test(l)) return 'OCaml';
  if (/scala/i.test(l)) return 'Scala';
  if (/pascal|delphi/i.test(l)) return 'Pascal/Delphi';
  if (/perl/i.test(l)) return 'Perl';
  if (/^d\b|dmd/i.test(l)) return 'D';
  return l.split(' ')[0] || 'Otro';
}

export function contestKind(name = '') {
  if (/educational/i.test(name)) return 'Educational';
  if (/global round/i.test(name)) return 'Global Round';
  if (/codeton/i.test(name)) return 'CodeTON';
  if (/div\.?\s*1\s*\+\s*div\.?\s*2/i.test(name)) return 'Div. 1 + 2';
  if (/div\.?\s*1/i.test(name)) return 'Div. 1';
  if (/div\.?\s*2/i.test(name)) return 'Div. 2';
  if (/div\.?\s*3/i.test(name)) return 'Div. 3';
  if (/div\.?\s*4/i.test(name)) return 'Div. 4';
  if (/hello|good\s*bye|goodbye|april fools/i.test(name)) return 'Especial';
  return 'Otros';
}

function streaks(dayNums, todayNum) {
  const arr = [...dayNums].sort((a, b) => a - b);
  let best = 0;
  let run = 0;
  let prev = null;
  for (const n of arr) {
    run = prev !== null && n === prev + 1 ? run + 1 : 1;
    if (run > best) best = run;
    prev = n;
  }
  const set = new Set(arr);
  let cur = 0;
  let c = set.has(todayNum) ? todayNum : set.has(todayNum - 1) ? todayNum - 1 : null;
  while (c !== null && set.has(c)) {
    cur++;
    c--;
  }
  return { best, cur };
}

const sortDesc = (obj) =>
  Object.entries(obj)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

export function computeStats({ user, rating, subs }) {
  const sorted = [...subs].sort((a, b) => a.creationTimeSeconds - b.creationTimeSeconds);
  const now = new Date();
  const todayNum = dayNum(now);
  const nowSec = Math.floor(now.getTime() / 1000);

  const probs = new Map();
  const verdicts = {};
  const langs = {};
  const langsOk = {};
  const monthMap = new Map();
  const yearMap = new Map();
  const dow = Array(7).fill(0);
  const dowAc = Array(7).fill(0);
  const hour = Array(24).fill(0);
  const hourAc = Array(24).fill(0);
  const heat = new Map();
  const subDays = new Set();
  const acDays = new Set();
  const contestSolved = new Map();
  let maxMem = 0;
  let maxTime = 0;
  let acSubs = 0;

  for (const s of sorted) {
    const v = s.verdict || 'TESTING';
    verdicts[v] = (verdicts[v] || 0) + 1;
    const fam = langFamily(s.programmingLanguage);
    langs[fam] = (langs[fam] || 0) + 1;
    const ok = v === 'OK';
    if (ok) {
      acSubs++;
      langsOk[fam] = (langsOk[fam] || 0) + 1;
      maxMem = Math.max(maxMem, s.memoryBytes || 0);
      maxTime = Math.max(maxTime, s.timeConsumedMillis || 0);
    }

    const d = new Date(s.creationTimeSeconds * 1000);
    const dk = ymd(d);
    const h = heat.get(dk) || { n: 0, ac: 0 };
    h.n++;
    if (ok) h.ac++;
    heat.set(dk, h);
    subDays.add(dayNum(d));
    if (ok) acDays.add(dayNum(d));

    const wd = (d.getDay() + 6) % 7; // lunes = 0
    dow[wd]++;
    hour[d.getHours()]++;
    if (ok) {
      dowAc[wd]++;
      hourAc[d.getHours()]++;
    }

    const mk = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const m = monthMap.get(mk) || { key: mk, subs: 0, ac: 0, newSolved: 0 };
    m.subs++;
    if (ok) m.ac++;
    monthMap.set(mk, m);
    const y = yearMap.get(d.getFullYear()) || { year: d.getFullYear(), subs: 0, ac: 0, newSolved: 0 };
    y.subs++;
    if (ok) y.ac++;
    yearMap.set(d.getFullYear(), y);

    const k = pkey(s.problem);
    let p = probs.get(k);
    if (!p) {
      p = {
        key: k,
        problem: s.problem,
        wrong: 0,
        total: 0,
        solved: false,
        firstAt: s.creationTimeSeconds,
        lastAt: s.creationTimeSeconds,
        solvedAt: null,
        solvedIn: null,
        lang: null,
      };
      probs.set(k, p);
    }
    p.total++;
    p.lastAt = s.creationTimeSeconds;
    if (!p.solved) {
      if (ok) {
        p.solved = true;
        p.solvedAt = s.creationTimeSeconds;
        p.solvedIn = s.author?.participantType || 'PRACTICE';
        p.lang = fam;
        m.newSolved++;
        y.newSolved++;
        if (p.solvedIn === 'CONTESTANT' && s.contestId != null) {
          contestSolved.set(s.contestId, (contestSolved.get(s.contestId) || 0) + 1);
        }
      } else if (v !== 'COMPILATION_ERROR' && v !== 'TESTING') {
        p.wrong++;
      }
    }
  }

  const all = [...probs.values()];
  const solvedList = all.filter((p) => p.solved);
  const unsolvedList = all.filter((p) => !p.solved);

  // --- dificultad, etiquetas, letras ---
  const byRating = {};
  const tagSolved = {};
  const tagTried = {};
  const letters = {};
  let unratedSolved = 0;
  let ratingSum = 0;
  let ratedCount = 0;
  for (const p of all) {
    for (const t of p.problem.tags || []) {
      tagTried[t] = (tagTried[t] || 0) + 1;
      if (p.solved) tagSolved[t] = (tagSolved[t] || 0) + 1;
    }
    if (!p.solved) continue;
    const r = p.problem.rating;
    if (r == null) unratedSolved++;
    else {
      byRating[r] = (byRating[r] || 0) + 1;
      ratingSum += r;
      ratedCount++;
    }
    const L = (p.problem.index || '?')[0].toUpperCase();
    letters[L] = (letters[L] || 0) + 1;
  }
  const ratingKeys = Object.keys(byRating).map(Number);
  const maxR = ratingKeys.length ? Math.max(...ratingKeys) : 800;
  const minR = ratingKeys.length ? Math.min(...ratingKeys) : 800;
  const ratingBuckets = [];
  for (let r = Math.min(800, minR); r <= maxR; r += 100) ratingBuckets.push({ rating: r, solved: byRating[r] || 0 });

  const tagData = Object.keys(tagTried)
    .map((tag) => ({
      tag,
      solved: tagSolved[tag] || 0,
      tried: tagTried[tag],
      rate: (tagSolved[tag] || 0) / tagTried[tag],
    }))
    .sort((a, b) => b.solved - a.solved || b.tried - a.tried);

  const letterData = Object.entries(letters)
    .map(([letter, value]) => ({ letter, value }))
    .sort((a, b) => a.letter.localeCompare(b.letter));

  // --- intentos fallidos antes del AC ---
  const wrongBuckets = [0, 0, 0, 0, 0, 0];
  for (const p of solvedList) wrongBuckets[Math.min(p.wrong, 5)]++;
  const wrongDist = wrongBuckets.map((value, i) => ({
    label: i === 0 ? 'A la 1.ª' : i === 5 ? '5 o más' : `${i} fallo${i > 1 ? 's' : ''}`,
    value,
  }));
  const firstTry = wrongBuckets[0];

  const solvedIn = { contest: 0, virtual: 0, practice: 0 };
  for (const p of solvedList) {
    if (p.solvedIn === 'CONTESTANT') solvedIn.contest++;
    else if (p.solvedIn === 'VIRTUAL') solvedIn.virtual++;
    else solvedIn.practice++;
  }

  const toItem = (p) => ({
    key: p.key,
    name: p.problem.name,
    index: p.problem.index,
    contestId: p.problem.contestId,
    url: problemUrl(p.problem),
    rating: p.problem.rating,
    tags: p.problem.tags || [],
    wrong: p.wrong,
    total: p.total,
    solvedAt: p.solvedAt,
    lastAt: p.lastAt,
    lang: p.lang,
  });

  const hardest = solvedList
    .filter((p) => p.problem.rating)
    .sort((a, b) => b.problem.rating - a.problem.rating || a.solvedAt - b.solvedAt)
    .slice(0, 12)
    .map(toItem);
  const mostTries = solvedList
    .filter((p) => p.wrong > 0)
    .sort((a, b) => b.wrong - a.wrong)
    .slice(0, 12)
    .map(toItem);
  const pending = unsolvedList
    .sort((a, b) => b.total - a.total || b.lastAt - a.lastAt)
    .slice(0, 20)
    .map(toItem);

  // --- series temporales ---
  const months = [...monthMap.values()].sort((a, b) => a.key.localeCompare(b.key));
  const monthly = [];
  if (months.length) {
    const [fy, fm] = months[0].key.split('-').map(Number);
    const [ly, lm] = months[months.length - 1].key.split('-').map(Number);
    let y = fy;
    let m = fm;
    let cum = 0;
    while (y < ly || (y === ly && m <= lm)) {
      const key = `${y}-${String(m).padStart(2, '0')}`;
      const row = monthMap.get(key) || { key, subs: 0, ac: 0, newSolved: 0 };
      cum += row.newSolved;
      monthly.push({ ...row, other: row.subs - row.ac, cumulative: cum });
      m++;
      if (m > 12) {
        m = 1;
        y++;
      }
    }
  }
  const yearly = [...yearMap.values()].sort((a, b) => a.year - b.year).map((r) => ({ ...r, other: r.subs - r.ac }));
  const years = yearly.map((y) => y.year);

  const weekdayNames = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
  const dowData = dow.map((n, i) => ({ label: weekdayNames[i], subs: n, ac: dowAc[i] }));
  const hourData = hour.map((n, i) => ({ label: `${String(i).padStart(2, '0')}h`, subs: n, ac: hourAc[i] }));

  const subStreak = streaks(subDays, todayNum);
  const acStreak = streaks(acDays, todayNum);
  let bestDay = null;
  for (const [k, v] of heat) if (!bestDay || v.n > bestDay.n) bestDay = { day: k, ...v };

  const since = (days) => solvedList.filter((p) => p.solvedAt >= nowSec - days * 86400).length;

  // --- concursos ---
  const rows = rating.map((r, i) => ({
    n: i + 1,
    contestId: r.contestId,
    name: r.contestName,
    kind: contestKind(r.contestName),
    at: r.ratingUpdateTimeSeconds,
    rank: r.rank,
    oldRating: r.oldRating,
    newRating: r.newRating,
    delta: r.newRating - r.oldRating,
    solved: contestSolved.get(r.contestId) || 0,
  }));
  let contests = null;
  if (rows.length) {
    const byRank = [...rows].sort((a, b) => a.rank - b.rank);
    const byDelta = [...rows].sort((a, b) => b.delta - a.delta);
    const kinds = {};
    const perYear = {};
    for (const r of rows) {
      kinds[r.kind] = (kinds[r.kind] || 0) + 1;
      const y = new Date(r.at * 1000).getFullYear();
      perYear[y] = (perYear[y] || 0) + 1;
    }
    contests = {
      count: rows.length,
      bestRank: byRank[0],
      worstRank: byRank[byRank.length - 1],
      avgRank: rows.reduce((a, r) => a + r.rank, 0) / rows.length,
      maxUp: byDelta[0],
      maxDown: byDelta[byDelta.length - 1],
      avgDelta: rows.reduce((a, r) => a + r.delta, 0) / rows.length,
      positive: rows.filter((r) => r.delta > 0).length,
      negative: rows.filter((r) => r.delta < 0).length,
      maxRating: Math.max(...rows.map((r) => r.newRating)),
      minRating: Math.min(...rows.map((r) => r.newRating)),
      top100: rows.filter((r) => r.rank <= 100).length,
      top500: rows.filter((r) => r.rank <= 500).length,
      top1000: rows.filter((r) => r.rank <= 1000).length,
      solvedInContests: rows.reduce((a, r) => a + r.solved, 0),
      kinds: sortDesc(kinds),
      perYear: Object.entries(perYear).map(([year, value]) => ({ year, value })),
      first: rows[0],
      last: rows[rows.length - 1],
    };
  }

  const recent = [...sorted].reverse().slice(0, 150);

  return {
    user,
    rating,
    subs: sorted,
    probs,
    solvedKeys: new Set(solvedList.map((p) => p.key)),
    totals: {
      subs: sorted.length,
      acSubs,
      acRate: sorted.length ? acSubs / sorted.length : 0,
      attempted: all.length,
      solved: solvedList.length,
      unsolved: unsolvedList.length,
      firstTry,
      solvedIn,
      unratedSolved,
      avgSolvedRating: ratedCount ? ratingSum / ratedCount : null,
      maxSolvedRating: ratingKeys.length ? maxR : null,
      last7: since(7),
      last30: since(30),
      last365: since(365),
      activeDays: subDays.size,
      acDays: acDays.size,
      subsPerActiveDay: subDays.size ? sorted.length / subDays.size : 0,
      firstSub: sorted[0]?.creationTimeSeconds,
      lastSub: sorted[sorted.length - 1]?.creationTimeSeconds,
      maxMem,
      maxTime,
      bestDay,
    },
    streaks: { subs: subStreak, ac: acStreak },
    verdicts: sortDesc(verdicts),
    langs: sortDesc(langs),
    langsOk: sortDesc(langsOk),
    ratingBuckets,
    tagData,
    letterData,
    wrongDist,
    hardest,
    mostTries,
    pending,
    monthly,
    yearly,
    years,
    dowData,
    hourData,
    heat,
    contests,
    contestRows: rows,
    recent,
  };
}

// Estadísticas que requieren el catálogo completo de problemas de Codeforces.
export function catalogStats(base, catalog) {
  const totalByRating = {};
  const tagTotals = {};
  for (const p of catalog.problems) {
    if (p.rating) totalByRating[p.rating] = (totalByRating[p.rating] || 0) + 1;
    for (const t of p.tags || []) tagTotals[t] = (tagTotals[t] || 0) + 1;
  }
  const solvedByRating = {};
  for (const b of base.ratingBuckets) solvedByRating[b.rating] = b.solved;
  const coverage = [];
  for (let r = 800; r <= 3500; r += 100) {
    if (totalByRating[r]) {
      const solved = solvedByRating[r] || 0;
      coverage.push({ rating: r, solved, left: Math.max(totalByRating[r] - solved, 0), total: totalByRating[r] });
    }
  }
  const myRating = base.user.rating ?? 800;
  const lo = Math.max(800, Math.round(myRating / 100) * 100 - 100);
  const hi = lo + 300;
  const suggestions = catalog.problems
    .filter((p) => p.rating && p.rating >= lo && p.rating <= hi && !base.solvedKeys.has(pkey(p)))
    .map((p) => ({
      key: pkey(p),
      name: p.name,
      index: p.index,
      contestId: p.contestId,
      url: problemUrl(p),
      rating: p.rating,
      tags: p.tags || [],
      solversCount: catalog.solved.get(pkey(p)) || 0,
      tried: base.probs.has(pkey(p)),
    }))
    .sort((a, b) => b.solversCount - a.solversCount)
    .slice(0, 15);
  const totalProblems = catalog.problems.length;
  return { coverage, tagTotals, suggestions, totalProblems, lo, hi };
}
