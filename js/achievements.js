// ============================================================
// Conquistas & estatísticas
// ============================================================
import { ACTIVITIES, focusOf } from './data.js';
import { getState, save, doneEntries, weekStart, addDays, todayKey, daysBetween, dowOf } from './store.js';

const GROUP = { lower: 'legs', glutes: 'legs', upper: 'arms', core: 'core' };

export function computeStats() {
  const st = getState();
  const done = doneEntries();
  const byAct = {}, byCat = {}, byWeek = {}, weekActs = {}, weekGroups = {};
  let hot = 0, evening = 0, hydrated = 0, weekend = 0, comeback = false;
  let prevDate = null;
  for (const e of done) {
    const a = ACTIVITIES[e.act] || {};
    byAct[e.act] = (byAct[e.act] || 0) + 1;
    byCat[a.cat] = (byCat[a.cat] || 0) + 1;
    const wk = weekStart(e.date);
    byWeek[wk] = (byWeek[wk] || 0) + 1;
    (weekActs[wk] = weekActs[wk] || new Set()).add(e.act);
    const g = GROUP[e.focus || focusOf(e.act, dowOf(e.date))];
    if (g) (weekGroups[wk] = weekGroups[wk] || new Set()).add(g);
    if (a.hot) hot++;
    if (e.time && e.time >= '19:00') evening++;
    if (e.hydrated) hydrated++;
    const dw = dowOf(e.date);
    if (dw === 0 || dw === 6) weekend++;
    if (prevDate && daysBetween(prevDate, e.date) >= 7) comeback = true;
    prevDate = e.date;
  }

  // semanas ativas seguidas (bateu a meta da semana)
  const cur = weekStart(todayKey());
  const isActive = (wk) => (byWeek[wk] || 0) >= (st.weeks[wk]?.target || 3);
  let streak = 0;
  let wk = isActive(cur) ? cur : addDays(cur, -7);
  while (isActive(wk)) { streak++; wk = addDays(wk, -7); }
  let bestStreak = 0, run = 0;
  const weeksSorted = Object.keys(st.weeks).filter((k) => k <= cur).sort();
  for (const k of weeksSorted) { if (isActive(k)) { run++; bestStreak = Math.max(bestStreak, run); } else run = 0; }

  const raisedAndHit = weeksSorted.some((k) => {
    const prev = st.weeks[addDays(k, -7)];
    return prev && st.weeks[k].target > prev.target && isActive(k);
  });

  const lastDone = done.length ? done[done.length - 1].date : null;
  return {
    total: done.length, byAct, byCat, byWeek, hot, evening, hydrated, weekend, comeback,
    maxWeek: Math.max(0, ...Object.values(byWeek)),
    variety: Math.max(0, ...Object.values(weekActs).map((s) => s.size)),
    allBody: Object.values(weekGroups).some((s) => s.has('legs') && s.has('arms') && s.has('core')),
    streak, bestStreak, raisedAndHit,
    vidya: Object.entries(byAct).filter(([k]) => k.startsWith('vidya')).reduce((a, [, n]) => a + n, 0),
    lastDone,
    gap: lastDone ? daysBetween(lastDone, todayKey()) : null,
  };
}

