// ============================================================
// My Gym Era — telas e interações
// ============================================================
import {
  ACTIVITIES, ACTIVITY_ORDER, CATEGORIES, FOCUS, GOALS, STUDIOS, DOW_SHORT, DOW_LONG, MONTHS,
  classTimes, classLabel, focusOf, SCHEDULE_UPDATED,
} from './data.js';
import {
  getState, save, todayKey, fromKey, toKey, addDays, weekStart, weekDays, dowOf, daysBetween,
  entriesOn, findEntry, weekEntries, doneInWeek, statusOf, exportJSON, importJSON, resetState,
} from './store.js';
import {
  ensurePlans, planWeek, rebalance, setStatus, replaceEntry, addDone, updateEntry, deleteEntry,
  moveEntry, resetWeek, unlockRest, snapshot, restore, bestTime, computeTarget, refreshFuture,
} from './planner.js';
import { hydrationFor, range, ml } from './hydration.js';
import { bunnySVG, mascotState, MOOD_LABEL } from './mascot.js';
import { ACHIEVEMENTS, computeStats, checkAchievements } from './achievements.js';

const $ = (sel, el = document) => el.querySelector(sel);
const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];
const view = $('#view');
const sheetRoot = $('#sheet-root');
const toastRoot = $('#toast-root');

const ui = { route: 'hoje', wk: weekStart(todayKey()), month: todayKey().slice(0, 7) };

// ---------- Formatação ----------
const fmtDay = (k) => { const d = fromKey(k); return `${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)}`; };
const fmtLong = (k) => { const d = fromKey(k); return `${DOW_LONG[d.getDay()]}, ${d.getDate()} de ${MONTHS[d.getMonth()]}`; };
const catColor = (actId) => CATEGORIES[ACTIVITIES[actId]?.cat]?.color || 'var(--ink-3)';
const studioName = (a) => (a.studio ? STUDIOS[a.studio].name : a.place === 'home' ? 'Prédio / casa' : '');
function entryTitle(e) {
  const a = ACTIVITIES[e.act];
  const dow = dowOf(e.date);
  if (a.studio === 'tonus' || a.studio === 'race') return `${a.short || a.name} · ${classLabel(e.act, dow)}`;
  if (a.chooseFocus) return `${a.name} · ${FOCUS[e.focus || a.chooseFocus[0]]}`;
  return a.name;
}
function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
}
const plural = (n, s, p) => `${n} ${n === 1 ? s : p}`;

// ---------- Roteamento ----------
function go(route) { location.hash = `#/${route}`; }
window.addEventListener('hashchange', () => { ui.route = location.hash.replace('#/', '') || 'hoje'; render(); });

function render() {
  const route = ui.route;
  if (route === 'mes') ensurePlans(`${ui.month}-28`);
  else if (route === 'semana') ensurePlans(ui.wk);
  else ensurePlans();
  const views = { hoje: viewToday, semana: viewWeek, mes: viewMonth, evolucao: viewProgress, plano: viewPlan, hidratacao: viewHydration };
  view.innerHTML = (views[route] || viewToday)();
  view.dataset.route = route;
  $$('.tab').forEach((t) => t.classList.toggle('active', t.dataset.route === route || (route === 'hidratacao' && t.dataset.route === 'plano')));
  afterRender(route);
}

// ============================================================
// HOJE
// ============================================================
function weekContext() {
  const st = getState();
  const today = todayKey();
  const wk = weekStart(today);
  const target = st.weeks[wk]?.target || computeTarget(wk);
  const list = weekEntries(wk);
  const done = list.filter((e) => e.status === 'done').length;
  const expected = list.filter((e) => e.date < today && e.status !== 'skipped').length;
  const todayList = entriesOn(today);
  const stats = computeStats();
  const prevWk = addDays(wk, -7);
  let recap = null;
  const seenKey = `recap:${wk}`;
  if (st.weeks[prevWk] && (st.seen[seenKey] === undefined || st.seen[seenKey] === today)) {
    const lastDone = doneInWeek(prevWk);
    if (st.seen[seenKey] === undefined) { st.seen[seenKey] = today; save(); }
    recap = target > lastDone ? (lastDone >= 2 ? 'weekRecapUp' : 'weekRecapLow') : 'weekRecapKeep';
    if (target > lastDone && lastDone < 2) recap = 'weekRecapLow';
  }
  const planned = todayList.filter((e) => statusOf(e) === 'planned');
  return {
    today, wk, target, done, expected, list,
    left: Math.max(0, target - done),
    doneToday: todayList.some((e) => e.status === 'done'),
    todayRest: !todayList.length,
    todayName: planned.length ? entryTitle(planned[0]) : 'descanso',
    totalDone: stats.total,
    gap: stats.gap ?? 0,
    stats,
    recap,
    lastDone: doneInWeek(prevWk),
  };
}

function viewToday() {
  const st = getState();
  const s = st.settings;
  const c = weekContext();
  const ms = mascotState({ ...c, name: s.name, treino: c.todayName });
  const line = ms.line;
  const todayList = entriesOn(c.today);
  const goal = GOALS[s.goal];
  const daysLeft = daysBetween(c.today, s.goalEnd);
  const tomorrow = addDays(c.today, 1);
  const tmr = entriesOn(tomorrow).filter((e) => statusOf(e) === 'planned');

  return `
  <header class="top">
    <div>
      <p class="eyebrow">${fmtLong(c.today)}</p>
      <h1>${greeting()}, ${s.name}!</h1>
    </div>
    <a class="goal-chip" href="#/plano">${goal.emoji} ${goal.label}${daysLeft >= 0 ? ` · ${plural(daysLeft, 'dia', 'dias')}` : ''}</a>
  </header>

  <section class="mascot-card">
    <div class="mascot-wrap" data-action="poke">${bunnySVG(ms.mood, { size: 118 })}</div>
    <div class="bubble"><p>${line}</p><span class="mood-tag">Bia está ${MOOD_LABEL[ms.mood]}</span></div>
  </section>

  ${weekStrip(c)}

  <h2 class="section-title">Hoje</h2>
  ${todayList.length ? todayList.map((e) => todayCard(e)).join('') : `
    <div class="card rest-card">
      <div class="rest-emoji">😴</div>
      <div><h3>Dia de descanso</h3><p class="muted">Recuperar também faz parte do plano.</p></div>
    </div>`}
  <div class="row-actions">
    <button class="btn btn-soft" data-action="pick" data-date="${c.today}" data-mode="done">＋ Registrar treino ${todayList.length ? 'extra' : 'mesmo assim'}</button>
  </div>

  ${tmr.length ? `
  <h2 class="section-title">Amanhã</h2>
  ${tmr.map((e) => miniCard(e)).join('')}` : ''}
  `;
}

