import { rankByName, rankOf, nextRank, fmtDate, num } from '../theme.js';

const photo = (u) => (u?.startsWith('//') ? `https:${u}` : u);

export default function Hero({ stats }) {
  const { user } = stats;
  const cur = user.rating;
  const rank = rankOf(cur);
  const maxRank = rankByName(user.maxRank);
  const next = nextRank(cur);
  const progress = next ? ((cur - rank.min) / (next.min - rank.min)) * 100 : 100;
  const place = [user.city, user.country].filter(Boolean).join(', ');

  const facts = [
    place && ['Ubicación', place],
    user.organization && ['Organización', user.organization],
    ['Contribución', `${user.contribution > 0 ? '+' : ''}${user.contribution}`],
    ['Amigos', num(user.friendOfCount)],
    ['Registro', fmtDate(user.registrationTimeSeconds)],
    ['Última conexión', fmtDate(user.lastOnlineTimeSeconds)],
  ].filter(Boolean);

  return (
    <section className="hero">
      <img className="avatar" src={photo(user.titlePhoto || user.avatar)} alt={`Foto de ${user.handle}`} />
      <div className="hero-main">
        <p className="hero-rank">{user.rank ? user.rank : 'Sin rating'}</p>
        <h1>
          <a href={`https://codeforces.com/profile/${user.handle}`} target="_blank" rel="noreferrer">
            {user.handle}
          </a>
        </h1>
        {(user.firstName || user.lastName) && (
          <p className="hero-name">{[user.firstName, user.lastName].filter(Boolean).join(' ')}</p>
        )}
        <dl className="facts">
          {facts.map(([k, v]) => (
            <div key={k}>
              <dt>{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>
      </div>
      <div className="hero-rating">
        <div className="big-rating">{cur ?? '—'}</div>
        <div className="rating-sub">
          máximo <b style={{ color: maxRank.color }}>{user.maxRating ?? '—'}</b>
          {user.maxRank && <span> ({user.maxRank})</span>}
        </div>
        {cur != null && (
          <div className="progress" title="Avance hacia el siguiente rango">
            <div className="progress-bar">
              <div style={{ width: `${Math.max(2, progress)}%` }} />
            </div>
            <span>
              {next ? `${next.min - cur} puntos para ${next.name}` : 'Rango máximo alcanzado'}
            </span>
          </div>
        )}
      </div>
    </section>
  );
}
