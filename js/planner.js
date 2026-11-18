// ============================================================
// Planejador: monta a semana ideal, respeita o que você fixou e
// reajusta o resto quando algo muda.
// ============================================================
import { ACTIVITIES, GOALS, classTimes, focusOf } from './data.js';
import {
  getState, save, todayKey, weekStart, weekDays, addDays, dowOf, uid,
  entriesOn, setEntries, findEntry, weekEntries, doneInWeek, statusOf,
} from './store.js';

const toMin = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };

export function prefTime(dow) {
  const s = getState().settings;
  return dow === 0 || dow === 6 ? s.timeWeekend : s.timeWeekday;
}

/** Horário mais próximo do preferido para uma aula */
export function bestTime(actId, dow, near) {
  const times = classTimes(actId, dow);
  const target = toMin(near || prefTime(dow));
  if (!times.length) return { time: near || prefTime(dow), off: 0 };
  let best = times[0], off = Infinity;
  for (const t of times) {
    const d = Math.abs(toMin(t) - target);
    if (d < off) { off = d; best = t; }
  }
  return { time: best, off };
}

const GROUP = { lower: 'legs', glutes: 'legs', upper: 'arms', core: 'core', full: 'full' };

function matchScore(slot, o) {
  if (o.cat === slot.cat) {
    if (!slot.focus) return 13;
    if (o.focus === slot.focus) return 16;
    if (GROUP[o.focus] && GROUP[o.focus] === GROUP[slot.focus]) return 13;
    if (o.focus === 'full') return 11;
    return 6;
  }
  if (slot.cat === 'strength' && o.cat === 'hiit' && o.focus === slot.focus) return 7;
  if (slot.cat === 'cardio' && (o.cat === 'swim' || o.cat === 'hiit')) return 9;
  if (slot.cat === 'hiit' && o.cat === 'cardio') return 5;
  return 0;
}

function dayOptions(k) {
  const s = getState().settings;
  const dow = dowOf(k);
  const opts = [];
  for (const actId of s.enabled) {
    const a = ACTIVITIES[actId];
    if (!a || a.light) continue;
    let time = prefTime(dow), off = 0;
    if (a.place === 'studio') {
      if (!classTimes(actId, dow).length) continue;
      ({ time, off } = bestTime(actId, dow));
    }
    const focuses = a.chooseFocus || [focusOf(actId, dow)];
    for (const f of focuses) opts.push({ act: actId, focus: f, cat: a.cat, place: a.place, time, off });
  }
  return opts;
}

function placeScore(o, dow) {
  const s = getState().settings;
  let sc = 0;
  if (s.studioDays.includes(dow)) sc += o.place === 'studio' ? 5 : -14;
  else if (s.homeDays.includes(dow)) sc += o.place === 'home' ? 5 : -12;
  else sc += o.place === 'studio' ? 2 : o.place === 'other' ? -1 : 0;
  sc -= Math.min(5, o.off / 30);
  return sc;
}

function entryShape(e) {
  const a = ACTIVITIES[e.act];
  return { act: e.act, cat: a?.cat || 'strength', focus: e.focus || focusOf(e.act, dowOf(e.date)) };
}

/** Penalidades por combinações ruins em dias seguidos */
function adjacency(seq) {
  // seq: array de 7 posições, cada uma null ou { act, cat, focus }
  let sc = 0, run = 0;
  const actCount = {};
  for (let i = 0; i < 7; i++) {
    const c = seq[i];
    if (!c) { run = 0; continue; }
    run++;
    if (run > 5) sc -= 4;
    actCount[c.act] = (actCount[c.act] || 0) + 1;
    if (actCount[c.act] > 2) sc -= 3;
    const p = i > 0 ? seq[i - 1] : null;
    if (!p) continue;
    const muscular = (x) => x.cat === 'strength' || x.cat === 'hiit';
    if (muscular(c) && muscular(p)) {
      const g1 = GROUP[c.focus], g2 = GROUP[p.focus];
      if (g1 && g1 === g2 && g1 !== 'full') sc -= 8;
      else if (g1 === 'full' || g2 === 'full') sc -= 1;
    }
    if (c.cat === 'hiit' && p.cat === 'hiit') sc -= 5;
    if (c.act === p.act) sc -= 2;
  }
  return sc;
}

