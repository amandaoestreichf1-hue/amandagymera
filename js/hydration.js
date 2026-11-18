// ============================================================
// Hidratação baseada no seu perfil de suor (teste Gatorade Gx)
// Referências gerais: ACSM — 5–7 ml/kg 2–4 h antes; repor parte do
// suor durante; 125–150% do que faltou depois.
// Estimativa educativa — não substitui orientação de nutricionista.
// ============================================================
import { ACTIVITIES } from './data.js';
import { getState } from './store.js';

const r10 = (x) => Math.round(x / 10) * 10;
const r50 = (x) => Math.round(x / 50) * 50;

export function hydrationFor(actId, durMin) {
  const s = getState().settings;
  const sw = s.sweat;
  const a = ACTIVITIES[actId] || { heat: 1 };
  const dur = durMin || a.dur || 50;
  const mult = a.heat || 1;
  const h = dur / 60;

  const lossLo = sw.rateMin * mult * h;
  const lossHi = sw.rateMax * mult * h;
  const loss = (lossLo + lossHi) / 2;

  const w = s.weight || 59;
  const beforeLo = r50(5 * w), beforeHi = r50(7 * w);
  const topUp = mult >= 1.4 ? '150–250 ml' : '100–150 ml';

  // durante: repor ~60–80% do suor, em goles a cada 15 min
  const duringLo = r50(lossLo * 0.6), duringHi = r50(lossHi * 0.8);
  const during = (duringLo + duringHi) / 2;

  // depois: 150% do que ficou faltando (mínimo 250 ml)
  const deficit = Math.max(0, loss - during);
  const afterLo = Math.max(250, r50(deficit * 1.25 + 150));
  const afterHi = Math.max(300, r50(deficit * 1.5 + 250));

  const naLo = r10((lossLo / 1000) * sw.naMin);
  const naHi = r10((lossHi / 1000) * sw.naMax);
  const electrolyte = naHi >= 500 || dur >= 75 || a.hot;
  const pctBody = ((lossHi - duringLo) / 1000 / w) * 100;

  const tips = [];
  if (a.hot) tips.push('Sala aquecida: você sua bem mais que no seu teste (que foi a 22 °C). Leve garrafa de 750 ml+.');
  if (electrolyte) tips.push(`Você perde ~${naLo}–${naHi} mg de sódio. Vale um isotônico ou uma pitada de sal na água.`);
  if (actId === 'swim') tips.push('Na piscina o suor não aparece, mas acontece. Deixe a garrafa na borda.');
  if (a.cat === 'hiit') tips.push('HIIT: goles pequenos nos intervalos, não tudo de uma vez.');
  if (pctBody >= 1.5) tips.push('Treino puxado: se der, se pese antes e depois. Cada 1 kg perdido ≈ 1,5 L para repor.');

  return {
    dur, mult,
    loss: { lo: r10(lossLo), hi: r10(lossHi) },
    before: { lo: beforeLo, hi: beforeHi, topUp },
    during: { lo: duringLo, hi: duringHi, every: dur >= 30 ? Math.max(100, r50(during / Math.max(1, dur / 15))) : null },
    after: { lo: afterLo, hi: afterHi },
    sodium: { lo: naLo, hi: naHi },
    electrolyte,
    tips,
  };
}

export const ml = (x) => (x >= 1000 ? `${(x / 1000).toFixed(1).replace('.', ',')} L` : `${x} ml`);
export const range = (o) => {
  if (o.lo === o.hi) return ml(o.lo);
  if (o.hi < 1000) return `${o.lo}–${o.hi} ml`;
  if (o.lo >= 1000) return `${(o.lo / 1000).toFixed(1).replace('.', ',')}–${ml(o.hi)}`;
  return `${ml(o.lo)} – ${ml(o.hi)}`;
};