function weekStrip(c) {
  const pct = Math.min(1, c.done / Math.max(1, c.target));
  const R = 30, C = 2 * Math.PI * R;
  const days = weekDays(c.wk).map((k) => {
    const list = entriesOn(k);
    const e = list.find((x) => x.status === 'done') || list[0];
    const stt = e ? statusOf(e) : 'rest';
    const col = e ? catColor(e.act) : 'transparent';
    return `<button class="wday ${k === c.today ? 'is-today' : ''}" data-action="day" data-date="${k}" aria-label="${DOW_LONG[dowOf(k)]}: ${e ? ACTIVITIES[e.act].name + ' ' + stt : 'descanso'}">
      <span class="wday-l">${DOW_SHORT[dowOf(k)][0]}</span>
      <span class="dot st-${stt}" style="--c:${col}">${stt === 'done' ? '✓' : stt === 'missed' || stt === 'skipped' ? '·' : ''}</span>
    </button>`;
  }).join('');
  return `
  <section class="card week-card">
    <div class="ring" role="img" aria-label="${c.done} de ${c.target} treinos na semana">
      <svg viewBox="0 0 72 72" width="72" height="72">
        <circle cx="36" cy="36" r="${R}" fill="none" stroke="var(--track)" stroke-width="8"/>
        <circle cx="36" cy="36" r="${R}" fill="none" stroke="var(--brand)" stroke-width="8" stroke-linecap="round"
          stroke-dasharray="${C}" stroke-dashoffset="${C * (1 - pct)}" transform="rotate(-90 36 36)"/>
      </svg>
      <div class="ring-txt"><b>${c.done}</b><small>/${c.target}</small></div>
    </div>
    <div class="week-info">
      <p class="eyebrow">Meta da semana</p>
      <p class="week-line">${c.done >= c.target ? 'Meta batida! 🎉' : `Faltam <b>${plural(c.left, 'treino', 'treinos')}</b>`}</p>
      <div class="wdays">${days}</div>
    </div>
  </section>`;
}

function hydraStrip(e) {
  const h = hydrationFor(e.act, e.dur);
  return `
  <button class="hydra-strip" data-action="entry" data-id="${e.id}" aria-label="Ver plano de hidratação">
    <span><small>Antes</small><b>${range(h.before)}</b></span>
    <span><small>Durante</small><b>${range(h.during)}</b></span>
    <span><small>Depois</small><b>${range(h.after)}</b></span>
    ${h.electrolyte ? '<span class="na" title="Isotônico recomendado">⚡Na</span>' : ''}
  </button>`;
}

function todayCard(e) {
  const a = ACTIVITIES[e.act];
  const stt = statusOf(e);
  return `
  <article class="card workout-card st-${stt}" style="--c:${catColor(e.act)}">
    <div class="wc-head" data-action="entry" data-id="${e.id}">
      <div class="wc-emoji">${a.emoji}</div>
      <div class="wc-main">
        <h3>${entryTitle(e)}</h3>
        <p class="muted">${e.time ? `🕒 ${e.time} · ` : ''}${e.dur} min${studioName(a) ? ` · ${studioName(a)}` : ''}</p>
      </div>
      ${stt === 'done' ? '<span class="badge ok">Feito ✓</span>' : stt === 'skipped' ? '<span class="badge">Não rolou</span>' : ''}
    </div>
    ${hydraStrip(e)}
    ${stt === 'planned' ? `
    <div class="wc-actions">
      <button class="btn btn-primary" data-action="done" data-id="${e.id}">Fiz! ✅</button>
      <button class="btn btn-ghost" data-action="swap" data-id="${e.id}" data-date="${e.date}">Trocar</button>
      <button class="btn btn-ghost" data-action="skip" data-id="${e.id}">Não deu</button>
    </div>` : stt === 'done' ? `
    <label class="toggle-line"><input type="checkbox" data-action="hydrated" data-id="${e.id}" ${e.hydrated ? 'checked' : ''}><span>Segui a hidratação 💧</span></label>` : ''}
  </article>`;
}

function miniCard(e) {
  const a = ACTIVITIES[e.act];
  const stt = statusOf(e);
  return `
  <button class="mini-card st-${stt}" style="--c:${catColor(e.act)}" data-action="entry" data-id="${e.id}">
    <span class="mc-emoji">${a.emoji}</span>
    <span class="mc-main"><b>${entryTitle(e)}</b><small>${e.time || ''}${e.time ? ' · ' : ''}${e.dur} min</small></span>
    <span class="mc-status">${stt === 'done' ? '✓' : stt === 'missed' ? 'perdido' : stt === 'skipped' ? 'não rolou' : e.locked ? '📌' : ''}</span>
  </button>`;
}