function* combinations(arr, k, start = 0, acc = []) {
  if (acc.length === k) { yield acc.slice(); return; }
  for (let i = start; i <= arr.length - (k - acc.length); i++) {
    acc.push(arr[i]); yield* combinations(arr, k, i + 1, acc); acc.pop();
  }
}
function* permutations(arr) {
  if (arr.length <= 1) { yield arr.slice(); return; }
  const seen = new Set();
  for (let i = 0; i < arr.length; i++) {
    if (seen.has(arr[i])) continue;
    seen.add(arr[i]);
    const rest = arr.slice(0, i).concat(arr.slice(i + 1));
    for (const p of permutations(rest)) yield [arr[i], ...p];
  }
}

// ---------- Meta da semana (progressão gradual) ----------
export function computeTarget(wk) {
  const st = getState();
  const s = st.settings;
  const cur = weekStart(todayKey());
  const prev = addDays(wk, -7);
  let t;
  if (!st.weeks[prev]) t = s.startPerWeek;
  else {
    const base = prev < cur ? doneInWeek(prev) : st.weeks[prev].target;
    t = base >= s.goalPerWeek ? s.goalPerWeek : base + s.step;
  }
  return Math.max(s.minPerWeek, Math.min(s.goalPerWeek, t));
}

function slotTemplate(wk) {
  const st = getState();
  const goal = GOALS[st.settings.goal] || GOALS.secar;
  const slots = goal.slots.map((x, i) => ({ ...x, key: i }));
  // treino que não rolou na semana passada ganha prioridade nesta
  const prev = addDays(wk, -7);
  if (prev < weekStart(todayKey())) {
    const missed = weekEntries(prev).filter((e) => ['missed', 'skipped'].includes(statusOf(e)));
    for (const e of missed.reverse()) {
      const sh = entryShape(e);
      let bi = -1, bs = 0;
      slots.forEach((sl, i) => { const m = matchScore(sl, sh); if (m > bs) { bs = m; bi = i; } });
      if (bi > 0) slots.unshift(slots.splice(bi, 1)[0]);
    }
  }
  return slots;
}

/**
 * (Re)planeja uma semana. Mantém: dias passados, treinos feitos/pulados,
 * treinos que você fixou e dias que você marcou como descanso.
 */