export const ACHIEVEMENTS = [
  { id: 'first', icon: '🐣', name: 'Primeiro passo', desc: 'Registrou o primeiro treino', test: (s) => s.total >= 1, prog: (s) => [s.total, 1] },
  { id: 'trio', icon: '🥉', name: 'Trio', desc: '3 treinos numa mesma semana', test: (s) => s.maxWeek >= 3, prog: (s) => [s.maxWeek, 3] },
  { id: 'perfect', icon: '🏆', name: 'Semana perfeita', desc: '5 treinos numa mesma semana', test: (s) => s.maxWeek >= 5, prog: (s) => [s.maxWeek, 5] },
  { id: 'up', icon: '📈', name: 'Subindo a régua', desc: 'Bateu a meta numa semana em que ela subiu', test: (s) => s.raisedAndHit },
  { id: 'back', icon: '💖', name: 'Voltei!', desc: 'Treinou de novo depois de 7+ dias parada', test: (s) => s.comeback },
  { id: 'streak2', icon: '🔥', name: 'Pegando fogo', desc: '2 semanas ativas seguidas', test: (s) => s.bestStreak >= 2, prog: (s) => [s.bestStreak, 2] },
  { id: 'streak4', icon: '🌋', name: 'Um mês on', desc: '4 semanas ativas seguidas', test: (s) => s.bestStreak >= 4, prog: (s) => [s.bestStreak, 4] },
  { id: 'streak8', icon: '👑', name: 'Era fitness', desc: '8 semanas ativas seguidas', test: (s) => s.bestStreak >= 8, prog: (s) => [s.bestStreak, 8] },
  { id: 't10', icon: '⭐', name: '10 treinos', desc: '10 treinos no total', test: (s) => s.total >= 10, prog: (s) => [s.total, 10] },
  { id: 't25', icon: '🌟', name: '25 treinos', desc: '25 treinos no total', test: (s) => s.total >= 25, prog: (s) => [s.total, 25] },
  { id: 't50', icon: '💫', name: '50 treinos', desc: '50 treinos no total', test: (s) => s.total >= 50, prog: (s) => [s.total, 50] },
  { id: 't100', icon: '🚀', name: '100 treinos', desc: '100 treinos no total', test: (s) => s.total >= 100, prog: (s) => [s.total, 100] },
  { id: 'zen', icon: '🧘‍♀️', name: 'Zen', desc: '10 aulas no Vidya', test: (s) => s.vidya >= 10, prog: (s) => [s.vidya, 10] },
  { id: 'iron', icon: '🏋️‍♀️', name: 'Ferro', desc: '10 aulas na Tônus', test: (s) => (s.byAct.tonus || 0) >= 10, prog: (s) => [s.byAct.tonus || 0, 10] },
  { id: 'bolt', icon: '⚡', name: 'Raio', desc: '10 aulas no Race', test: (s) => (s.byAct.race || 0) >= 10, prog: (s) => [s.byAct.race || 0, 10] },
  { id: 'hot', icon: '🌶️', name: 'Calor humano', desc: '5 aulas hot', test: (s) => s.hot >= 5, prog: (s) => [s.hot, 5] },
  { id: 'fish', icon: '🐟', name: 'Peixinha', desc: '5 natações', test: (s) => (s.byAct.swim || 0) >= 5, prog: (s) => [s.byAct.swim || 0, 5] },
  { id: 'hill', icon: '⛰️', name: 'Montanhista', desc: '5 esteiras inclinadas', test: (s) => (s.byAct.incline || 0) >= 5, prog: (s) => [s.byAct.incline || 0, 5] },
  { id: 'mix', icon: '🎨', name: 'Eclética', desc: '4 modalidades diferentes na mesma semana', test: (s) => s.variety >= 4, prog: (s) => [s.variety, 4] },
  { id: 'body', icon: '🧩', name: 'Corpo todo', desc: 'Inferiores, superiores e core na mesma semana', test: (s) => s.allBody },
  { id: 'drop', icon: '💧', name: 'Gotinha', desc: 'Seguiu a hidratação em 10 treinos', test: (s) => s.hydrated >= 10, prog: (s) => [s.hydrated, 10] },
  { id: 'owl', icon: '🌙', name: 'Coruja fit', desc: '10 treinos às 19h ou mais tarde', test: (s) => s.evening >= 10, prog: (s) => [s.evening, 10] },
  { id: 'sun', icon: '🌞', name: 'Sem desculpas', desc: 'Treinou num sábado ou domingo', test: (s) => s.weekend >= 1 },
];

/** Retorna conquistas recém-desbloqueadas (e salva) */
export function checkAchievements() {
  const st = getState();
  const s = computeStats();
  const fresh = [];
  for (const a of ACHIEVEMENTS) {
    if (!st.unlocked[a.id] && a.test(s)) { st.unlocked[a.id] = todayKey(); fresh.push(a); }
  }
  if (fresh.length) save();
  return fresh;
}