// ============================================================
// SEMANA
// ============================================================
function viewWeek() {
  const st = getState();
  const wk = ui.wk;
  const today = todayKey();
  const cur = weekStart(today);
  const target = st.weeks[wk]?.target || computeTarget(wk);
  const prevT = st.weeks[addDays(wk, -7)]?.target;
  const done = doneInWeek(wk);
  const planned = weekEntries(wk).filter((e) => ['planned', 'done'].includes(statusOf(e))).length;
  const end = addDays(wk, 6);
  const label = wk === cur ? 'Esta semana' : wk === addDays(cur, 7) ? 'Próxima semana' : wk === addDays(cur, -7) ? 'Semana passada' : `${fmtDay(wk)} – ${fmtDay(end)}`;
  let note = '';
  if (wk > cur) note = 'Sugestão: vai se ajustando conforme você treina 🐰';
  else if (wk < cur) note = done >= target ? 'Meta batida! 🎉' : `Você fez ${plural(done, 'treino', 'treinos')}.`;
  else if (prevT && target > prevT) note = `A meta subiu +${target - prevT} em relação à semana passada 📈`;

  const rows = weekDays(wk).map((k) => {
    const list = entriesOn(k);
    const past = k < today;
    const dow = dowOf(k);
    const s = st.settings;
    const tags = [];
    if (s.studioDays.includes(dow)) tags.push('<span class="tag">estúdio</span>');
    if (s.homeDays.includes(dow)) tags.push('<span class="tag">em casa</span>');
    return `
    <div class="day-row ${k === today ? 'is-today' : ''} ${past ? 'is-past' : ''}" data-date="${k}">
      <button class="day-label" data-action="day" data-date="${k}">
        <span>${DOW_SHORT[dow]}</span><b>${fromKey(k).getDate()}</b>
      </button>
      <div class="day-body">
        ${list.length ? list.map((e) => `
          <div class="drag-card st-${statusOf(e)}" style="--c:${catColor(e.act)}" data-id="${e.id}" data-draggable="${statusOf(e) === 'planned' ? 1 : 0}">
            <span class="mc-emoji">${ACTIVITIES[e.act].emoji}</span>
            <span class="mc-main"><b>${entryTitle(e)}</b><small>${e.time ? e.time + ' · ' : ''}${e.dur} min ${tags.join('')}</small></span>
            <span class="mc-status">${{ done: '✓', missed: 'perdido', skipped: 'não rolou', planned: e.locked ? '📌' : '⋮⋮' }[statusOf(e)]}</span>
          </div>`).join('') : `
          <button class="rest-slot" data-action="day" data-date="${k}">${past ? 'Descanso' : st.restLocks?.[k] ? 'Descanso (você escolheu)' : 'Descanso'} <span>${tags.join('')}</span></button>`}
      </div>
    </div>`;
  }).join('');

  return `
  <header class="top">
    <div><p class="eyebrow">Semana</p><h1>${label}</h1></div>
  </header>
  <div class="nav-row">
    <button class="icon-btn" data-action="wk" data-d="-7" aria-label="Semana anterior">‹</button>
    <div class="nav-mid">
      <b>${fmtDay(wk)} – ${fmtDay(end)}</b>
      <small>Meta: ${plural(target, 'treino', 'treinos')} · ${wk < cur ? `feitos ${done}` : `planejados ${planned}`}</small>
    </div>
    <button class="icon-btn" data-action="wk" data-d="7" aria-label="Próxima semana">›</button>
  </div>
  ${note ? `<p class="note">${note}</p>` : ''}
  <div class="week-list">${rows}</div>
  <p class="hint">Segure e arraste um treino pra outro dia. Toque pra trocar, marcar como feito ou ver a hidratação. 📌 = você fixou.</p>
  ${wk >= cur ? `<div class="row-actions">
    <button class="btn btn-soft" data-action="reset-week">✨ Sugerir a semana de novo</button>
    ${wk !== cur ? '<button class="btn btn-ghost" data-action="wk-today">Voltar pra hoje</button>' : ''}
  </div>` : `<div class="row-actions"><button class="btn btn-ghost" data-action="wk-today">Voltar pra hoje</button></div>`}
  `;
}

// ============================================================
// MÊS
// ============================================================
function viewMonth() {
  const [y, m] = ui.month.split('-').map(Number);
  const first = `${ui.month}-01`;
  const today = todayKey();
  const lastDay = new Date(y, m, 0).getDate();
  const start = weekStart(first);
  const cells = [];
  for (let k = start; ; k = addDays(k, 1)) {
    const inMonth = k.slice(0, 7) === ui.month;
    if (!inMonth && k > first && dowOf(k) === 1) break;
    cells.push(k);
  }
  let done = 0, planned = 0, missed = 0;
  const byCat = {};
  const grid = cells.map((k) => {
    const inMonth = k.slice(0, 7) === ui.month;
    const list = entriesOn(k);
    if (inMonth) for (const e of list) {
      const s = statusOf(e);
      if (s === 'done') { done++; const c = ACTIVITIES[e.act].cat; byCat[c] = (byCat[c] || 0) + 1; }
      else if (s === 'planned') planned++;
      else missed++;
    }
    const dots = list.slice(0, 3).map((e) => `<i class="mdot st-${statusOf(e)}" style="--c:${catColor(e.act)}"></i>`).join('');
    return `<button class="mcell ${inMonth ? '' : 'out'} ${k === today ? 'is-today' : ''} ${list.some((e) => e.status === 'done') ? 'has-done' : ''}" data-action="day" data-date="${k}" aria-label="${fmtLong(k)}: ${list.map((e) => ACTIVITIES[e.act].name + ' ' + statusOf(e)).join(', ') || 'descanso'}">
      <span>${fromKey(k).getDate()}</span><span class="mdots">${dots}</span>
    </button>`;
  }).join('');
  const fav = Object.entries(byCat).sort((a, b) => b[1] - a[1])[0];

  return `
  <header class="top"><div><p class="eyebrow">Calendário</p><h1>${MONTHS[m - 1][0].toUpperCase() + MONTHS[m - 1].slice(1)} ${y}</h1></div></header>
  <div class="nav-row">
    <button class="icon-btn" data-action="mo" data-d="-1" aria-label="Mês anterior">‹</button>
    <div class="nav-mid"><b>${plural(done, 'treino feito', 'treinos feitos')}</b><small>${plural(planned, 'planejado', 'planejados')} até o fim do mês</small></div>
    <button class="icon-btn" data-action="mo" data-d="1" aria-label="Próximo mês">›</button>
  </div>
  <div class="card month-card">
    <div class="mgrid head">${['S', 'T', 'Q', 'Q', 'S', 'S', 'D'].map((d) => `<span>${d}</span>`).join('')}</div>
    <div class="mgrid">${grid}</div>
  </div>
  <div class="legend">
    ${Object.entries(CATEGORIES).map(([, c]) => `<span><i style="background:${c.color}"></i>${c.label}</span>`).join('')}
  </div>
  <div class="legend legend-st">
    <span><i class="mdot st-done" style="--c:var(--ink-2)"></i>feito</span>
    <span><i class="mdot st-planned" style="--c:var(--ink-2)"></i>planejado</span>
    <span><i class="mdot st-missed" style="--c:var(--ink-2)"></i>não rolou</span>
  </div>
  <div class="tiles">
    <div class="tile"><small>Feitos</small><b>${done}</b></div>
    <div class="tile"><small>Faltando</small><b>${planned}</b></div>
    <div class="tile"><small>Favorita</small><b class="sm">${fav ? CATEGORIES[fav[0]].emoji + ' ' + CATEGORIES[fav[0]].label : '—'}</b></div>
  </div>
  `;
}