export function planWeek(wk) {
  const st = getState();
  const s = st.settings;
  const today = todayKey();
  const meta = st.weeks[wk] || (st.weeks[wk] = { target: computeTarget(wk) });
  const days = weekDays(wk);
  st.restLocks = st.restLocks || {};

  // 1. remove sugestões automáticas futuras
  for (const k of days) {
    if (k < today) continue;
    setEntries(k, entriesOn(k).filter((e) => e.locked || e.status !== 'planned'));
  }

  // 2. o que já conta para a meta
  const counted = weekEntries(wk).filter((e) => {
    const stt = statusOf(e, today);
    return stt === 'done' || stt === 'planned';
  });
  let slots = slotTemplate(wk);
  for (const e of counted) {
    const sh = entryShape(e);
    let bi = -1, bs = -1;
    slots.forEach((sl, i) => { const m = matchScore(sl, sh); if (m > bs) { bs = m; bi = i; } });
    if (bi >= 0) slots.splice(bi, 1);
  }
  const remaining = Math.max(0, meta.target - counted.length);

  // 3. dias livres
  const free = days.filter((k) => k >= today && s.trainDays.includes(dowOf(k)) && !entriesOn(k).length && !st.restLocks[k]);
  const n = Math.min(remaining, free.length, slots.length);
  if (n > 0) {
    slots = slots.slice(0, n);
    // melhor opção local para cada (dia, slot)
    const best = {};
    for (const k of free) {
      const opts = dayOptions(k);
      const dow = dowOf(k);
      best[k] = slots.map((sl) => {
        let bo = null, bsc = -Infinity;
        for (const o of opts) {
          const m = matchScore(sl, o);
          if (m <= 0) continue;
          const sc = m + placeScore(o, dow);
          if (sc > bsc) { bsc = sc; bo = o; }
        }
        return { o: bo, sc: bo ? bsc : -50 };
      });
    }
    const fixedSeq = days.map((k) => {
      const list = entriesOn(k).filter((e) => e.status !== 'skipped');
      return list.length ? entryShape(list[0]) : null;
    });
    const dayPref = (k) => {
      const dow = dowOf(k);
      const i = s.restPref.indexOf(dow);
      return i === -1 ? 0 : -(4 - i);
    };

    let bestTotal = -Infinity, bestAssign = null;
    const idx = slots.map((_, i) => i);
    for (const combo of combinations(free, n)) {
      const base = combo.reduce((a, k) => a + dayPref(k), 0);
      for (const perm of permutations(idx)) {
        let total = base;
        const seq = fixedSeq.slice();
        for (let j = 0; j < n; j++) {
          const k = combo[j];
          const cell = best[k][perm[j]];
          total += cell.sc;
          if (cell.o) seq[days.indexOf(k)] = cell.o;
        }
        total += adjacency(seq);
        if (total > bestTotal) { bestTotal = total; bestAssign = combo.map((k, j) => [k, best[k][perm[j]].o]); }
      }
    }
    for (const [k, o] of bestAssign || []) {
      if (!o) continue;
      const a = ACTIVITIES[o.act];
      setEntries(k, [...entriesOn(k), {
        id: uid(), date: k, act: o.act, focus: a.chooseFocus ? o.focus : undefined,
        time: o.time, dur: a.dur, status: 'planned', locked: false,
      }]);
    }
  }
}

const HORIZON_WEEKS = 9;

/** Garante semana atual finalizada e semanas futuras sugeridas */
export function ensurePlans(untilKey) {
  const st = getState();
  const cur = weekStart(todayKey());
  if (!st.weeks[cur] || !st.weeks[cur].finalized) {
    st.weeks[cur] = { target: computeTarget(cur), finalized: true };
    planWeek(cur);
  }
  refreshFuture(untilKey);
  save();
}

export function refreshFuture(untilKey) {
  const st = getState();
  const cur = weekStart(todayKey());
  let last = addDays(cur, 7 * 4);
  const maxWk = addDays(cur, 7 * HORIZON_WEEKS);
  const want = untilKey ? weekStart(untilKey) : null;
  if (want && want > last) last = want < maxWk ? want : maxWk;
  // semanas futuras já existentes também são recalculadas
  for (const k of Object.keys(st.weeks)) if (k > last && k <= maxWk) last = k;
  for (let wk = addDays(cur, 7); wk <= last; wk = addDays(wk, 7)) {
    st.weeks[wk] = { ...(st.weeks[wk] || {}), target: computeTarget(wk), finalized: false };
    planWeek(wk);
  }
}

/** Depois de qualquer mudança: reajusta a semana afetada e as futuras */
export function rebalance(dateKey) {
  const wk = weekStart(dateKey);
  const cur = weekStart(todayKey());
  if (wk >= cur) planWeek(wk);
  refreshFuture();
  save();
}

// ---------- Ações do usuário ----------
export function setStatus(id, status, extra = {}) {
  const e = findEntry(id);
  if (!e) return;
  e.status = status;
  e.locked = true;
  Object.assign(e, extra);
  if (status === 'done') e.doneAt = new Date().toISOString();
  rebalance(e.date);
}

