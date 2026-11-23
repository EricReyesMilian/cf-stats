const BASE = 'https://codeforces.com/api';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function call(method, params = {}, retries = 2) {
  const qs = new URLSearchParams(params).toString();
  let lastErr;
  for (let i = 0; i <= retries; i++) {
    try {
      const res = await fetch(`${BASE}/${method}?${qs}`);
      const json = await res.json();
      if (json.status !== 'OK') {
        const err = new Error(json.comment || 'Error desconocido de la API');
        // Errores definitivos (handle inexistente, etc.): no reintentar.
        if (!/limit exceeded/i.test(json.comment || '')) {
          err.final = true;
          throw err;
        }
        throw err;
      }
      return json.result;
    } catch (e) {
      lastErr = e;
      if (e.final) break;
      await sleep(900 * (i + 1));
    }
  }
  throw lastErr;
}

export async function fetchUser(handle, onStep = () => {}) {
  onStep('Perfil');
  const info = await call('user.info', { handles: handle });
  const user = info[0];
  onStep('Historial de rating');
  const rating = await call('user.rating', { handle: user.handle });
  onStep('Envíos (puede tardar si hay muchos)');
  const subs = await call('user.status', { handle: user.handle });
  return { user, rating, subs };
}

let catalogCache = null;
export async function fetchCatalog() {
  if (catalogCache) return catalogCache;
  const r = await call('problemset.problems');
  const solved = new Map();
  for (const s of r.problemStatistics) solved.set(`${s.contestId}-${s.index}`, s.solvedCount);
  catalogCache = { problems: r.problems, solved };
  return catalogCache;
}