// ============================================================
// EVOLUÇÃO
// ============================================================
function viewProgress() {
  const st = getState();
  const s = computeStats();
  const cur = weekStart(todayKey());
  const weeks = Array.from({ length: 8 }, (_, i) => addDays(cur, -7 * (7 - i)));
  const data = weeks.map((wk) => ({ wk, done: doneInWeek(wk), target: st.weeks[wk]?.target || 0 }));
  const max = Math.max(5, ...data.map((d) => Math.max(d.done, d.target)));
  const W = 320, H = 170, pl = 22, pb = 26, pt = 10;
  const bw = (W - pl) / data.length;
  const y = (v) => pt + (H - pt - pb) * (1 - v / max);
  const bars = data.map((d, i) => {
    const x = pl + i * bw + bw * 0.22;
    const w = bw * 0.56;
    const top = y(d.done);
    const h = Math.max(0, H - pb - top);
    const isCur = d.wk === cur;
    const r = Math.min(4, h);
    const path = h > 0 ? `M${x},${H - pb} V${top + r} Q${x},${top} ${x + r},${top} H${x + w - r} Q${x + w},${top} ${x + w},${top + r} V${H - pb} Z` : '';
    return `
      <g class="bar-g" data-tip="${fmtDay(d.wk)}: ${plural(d.done, 'treino', 'treinos')}${d.target ? ` (meta ${d.target})` : ''}">
        <rect x="${pl + i * bw}" y="${pt}" width="${bw}" height="${H - pt - pb}" fill="transparent"/>
        ${path ? `<path d="${path}" fill="${isCur ? 'var(--brand)' : 'var(--brand-soft-strong)'}"/>` : ''}
        ${d.target ? `<line x1="${x - 3}" x2="${x + w + 3}" y1="${y(d.target)}" y2="${y(d.target)}" stroke="var(--ink-2)" stroke-width="2" stroke-dasharray="3 3"/>` : ''}
        ${d.done ? `<text x="${x + w / 2}" y="${top - 5}" text-anchor="middle" class="val">${d.done}</text>` : ''}
        <text x="${x + w / 2}" y="${H - 8}" text-anchor="middle" class="axis">${fromKey(d.wk).getDate()}/${fromKey(d.wk).getMonth() + 1}</text>
      </g>`;
  }).join('');
  const grid = [0, Math.round(max / 2), max].map((v) => `<line x1="${pl}" x2="${W}" y1="${y(v)}" y2="${y(v)}" stroke="var(--grid)"/><text x="${pl - 6}" y="${y(v) + 4}" text-anchor="end" class="axis">${v}</text>`).join('');

  // por categoria (mês atual)
  const month = todayKey().slice(0, 7);
  const catCount = {};
  for (const [k, list] of Object.entries(st.plan)) {
    if (!k.startsWith(month)) continue;
    for (const e of list) if (e.status === 'done') { const c = ACTIVITIES[e.act].cat; catCount[c] = (catCount[c] || 0) + 1; }
  }
  const cmax = Math.max(1, ...Object.values(catCount));
  const catRows = Object.entries(CATEGORIES).map(([id, c]) => {
    const n = catCount[id] || 0;
    return `<div class="hbar"><span class="hb-l">${c.emoji} ${c.label}</span><span class="hb-track"><i style="width:${(n / cmax) * 100}%;background:${c.color}"></i></span><b>${n}</b></div>`;
  }).join('');

  const unlockedN = Object.keys(st.unlocked).length;
  const ach = ACHIEVEMENTS.map((a) => {
    const got = st.unlocked[a.id];
    const p = a.prog ? a.prog(s) : null;
    return `<button class="medal ${got ? 'got' : ''}" data-action="medal" data-id="${a.id}">
      <span class="medal-ic">${a.icon}</span><b>${a.name}</b>
      ${got ? `<small>${fmtDay(got)}</small>` : p ? `<small>${Math.min(p[0], p[1])}/${p[1]}</small>` : '<small>🔒</small>'}
    </button>`;
  }).join('');

  return `
  <header class="top"><div><p class="eyebrow">Evolução</p><h1>Sua era fitness ✨</h1></div></header>
  <div class="tiles">
    <div class="tile"><small>Treinos</small><b>${s.total}</b></div>
    <div class="tile"><small>Semanas ativas seguidas</small><b>${s.streak} 🔥</b></div>
    <div class="tile"><small>Medalhas</small><b>${unlockedN}/${ACHIEVEMENTS.length}</b></div>
  </div>

  <section class="card chart-card">
    <h3>Treinos por semana</h3>
    <p class="muted small">Barras = treinos feitos · tracejado = meta da semana</p>
    <div class="chart-wrap">
      <svg viewBox="0 0 ${W} ${H}" class="chart" role="img" aria-label="Treinos por semana nas últimas 8 semanas: ${data.map((d) => `${fmtDay(d.wk)} ${d.done}`).join(', ')}">${grid}${bars}</svg>
      <div class="tip" hidden></div>
    </div>
  </section>

  <section class="card chart-card">
    <h3>Este mês por tipo</h3>
    <div class="hbars">${catRows}</div>
  </section>

  <h2 class="section-title">Medalhas</h2>
  <div class="medals">${ach}</div>
  `;
}