export function replaceEntry(dateKey, entryId, actId, focus, time) {
  const a = ACTIVITIES[actId];
  const dow = dowOf(dateKey);
  const t = time || bestTime(actId, dow).time;
  const st = getState();
  if (st.restLocks) delete st.restLocks[dateKey];
  const list = entriesOn(dateKey);
  const e = entryId && list.find((x) => x.id === entryId);
  if (e) {
    Object.assign(e, { act: actId, focus: a.chooseFocus ? focus || a.chooseFocus[0] : undefined, time: t, dur: a.dur, locked: true });
  } else {
    list.push({ id: uid(), date: dateKey, act: actId, focus: a.chooseFocus ? focus || a.chooseFocus[0] : undefined, time: t, dur: a.dur, status: 'planned', locked: true });
    setEntries(dateKey, list);
  }
  rebalance(dateKey);
}

export function addDone(dateKey, actId, focus, time) {
  const a = ACTIVITIES[actId];
  const list = entriesOn(dateKey);
  list.push({
    id: uid(), date: dateKey, act: actId, focus: a.chooseFocus ? focus || a.chooseFocus[0] : undefined,
    time: time || bestTime(actId, dowOf(dateKey)).time, dur: a.dur, status: 'done', locked: true, extra: true,
    doneAt: new Date().toISOString(),
  });
  setEntries(dateKey, list);
  rebalance(dateKey);
}

export function updateEntry(id, patch) {
  const e = findEntry(id);
  if (!e) return;
  Object.assign(e, patch);
  save();
}

export function deleteEntry(id, makeRest = true) {
  const e = findEntry(id);
  if (!e) return;
  setEntries(e.date, entriesOn(e.date).filter((x) => x.id !== id));
  if (makeRest && !entriesOn(e.date).length) {
    const st = getState();
    st.restLocks = st.restLocks || {};
    st.restLocks[e.date] = true;
  }
  rebalance(e.date);
}

export function unlockRest(dateKey) {
  const st = getState();
  if (st.restLocks) delete st.restLocks[dateKey];
  rebalance(dateKey);
}

/** Arrastar um treino para outro dia (troca se o destino já tiver um treino planejado) */
export function moveEntry(id, toDate) {
  const e = findEntry(id);
  if (!e || e.date === toDate) return false;
  const from = e.date;
  const st = getState();
  st.restLocks = st.restLocks || {};
  delete st.restLocks[toDate];
  const fromList = entriesOn(from).filter((x) => x.id !== id);
  const toList = entriesOn(toDate);
  const swap = toList.find((x) => x.status === 'planned');
  const wkend = (k) => [0, 6].includes(dowOf(k));
  const retime = (x, k) => {
    const dow = dowOf(k);
    const near = wkend(k) === wkend(x.date) ? x.time : undefined;
    x.date = k;
    x.time = classTimes(x.act, dow).length ? bestTime(x.act, dow, near).time : near || prefTime(dow);
  };
  if (swap && from >= todayKey()) {
    setEntries(toDate, toList.filter((x) => x.id !== swap.id));
    retime(swap, from);
    swap.locked = true;
    fromList.push(swap);
  }
  retime(e, toDate);
  e.locked = true;
  setEntries(from, fromList);
  setEntries(toDate, [...entriesOn(toDate), e]);
  if (!fromList.length) st.restLocks[from] = true;
  rebalance(toDate);
  if (weekStart(from) !== weekStart(toDate)) rebalance(from);
  return true;
}

/** Joga fora o que você fixou na semana e deixa o app sugerir de novo */
export function resetWeek(wk) {
  const st = getState();
  const today = todayKey();
  for (const k of weekDays(wk)) {
    if (k < today) continue;
    if (st.restLocks) delete st.restLocks[k];
    setEntries(k, entriesOn(k).filter((e) => e.status !== 'planned'));
  }
  if (wk === weekStart(today)) st.weeks[wk].target = computeTarget(wk);
  rebalance(wk);
}

export function snapshot() {
  const st = getState();
  return JSON.stringify({ plan: st.plan, weeks: st.weeks, restLocks: st.restLocks || {} });
}
export function restore(snap) {
  const st = getState();
  const s = JSON.parse(snap);
  st.plan = s.plan; st.weeks = s.weeks; st.restLocks = s.restLocks;
  save();
}
