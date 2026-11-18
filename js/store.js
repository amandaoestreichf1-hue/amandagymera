// ============================================================
// Estado do app + datas. Tudo fica salvo no próprio celular (localStorage).
// ============================================================

const KEY = 'mygymera:v1';

// ---------- Datas (sempre no fuso local, semana começa na segunda) ----------
export const pad = (n) => String(n).padStart(2, '0');
export const toKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const fromKey = (k) => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); };
export const addDays = (k, n) => { const d = fromKey(k); d.setDate(d.getDate() + n); return toKey(d); };
export const dowOf = (k) => fromKey(k).getDay();
export const todayKey = () => toKey(new Date());
export function weekStart(k) {
  const dow = dowOf(k);
  return addDays(k, dow === 0 ? -6 : 1 - dow);
}
export const weekDays = (wk) => Array.from({ length: 7 }, (_, i) => addDays(wk, i));
export const daysBetween = (a, b) => Math.round((fromKey(b) - fromKey(a)) / 86400000);

export const uid = () => Math.random().toString(36).slice(2, 10);

// ---------- Estado padrão ----------
export function defaultState() {
  return {
    version: 1,
    createdAt: todayKey(),
    settings: {
      name: 'Amanda',
      goal: 'secar',
      goalEnd: `${new Date().getFullYear()}-12-31`,
      goalPerWeek: 5,       // meta final de treinos por semana
      startPerWeek: 3,      // primeira semana
      minPerWeek: 2,
      step: 1,              // progressão: +1 por semana
      trainDays: [1, 2, 3, 4, 5, 6],   // dias em que pode treinar
      restPref: [0, 6],                // dias que o app prefere deixar de descanso
      studioDays: [1],                 // dias reservados pra estúdio (segunda à noite)
      homeDays: [4],                   // dias de treino em casa/prédio (quinta)
      timeWeekday: '18:00',
      timeWeekend: '10:00',
      enabled: ['tonus', 'race', 'vidya_flow', 'vidya_sculpt', 'vidya_stretch', 'gym', 'incline', 'swim', 'home'],
      weight: 59,
      height: 162,
      sweat: { name: 'Musculação fechado', condition: 'Moderado, 22 °C', rateMin: 354, rateMax: 446, naMin: 580, naMax: 1081 },
    },
    plan: {},   // { 'YYYY-MM-DD': [entry] }
    weeks: {},  // { weekKey: { target, finalized } }
    unlocked: {}, // { achievementId: dateKey }
    seen: {},     // mensagens já vistas (ex.: resumo da semana)
  };
}

let state = load();

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const s = JSON.parse(raw);
      const d = defaultState();
      return { ...d, ...s, settings: { ...d.settings, ...s.settings, sweat: { ...d.settings.sweat, ...(s.settings?.sweat || {}) } } };
    }
  } catch (e) { console.warn('load failed', e); }
  return defaultState();
}

export const getState = () => state;
export function save() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { console.warn('save failed', e); }
}
export function replaceState(s) { state = s; save(); }
export function resetState() { state = defaultState(); save(); }

// ---------- Helpers de plano ----------
export const entriesOn = (k) => state.plan[k] || [];
export function setEntries(k, list) {
  if (list.length) state.plan[k] = list; else delete state.plan[k];
}
export function findEntry(id) {
  for (const [k, list] of Object.entries(state.plan)) {
    const e = list.find((x) => x.id === id);
    if (e) return e;
  }
  return null;
}
export function allEntries() {
  const out = [];
  for (const list of Object.values(state.plan)) out.push(...list);
  return out.sort((a, b) => (a.date + (a.time || '')).localeCompare(b.date + (b.time || '')));
}
export const doneEntries = () => allEntries().filter((e) => e.status === 'done');

export function weekEntries(wk) {
  return weekDays(wk).flatMap((k) => entriesOn(k));
}
export const doneInWeek = (wk) => weekEntries(wk).filter((e) => e.status === 'done').length;

/** Status visual: done | skipped | missed | planned */
export function statusOf(e, today = todayKey()) {
  if (e.status === 'done' || e.status === 'skipped') return e.status;
  return e.date < today ? 'missed' : 'planned';
}

// ---------- Backup ----------
export function exportJSON() {
  return JSON.stringify({ app: 'mygymera', exportedAt: new Date().toISOString(), state }, null, 2);
}
export function importJSON(text) {
  const data = JSON.parse(text);
  const s = data.state || data;
  if (!s.settings || !s.plan) throw new Error('Arquivo não parece ser um backup do My Gym Era');
  const d = defaultState();
  replaceState({ ...d, ...s, settings: { ...d.settings, ...s.settings } });
}