// ============================================================
// MEU PLANO
// ============================================================
function viewPlan() {
  const s = getState().settings;
  const dayToggles = (field) => [1, 2, 3, 4, 5, 6, 0].map((d) => `
    <button class="chip ${s[field].includes(d) ? 'on' : ''}" data-action="toggle-day" data-field="${field}" data-d="${d}">${DOW_SHORT[d]}</button>`).join('');
  const goals = Object.entries(GOALS).map(([id, g]) => `
    <button class="goal-opt ${s.goal === id ? 'on' : ''}" data-action="goal" data-id="${id}">
      <span>${g.emoji}</span><b>${g.label}</b><small>${g.desc}</small>
    </button>`).join('');
  const acts = ACTIVITY_ORDER.map((id) => {
    const a = ACTIVITIES[id];
    return `<label class="act-opt"><input type="checkbox" data-action="toggle-act" data-id="${id}" ${s.enabled.includes(id) ? 'checked' : ''}>
      <span class="ao-emoji">${a.emoji}</span><span class="ao-main"><b>${a.name}</b><small>${studioName(a) || 'Outro'} · ${a.desc}</small></span></label>`;
  }).join('');

  return `
  <header class="top"><div><p class="eyebrow">Personalização</p><h1>Meu plano 🎯</h1></div></header>

  <section class="card form-card">
    <h3>Objetivo</h3>
    <div class="goals">${goals}</div>
    <label class="field"><span>Até quando?</span><input type="date" data-action="set" data-field="goalEnd" value="${s.goalEnd}"></label>
  </section>

  <section class="card form-card">
    <h3>Ritmo</h3>
    <div class="stepper-row"><span>Meta final por semana</span>${stepper('goalPerWeek', s.goalPerWeek, 1, 7)}</div>
    <div class="stepper-row"><span>Mínimo por semana</span>${stepper('minPerWeek', s.minPerWeek, 1, 5)}</div>
    <div class="stepper-row"><span>Aumentar por semana</span>${stepper('step', s.step, 1, 3)}</div>
    <p class="muted small">Se você fizer menos que a meta, a próxima semana pede só +${s.step}. Bem gradual, sem culpa 💗</p>
  </section>

  <section class="card form-card">
    <h3>Agenda</h3>
    <p class="label">Dias em que posso treinar</p><div class="chips">${dayToggles('trainDays')}</div>
    <p class="label">Dias de estúdio (ex.: segunda à noite)</p><div class="chips">${dayToggles('studioDays')}</div>
    <p class="label">Dias em casa / prédio (ex.: quinta)</p><div class="chips">${dayToggles('homeDays')}</div>
    <p class="label">Descanso preferido</p><div class="chips">${dayToggles('restPref')}</div>
    <div class="two">
      <label class="field"><span>Horário dia útil</span><input type="time" data-action="set" data-field="timeWeekday" value="${s.timeWeekday}"></label>
      <label class="field"><span>Horário fim de semana</span><input type="time" data-action="set" data-field="timeWeekend" value="${s.timeWeekend}"></label>
    </div>
  </section>

  <section class="card form-card">
    <h3>Modalidades que o app pode sugerir</h3>
    <div class="acts">${acts}</div>
    <p class="muted small">Grades dos estúdios atualizadas em ${fmtDay(SCHEDULE_UPDATED)}. Mudou? Manda o print pro Claude 📸</p>
  </section>

  <a class="card link-card" href="#/hidratacao"><span>💧</span><div><b>Plano de hidratação</b><small>Seu perfil de suor e quanto beber em cada treino</small></div><span>›</span></a>

  <section class="card form-card">
    <h3>Você</h3>
    <div class="two">
      <label class="field"><span>Nome</span><input type="text" data-action="set" data-field="name" value="${s.name}"></label>
      <label class="field"><span>Peso (kg)</span><input type="number" inputmode="decimal" step="0.1" data-action="set" data-field="weight" value="${s.weight}"></label>
    </div>
  </section>

  <section class="card form-card">
    <h3>Backup</h3>
    <p class="muted small">Seus dados ficam só neste iPhone. Faça um backup de vez em quando 💾</p>
    <div class="row-actions">
      <button class="btn btn-soft" data-action="export">Exportar backup</button>
      <label class="btn btn-ghost">Importar<input type="file" accept="application/json,.json" data-action="import" hidden></label>
    </div>
    <button class="btn btn-danger-link" data-action="wipe">Apagar tudo e começar do zero</button>
  </section>
  <p class="foot">My Gym Era · feito com 💗 pra Amanda</p>
  `;
}
const stepper = (field, v, min, max) => `
  <div class="stepper"><button data-action="step" data-field="${field}" data-d="-1" data-min="${min}" data-max="${max}" aria-label="menos">−</button>
  <b>${v}</b><button data-action="step" data-field="${field}" data-d="1" data-min="${min}" data-max="${max}" aria-label="mais">+</button></div>`;

// ============================================================
// HIDRATAÇÃO
// ============================================================
function viewHydration() {
  const s = getState().settings;
  const sw = s.sweat;
  const rows = ACTIVITY_ORDER.filter((id) => !ACTIVITIES[id].light).map((id) => {
    const a = ACTIVITIES[id];
    const h = hydrationFor(id, a.dur);
    return `<tr><th><span class="nw">${a.emoji} ${a.name.split(' ')[0]}</span>${a.name.includes(' ') ? ' ' + a.name.split(' ').slice(1).join(' ') : ''}<small>${a.dur} min${a.hot ? ' · hot' : ''}</small></th>
      <td>${range(h.during)}</td><td>${range(h.after)}</td><td>${h.electrolyte ? '⚡' : '—'}</td></tr>`;
  }).join('');
  const w = s.weight;
  return `
  <header class="top"><div><p class="eyebrow"><a href="#/plano">‹ Meu plano</a></p><h1>Hidratação 💧</h1></div></header>
  <section class="sweat-card">
    <p class="eyebrow light">Perfil de suor · Gatorade Gx</p>
    <h3>${sw.name}</h3><p class="light">${sw.condition}</p>
    <div class="sweat-nums">
      <div><b>${sw.rateMin}–${sw.rateMax}</b><small>ml/h · taxa de suor</small></div>
      <div><b>${sw.naMin}–${sw.naMax}</b><small>mg/L · sódio</small></div>
    </div>
  </section>

  <section class="card">
    <h3>A regra geral</h3>
    <ol class="steps">
      <li><b>2–3 h antes:</b> ${ml(Math.round(5 * w / 50) * 50)}–${ml(Math.round(7 * w / 50) * 50)} (5–7 ml por kg). Mais um copinho 15 min antes.</li>
      <li><b>Durante:</b> goles a cada ~15 min, repondo uns 60–80% do que você sua.</li>
      <li><b>Depois:</b> uns 150% do que ficou faltando, ao longo de 1–2 h.</li>
      <li><b>Sódio:</b> sua concentração vai de média a alta (580–1081 mg/L). Em treino quente, longo ou HIIT, use isotônico ou eletrólito.</li>
    </ol>
  </section>

  <section class="card">
    <h3>Por modalidade</h3>
    <p class="muted small">Seu teste foi em musculação a 22 °C. Hot yoga, Race e esteira fazem você suar mais, e o app já ajusta isso.</p>
    <div class="table-wrap"><table class="htable">
      <thead><tr><th>Treino</th><th>Durante</th><th>Depois</th><th>Sódio</th></tr></thead>
      <tbody>${rows}</tbody>
    </table></div>
  </section>

  <section class="card form-card">
    <h3>Atualizar perfil</h3>
    <div class="two">
      <label class="field"><span>Suor mín (ml/h)</span><input type="number" data-action="sweat" data-field="rateMin" value="${sw.rateMin}"></label>
      <label class="field"><span>Suor máx (ml/h)</span><input type="number" data-action="sweat" data-field="rateMax" value="${sw.rateMax}"></label>
      <label class="field"><span>Sódio mín (mg/L)</span><input type="number" data-action="sweat" data-field="naMin" value="${sw.naMin}"></label>
      <label class="field"><span>Sódio máx (mg/L)</span><input type="number" data-action="sweat" data-field="naMax" value="${sw.naMax}"></label>
    </div>
  </section>
  <p class="foot">Estimativas educativas a partir do seu teste. Elas não substituem orientação de nutricionista ou médico.</p>
  `;
}

// ============================================================
// SHEETS (painéis que sobem de baixo)
// ============================================================
function openSheet(html, cls = '') {
  sheetRoot.innerHTML = `<div class="sheet-backdrop" data-action="close"></div><div class="sheet ${cls}" role="dialog" aria-modal="true"><div class="grab"></div>${html}</div>`;
  requestAnimationFrame(() => sheetRoot.classList.add('open'));
}
function closeSheet() {
  sheetRoot.classList.remove('open');
  setTimeout(() => { if (!sheetRoot.classList.contains('open')) sheetRoot.innerHTML = ''; }, 250);
}

