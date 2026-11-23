import { createContext, useContext } from 'react';

// Rangos oficiales de Codeforces con colores un poco más profundos para fondo claro.
export const RANKS = [
  { name: 'Newbie', min: 0, color: '#7d7d7d' },
  { name: 'Pupil', min: 1200, color: '#1f8a1f' },
  { name: 'Specialist', min: 1400, color: '#03a89e' },
  { name: 'Expert', min: 1600, color: '#2a4bd7' },
  { name: 'Candidate Master', min: 1900, color: '#a100a1' },
  { name: 'Master', min: 2100, color: '#f07d00' },
  { name: 'International Master', min: 2300, color: '#f07d00' },
  { name: 'Grandmaster', min: 2400, color: '#e0201b' },
  { name: 'International Grandmaster', min: 2600, color: '#e0201b' },
  { name: 'Legendary Grandmaster', min: 3000, color: '#b3120d' },
];

export const UNRATED = { name: 'Sin rating', min: 0, color: '#4f5b78' };

export function rankOf(rating) {
  if (rating == null) return UNRATED;
  let r = RANKS[0];
  for (const x of RANKS) if (rating >= x.min) r = x;
  return r;
}

export function nextRank(rating) {
  if (rating == null) return null;
  return RANKS.find((r) => r.min > rating) || null;
}

export function rankByName(name) {
  if (!name) return UNRATED;
  return RANKS.find((r) => r.name.toLowerCase() === name.toLowerCase()) || UNRATED;
}

export const PALETTE = [
  '#2a4bd7', '#03a89e', '#f07d00', '#a100a1', '#e0201b',
  '#1f8a1f', '#0b7285', '#c2a100', '#6741d9', '#7d7d7d',
];

export const AccentCtx = createContext('#2a4bd7');
export const useAccent = () => useContext(AccentCtx);

export const VERDICTS = {
  OK: { label: 'Aceptado', color: '#1f9d55' },
  WRONG_ANSWER: { label: 'Respuesta incorrecta', color: '#e0201b' },
  TIME_LIMIT_EXCEEDED: { label: 'Tiempo excedido', color: '#f07d00' },
  MEMORY_LIMIT_EXCEEDED: { label: 'Memoria excedida', color: '#a100a1' },
  RUNTIME_ERROR: { label: 'Error de ejecución', color: '#2a4bd7' },
  COMPILATION_ERROR: { label: 'Error de compilación', color: '#7d7d7d' },
  IDLENESS_LIMIT_EXCEEDED: { label: 'Inactividad excedida', color: '#c2a100' },
  PRESENTATION_ERROR: { label: 'Error de presentación', color: '#0b7285' },
  CHALLENGED: { label: 'Hackeado', color: '#8c1c13' },
  PARTIAL: { label: 'Parcial', color: '#6741d9' },
  CRASHED: { label: 'Crash', color: '#5c1a1a' },
  FAILED: { label: 'Fallido', color: '#444' },
  REJECTED: { label: 'Rechazado', color: '#666' },
  SKIPPED: { label: 'Omitido', color: '#999' },
  TESTING: { label: 'En evaluación', color: '#bbb' },
};

export const verdictInfo = (v) => VERDICTS[v] || { label: v, color: '#999' };

export const fmtDate = (sec) =>
  new Date(sec * 1000).toLocaleDateString('es', { year: 'numeric', month: 'short', day: 'numeric' });
export const fmtDateTime = (sec) =>
  new Date(sec * 1000).toLocaleString('es', { dateStyle: 'medium', timeStyle: 'short' });
export const num = (n) => (n == null ? '—' : n.toLocaleString('es'));
export const pct = (a, b, d = 1) => (b ? `${((a / b) * 100).toFixed(d)}%` : '—');