function daySheet(k) {
  const list = entriesOn(k);
  const past = k < todayKey();
  const st = getState();
  openSheet(`
    <h2>${fmtLong(k)}</h2>
    ${list.length ? list.map((e) => entryBlock(e)).join('<hr>') : `
      <p class="muted">${st.restLocks?.[k] ? 'Você marcou esse dia como descanso.' : 'Dia de descanso.'}</p>`}
    <div class="sheet-actions">
      <button class="btn btn-soft" data-action="pick" data-date="${k}" data-mode="${past ? 'done' : 'plan'}">＋ ${past ? 'Registrar treino feito' : 'Adicionar treino'}</button>
      ${!list.length && st.restLocks?.[k] && !past ? `<button class="btn btn-ghost" data-action="unrest" data-date="${k}">Deixar o app sugerir</button>` : ''}
    </div>`);
}

function entryBlock(e) {
  const a = ACTIVITIES[e.act];
  const stt = statusOf(e);
  const dow = dowOf(e.date);
  const times = classTimes(e.act, dow);
  const h = hydrationFor(e.act, e.dur);
  const today = todayKey();
  const moveDays = weekDays(weekStart(e.date)).filter((k) => k !== e.date && k >= today);
  return `
  <div class="entry-block" style="--c:${catColor(e.act)}">
    <div class="eb-head"><span class="wc-emoji">${a.emoji}</span><div><h3>${entryTitle(e)}</h3><p class="muted">${a.desc}${studioName(a) ? ' · ' + studioName(a) : ''}</p></div></div>
    <div class="two">
      <label class="field"><span>Horário</span>${times.length ? `
        <select data-action="time" data-id="${e.id}">${times.map((t) => `<option ${t === e.time ? 'selected' : ''}>${t}</option>`).join('')}</select>` : `
        <input type="time" data-action="time" data-id="${e.id}" value="${e.time || ''}">`}</label>
      <label class="field"><span>Duração (min)</span><input type="number" inputmode="numeric" data-action="dur" data-id="${e.id}" value="${e.dur}"></label>
    </div>

    <div class="hydra-box">
      <p class="eyebrow">💧 Hidratação pra esse treino</p>
      <div class="hydra-grid">
        <div><small>2–3 h antes</small><b>${range(h.before)}</b><small>+ ${h.before.topUp} 15 min antes</small></div>
        <div><small>Durante</small><b>${range(h.during)}</b>${h.during.every ? `<small>~${h.during.every} ml a cada 15 min</small>` : ''}</div>
        <div><small>Depois</small><b>${range(h.after)}</b><small>em 1–2 h</small></div>
      </div>
      <p class="muted small">Suor estimado: ${range(h.loss)} · sódio: ${h.sodium.lo}–${h.sodium.hi} mg</p>
      ${h.tips.length ? `<ul class="tips">${h.tips.map((t) => `<li>${t}</li>`).join('')}</ul>` : ''}
    </div>

    ${stt === 'planned' || stt === 'missed' ? `
    <div class="sheet-actions">
      <button class="btn btn-primary" data-action="done" data-id="${e.id}">Fiz! ✅</button>
      ${stt === 'planned' ? `<button class="btn btn-ghost" data-action="skip" data-id="${e.id}">Não deu</button>` : ''}
    </div>` : ''}
    ${stt === 'done' ? `
      <label class="toggle-line"><input type="checkbox" data-action="hydrated" data-id="${e.id}" ${e.hydrated ? 'checked' : ''}><span>Segui a hidratação 💧</span></label>
      <div class="sheet-actions"><button class="btn btn-ghost" data-action="undo-status" data-id="${e.id}">Desmarcar como feito</button></div>` : ''}
    ${stt === 'skipped' ? `<div class="sheet-actions"><button class="btn btn-ghost" data-action="undo-status" data-id="${e.id}">Desfazer "não deu"</button><button class="btn btn-primary" data-action="done" data-id="${e.id}">Na verdade fiz! ✅</button></div>` : ''}

    ${stt === 'planned' ? `
    <div class="sheet-actions">
      <button class="btn btn-soft" data-action="swap" data-id="${e.id}" data-date="${e.date}">🔄 Trocar treino</button>
      <button class="btn btn-ghost" data-action="remove" data-id="${e.id}">Virar descanso</button>
    </div>
    ${moveDays.length ? `<p class="label">Mover para</p><div class="chips">${moveDays.map((k) => `<button class="chip" data-action="move" data-id="${e.id}" data-date="${k}">${DOW_SHORT[dowOf(k)]} ${fromKey(k).getDate()}</button>`).join('')}</div>` : ''}` : ''}
    ${stt !== 'planned' ? `<button class="btn btn-danger-link" data-action="remove" data-id="${e.id}">Apagar registro</button>` : ''}
  </div>`;
}

function pickerSheet(k, entryId, mode) {
  const dow = dowOf(k);
  const s = getState().settings;
  const groups = [
    ['Estúdios', ACTIVITY_ORDER.filter((id) => ACTIVITIES[id].place === 'studio')],
    ['Prédio / casa', ACTIVITY_ORDER.filter((id) => ACTIVITIES[id].place === 'home')],
    ['Outros', ACTIVITY_ORDER.filter((id) => ACTIVITIES[id].place === 'other')],
  ];
  const item = (id) => {
    const a = ACTIVITIES[id];
    const times = classTimes(id, dow);
    if (a.place === 'studio' && !times.length) return '';
    const sub = a.studio === 'tonus' || a.studio === 'race' ? STUDIOS[a.studio].labelByDay[dow] : a.desc;
    const t = times.length ? bestTime(id, dow).time : '';
    const focusChips = a.chooseFocus ? `<div class="chips small">${a.chooseFocus.map((f) => `<button class="chip" data-action="choose" data-act="${id}" data-focus="${f}">${FOCUS[f]}</button>`).join('')}</div>` : '';
    return `
      <div class="pick-item ${s.enabled.includes(id) ? '' : 'dim'}" style="--c:${catColor(id)}">
        <button class="pick-main" ${a.chooseFocus ? 'disabled' : `data-action="choose" data-act="${id}"`}>
          <span class="mc-emoji">${a.emoji}</span>
          <span class="mc-main"><b>${a.name}</b><small>${sub}${t ? ` · ${times.length} horários, sugiro ${t}` : ''}</small></span>
        </button>
        ${focusChips}
      </div>`;
  };
  openSheet(`
    <h2>${mode === 'done' ? 'O que você fez?' : entryId ? 'Trocar por…' : 'Adicionar treino'}</h2>
    <p class="muted">${fmtLong(k)}${mode !== 'done' ? '. Depois eu reajusto o resto da semana 🐰' : ''}</p>
    <div class="picker" data-date="${k}" data-entry="${entryId || ''}" data-mode="${mode}">
      ${groups.map(([g, ids]) => `<p class="label">${g}</p>${ids.map(item).join('')}`).join('')}
    </div>`, 'tall');
}

// ============================================================
// Toast, celebração
// ============================================================
let toastTimer;
function toast(msg, undoSnap) {
  clearTimeout(toastTimer);
  toastRoot.innerHTML = `<div class="toast"><span>${msg}</span>${undoSnap ? '<button data-action="undo">Desfazer</button>' : ''}</div>`;
  toastRoot._snap = undoSnap;
  toastRoot.classList.add('show');
  toastTimer = setTimeout(() => toastRoot.classList.remove('show'), 4500);
}

function celebrate(fresh) {
  const c = weekContext();
  const pieces = Array.from({ length: 28 }, (_, i) => `<i style="--x:${Math.random() * 100}vw;--d:${0.6 + Math.random() * 0.9}s;--r:${Math.random() * 360}deg;--c:${['#FF8FB5', '#FFC94D', '#7B5CE0', '#14A38B', '#2F7FD6'][i % 5]}"></i>`).join('');
  const msg = c.done >= c.target ? `Meta da semana batida! ${c.done}/${c.target} 🎉` : `Mais um! ${c.done}/${c.target} na semana`;
  const overlay = document.createElement('div');
  overlay.className = 'celebrate';
  overlay.innerHTML = `
    <div class="confetti">${pieces}</div>
    <div class="cel-card">
      ${bunnySVG('radiant', { size: 150, cls: 'jump' })}
      <h2>${msg}</h2>
      ${fresh.length ? `<div class="cel-medals">${fresh.map((a) => `<div class="cel-medal"><span>${a.icon}</span><b>Nova medalha: ${a.name}</b><small>${a.desc}</small></div>`).join('')}</div>` : '<p class="muted">Não esquece de beber água depois 💧</p>'}
      <button class="btn btn-primary" data-action="close-cel">Uhuul!</button>
    </div>`;
  document.body.appendChild(overlay);
  overlay.addEventListener('click', (ev) => { if (ev.target.closest('[data-action="close-cel"]') || ev.target === overlay) overlay.remove(); });
  if (navigator.vibrate) navigator.vibrate(30);
}

// ============================================================
// Eventos
// ============================================================
let suppressClick = false;
document.addEventListener('click', (ev) => {
  if (suppressClick) { suppressClick = false; ev.preventDefault(); return; }
  const t = ev.target.closest('[data-action]');
  if (!t) {
    const card = ev.target.closest('.drag-card');
    if (card) { const e = findEntry(card.dataset.id); if (e) daySheet(e.date); }
    return;
  }
  const a = t.dataset.action;
  const id = t.dataset.id;
  const date = t.dataset.date;
  const st = getState();
  const s = st.settings;

  switch (a) {
    case 'close': closeSheet(); break;
    case 'day': daySheet(date); break;
    case 'entry': { const e = findEntry(id); if (e) daySheet(e.date); break; }
    case 'poke': {
      const b = $('.bunny', t); b?.classList.remove('jump'); void b?.getBoundingClientRect(); b?.classList.add('jump');
      break;
    }
    case 'done': {
      const e = findEntry(id);
      setStatus(id, 'done');
      closeSheet();
      render();
      celebrate(checkAchievements());
      break;
    }
    case 'skip': {
      const snap = snapshot();
      setStatus(id, 'skipped');
      closeSheet(); render();
      toast('Tudo bem! Reajustei o resto da semana 💗', snap);
      break;
    }
    case 'undo-status': {
      const e = findEntry(id);
      e.status = 'planned';
      rebalance(e.date);
      closeSheet(); render();
      break;
    }
    case 'hydrated': updateEntry(id, { hydrated: t.checked }); checkAchievements(); break;
    case 'swap': pickerSheet(date, id, 'plan'); break;
    case 'pick': pickerSheet(date, null, t.dataset.mode); break;
    case 'choose': {
      const p = t.closest('.picker');
      const k = p.dataset.date, eid = p.dataset.entry, mode = p.dataset.mode;
      const snap = snapshot();
      if (mode === 'done') {
        addDone(k, t.dataset.act, t.dataset.focus);
        closeSheet(); render();
        celebrate(checkAchievements());
      } else {
        replaceEntry(k, eid || null, t.dataset.act, t.dataset.focus);
        closeSheet(); render();
        toast('Feito! Reajustei o resto da semana 🐰', snap);
      }
      break;
    }
    case 'remove': {
      const snap = snapshot();
      deleteEntry(id);
      closeSheet(); render();
      toast('Virou descanso. Reajustei a semana 😴', snap);
      break;
    }
    case 'move': {
      const snap = snapshot();
      moveEntry(id, date);
      closeSheet(); render();
      toast('Treino movido! Reajustei o resto 🐰', snap);
      break;
    }
    case 'unrest': unlockRest(date); closeSheet(); render(); break;
    case 'undo': if (toastRoot._snap) { restore(toastRoot._snap); toastRoot._snap = null; toastRoot.classList.remove('show'); render(); } break;
    case 'wk': ui.wk = addDays(ui.wk, Number(t.dataset.d)); render(); break;
    case 'wk-today': ui.wk = weekStart(todayKey()); render(); break;
    case 'mo': {
      const [y, m] = ui.month.split('-').map(Number);
      const d = new Date(y, m - 1 + Number(t.dataset.d), 1);
      ui.month = toKey(d).slice(0, 7); render(); break;
    }
    case 'reset-week': {
      const snap = snapshot();
      resetWeek(ui.wk); render();
      toast('Semana sugerida de novo ✨', snap);
      break;
    }
    case 'goal': s.goal = id; afterSettings('Objetivo atualizado! Replanejei as próximas semanas 🎯'); break;
    case 'toggle-day': {
      const f = t.dataset.field, d = Number(t.dataset.d);
      s[f] = s[f].includes(d) ? s[f].filter((x) => x !== d) : [...s[f], d];
      afterSettings();
      break;
    }
    case 'step': {
      const f = t.dataset.field;
      s[f] = Math.max(Number(t.dataset.min), Math.min(Number(t.dataset.max), s[f] + Number(t.dataset.d)));
      if (s.minPerWeek > s.goalPerWeek) s.minPerWeek = s.goalPerWeek;
      afterSettings();
      break;
    }
    case 'export': doExport(); break;
    case 'wipe':
      if (confirm('Apagar todos os treinos e configurações? Isso não tem volta.')) { resetState(); ui.wk = weekStart(todayKey()); render(); toast('Tudo zerado. Bora recomeçar! 🐰'); }
      break;
    case 'medal': {
      const m = ACHIEVEMENTS.find((x) => x.id === id);
      toast(`${m.icon} ${m.name}: ${m.desc}`);
      break;
    }
  }
});

function afterSettings(msg) {
  const st = getState();
  const cur = weekStart(todayKey());
  st.weeks[cur].target = Math.max(st.settings.minPerWeek, Math.min(st.settings.goalPerWeek, st.weeks[cur].target));
  planWeek(cur);
  refreshFuture();
  save();
  render();
  if (msg) toast(msg);
}

document.addEventListener('change', (ev) => {
  const t = ev.target;
  const a = t.dataset.action;
  const s = getState().settings;
  if (a === 'set') {
    const f = t.dataset.field;
    s[f] = t.type === 'number' ? Number(t.value) || s[f] : t.value;
    save();
    if (['timeWeekday', 'timeWeekend'].includes(f)) afterSettings('Horários atualizados 🕒');
    else render();
  } else if (a === 'sweat') {
    s.sweat[t.dataset.field] = Number(t.value) || s.sweat[t.dataset.field];
    save(); render();
  } else if (a === 'toggle-act') {
    const id = t.dataset.id;
    s.enabled = t.checked ? [...s.enabled, id] : s.enabled.filter((x) => x !== id);
    afterSettings();
  } else if (a === 'time') {
    updateEntry(t.dataset.id, { time: t.value, locked: true });
    const e = findEntry(t.dataset.id); render(); daySheet(e.date);
  } else if (a === 'dur') {
    updateEntry(t.dataset.id, { dur: Math.max(10, Math.min(240, Number(t.value) || 50)) });
    const e = findEntry(t.dataset.id); render(); daySheet(e.date);
  } else if (a === 'import') {
    const f = t.files?.[0];
    if (!f) return;
    f.text().then((txt) => {
      try { importJSON(txt); render(); toast('Backup importado! 💾'); } catch (err) { alert(err.message); }
    });
  }
});

async function doExport() {
  const blob = new Blob([exportJSON()], { type: 'application/json' });
  const name = `mygymera-backup-${todayKey()}.json`;
  const file = new File([blob], name, { type: 'application/json' });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try { await navigator.share({ files: [file], title: 'Backup My Gym Era' }); return; } catch (e) { if (e.name === 'AbortError') return; }
  }
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url; link.download = name; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

// ---------- Arrastar e soltar (toque longo) ----------
let drag = null;
document.addEventListener('touchmove', (ev) => { if (drag?.active) ev.preventDefault(); }, { passive: false });

view.addEventListener('pointerdown', (ev) => {
  const card = ev.target.closest('.drag-card[data-draggable="1"]');
  if (!card) return;
  drag = { card, id: card.dataset.id, x: ev.clientX, y: ev.clientY, active: false, pid: ev.pointerId };
  drag.timer = setTimeout(() => startDrag(ev), 280);
});

function startDrag(ev) {
  if (!drag) return;
  drag.active = true;
  const r = drag.card.getBoundingClientRect();
  const ghost = drag.card.cloneNode(true);
  ghost.classList.add('ghost');
  ghost.style.width = `${r.width}px`;
  ghost.style.left = `${r.left}px`;
  ghost.style.top = `${r.top}px`;
  document.body.appendChild(ghost);
  drag.ghost = ghost; drag.ox = drag.x - r.left; drag.oy = drag.y - r.top;
  drag.card.classList.add('dragging');
  try { drag.card.setPointerCapture(drag.pid); } catch (e) { /* ok */ }
  if (navigator.vibrate) navigator.vibrate(15);
}

window.addEventListener('pointermove', (ev) => {
  if (!drag) return;
  if (!drag.active) {
    if (Math.hypot(ev.clientX - drag.x, ev.clientY - drag.y) > 8) { clearTimeout(drag.timer); drag = null; }
    return;
  }
  drag.ghost.style.left = `${ev.clientX - drag.ox}px`;
  drag.ghost.style.top = `${ev.clientY - drag.oy}px`;
  drag.ghost.style.pointerEvents = 'none';
  const el = document.elementFromPoint(ev.clientX, ev.clientY);
  const row = el?.closest('.day-row');
  $$('.day-row.drop').forEach((r) => r !== row && r.classList.remove('drop'));
  if (row && !row.classList.contains('is-past')) row.classList.add('drop');
  drag.over = row && !row.classList.contains('is-past') ? row.dataset.date : null;
  // rolagem automática perto das bordas
  if (ev.clientY < 90) window.scrollBy(0, -8);
  else if (ev.clientY > window.innerHeight - 120) window.scrollBy(0, 8);
});

function endDrag() {
  if (!drag) return;
  clearTimeout(drag.timer);
  if (drag.active) {
    suppressClick = true;
    setTimeout(() => { suppressClick = false; }, 350);
    drag.ghost.remove();
    drag.card.classList.remove('dragging');
    $$('.day-row.drop').forEach((r) => r.classList.remove('drop'));
    if (drag.over) {
      const snap = snapshot();
      if (moveEntry(drag.id, drag.over)) { render(); toast('Treino movido! Reajustei o resto da semana 🐰', snap); }
    }
  }
  drag = null;
}
window.addEventListener('pointerup', endDrag);
window.addEventListener('pointercancel', endDrag);

// ---------- Tooltip do gráfico ----------
function afterRender(route) {
  if (route !== 'evolucao') return;
  const wrap = $('.chart-wrap');
  const tip = $('.tip', wrap);
  $$('.bar-g', wrap).forEach((g) => {
    const show = () => {
      tip.textContent = g.dataset.tip;
      tip.hidden = false;
      const r = g.getBoundingClientRect(), w = wrap.getBoundingClientRect();
      tip.style.left = `${Math.min(w.width - 150, Math.max(0, r.left - w.left + r.width / 2 - 75))}px`;
      $$('.bar-g', wrap).forEach((x) => x.classList.toggle('hl', x === g));
    };
    g.addEventListener('pointerenter', show);
    g.addEventListener('click', show);
  });
  wrap.addEventListener('pointerleave', () => { tip.hidden = true; $$('.bar-g', wrap).forEach((x) => x.classList.remove('hl')); });
}

// ---------- Início ----------
ui.route = location.hash.replace('#/', '') || 'hoje';
render();
checkAchievements();
// volta pro app depois de um tempo: atualiza o "hoje"
document.addEventListener('visibilitychange', () => { if (!document.hidden) render(); });
if (navigator.storage?.persist) navigator.storage.persist().catch(() => {});
if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(() => {});
