// ============================================================
// Bia, a coelhinha 🐰 (branquinha, faixa e pezinhos rosa)
// Humores: radiant | happy | ok | sleepy | sad
// ============================================================

const EYES = {
  happy: `
    <g class="eyes">
      <ellipse cx="78" cy="118" rx="7.5" ry="9.5" fill="#2B2230"/>
      <ellipse cx="122" cy="118" rx="7.5" ry="9.5" fill="#2B2230"/>
      <circle cx="80.5" cy="114.5" r="2.8" fill="#fff"/><circle cx="124.5" cy="114.5" r="2.8" fill="#fff"/>
    </g>`,
  ok: `
    <g class="eyes">
      <ellipse cx="78" cy="119" rx="6" ry="7" fill="#2B2230"/>
      <ellipse cx="122" cy="119" rx="6" ry="7" fill="#2B2230"/>
      <circle cx="80" cy="116.5" r="2" fill="#fff"/><circle cx="124" cy="116.5" r="2" fill="#fff"/>
    </g>`,
  radiant: `
    <g class="eyes-static" stroke="#2B2230" stroke-width="4.5" stroke-linecap="round" fill="none">
      <path d="M69 121 Q78 109 87 121"/><path d="M113 121 Q122 109 131 121"/>
    </g>`,
  sleepy: `
    <g stroke="#2B2230" stroke-width="4" stroke-linecap="round" fill="none">
      <path d="M70 120 Q78 126 86 120"/><path d="M114 120 Q122 126 130 120"/>
    </g>`,
  sad: `
    <g class="eyes">
      <ellipse cx="78" cy="120" rx="7" ry="8.5" fill="#2B2230"/>
      <ellipse cx="122" cy="120" rx="7" ry="8.5" fill="#2B2230"/>
      <circle cx="80" cy="117" r="2.6" fill="#fff"/><circle cx="124" cy="117" r="2.6" fill="#fff"/>
    </g>
    <g stroke="#2B2230" stroke-width="3" stroke-linecap="round"><path d="M68 106 L86 102"/><path d="M132 106 L114 102"/></g>
    <path class="tear" d="M86 128 Q83 135 86 139 Q89 135 86 128Z" fill="#8EC9F2"/>`,
};

const MOUTH = {
  radiant: `<path d="M88 134 Q100 152 112 134 Z" fill="#E25B8C"/><path d="M93 141 Q100 146 107 141" fill="#FF9DBF"/>`,
  happy: `<path d="M92 134 Q96 140 100 135 Q104 140 108 134" stroke="#2B2230" stroke-width="3" fill="none" stroke-linecap="round"/>
          <rect x="96.5" y="136.5" width="7" height="6" rx="2" fill="#fff" stroke="#E8D9E0" stroke-width="1.2"/>`,
  ok: `<path d="M93 135 Q100 139 107 135" stroke="#2B2230" stroke-width="3" fill="none" stroke-linecap="round"/>`,
  sleepy: `<ellipse cx="100" cy="138" rx="4.5" ry="5.5" fill="#E25B8C"/>`,
  sad: `<path d="M92 140 Q100 133 108 140" stroke="#2B2230" stroke-width="3" fill="none" stroke-linecap="round"/>`,
};

const EXTRAS = {
  radiant: `<g class="sparkles" fill="#FFC94D">
      <path d="M30 70 l4 10 10 4 -10 4 -4 10 -4 -10 -10 -4 10 -4z"/>
      <path d="M168 60 l3 7 7 3 -7 3 -3 7 -3 -7 -7 -3 7 -3z"/>
      <path d="M172 140 l2.5 6 6 2.5 -6 2.5 -2.5 6 -2.5 -6 -6 -2.5 6 -2.5z"/>
    </g>`,
  sleepy: `<g class="zzz" fill="#9C8FB3" font-family="ui-rounded, system-ui" font-weight="800">
      <text x="150" y="70" font-size="18">z</text><text x="162" y="52" font-size="22">z</text><text x="176" y="32" font-size="26">Z</text>
    </g>`,
  sad: `<g class="heart" fill="#FF8FB5"><path d="M168 70 c-6 -10 -20 -2 -12 8 l12 12 12 -12 c8 -10 -6 -18 -12 -8z"/></g>`,
};

export function bunnySVG(mood = 'happy', { size = 140, cls = '' } = {}) {
  const droop = mood === 'sad' || mood === 'sleepy';
  const lr = droop ? -34 : -10, rr = droop ? 34 : 10;
  return `
  <svg class="bunny mood-${mood} ${cls}" width="${size}" height="${size * 1.1}" viewBox="0 0 200 220" role="img" aria-label="Bia, a coelhinha, está ${MOOD_LABEL[mood]}">
    <ellipse class="shadow" cx="100" cy="214" rx="56" ry="6" fill="currentColor" opacity=".12"/>
    <g class="body-all">
      <g class="ear ear-l" style="transform-origin:78px 88px; transform: rotate(${lr}deg)">
        <ellipse cx="78" cy="50" rx="18" ry="46" fill="#fff" stroke="#EADBE2" stroke-width="2.5"/>
        <ellipse cx="78" cy="54" rx="9" ry="34" fill="#FFC2D6"/>
      </g>
      <g class="ear ear-r" style="transform-origin:122px 88px; transform: rotate(${rr}deg)">
        <ellipse cx="122" cy="50" rx="18" ry="46" fill="#fff" stroke="#EADBE2" stroke-width="2.5"/>
        <ellipse cx="122" cy="54" rx="9" ry="34" fill="#FFC2D6"/>
      </g>
      <!-- corpo -->
      <ellipse cx="100" cy="180" rx="44" ry="33" fill="#fff" stroke="#EADBE2" stroke-width="2.5"/>
      <ellipse cx="100" cy="186" rx="24" ry="18" fill="#FFF4F8"/>
      <!-- bracinhos -->
      <ellipse class="arm arm-l" cx="62" cy="176" rx="11" ry="15" fill="#fff" stroke="#EADBE2" stroke-width="2.5"/>
      <ellipse class="arm arm-r" cx="138" cy="176" rx="11" ry="15" fill="#fff" stroke="#EADBE2" stroke-width="2.5"/>
      <!-- pezinhos rosa -->
      <g class="feet">
        <ellipse cx="74" cy="208" rx="20" ry="10" fill="#fff" stroke="#EADBE2" stroke-width="2.5"/>
        <ellipse cx="126" cy="208" rx="20" ry="10" fill="#fff" stroke="#EADBE2" stroke-width="2.5"/>
        <ellipse cx="74" cy="209" rx="8" ry="5" fill="#FFB3CC"/><circle cx="64" cy="206" r="3" fill="#FFB3CC"/><circle cx="84" cy="206" r="3" fill="#FFB3CC"/>
        <ellipse cx="126" cy="209" rx="8" ry="5" fill="#FFB3CC"/><circle cx="116" cy="206" r="3" fill="#FFB3CC"/><circle cx="136" cy="206" r="3" fill="#FFB3CC"/>
      </g>
      <!-- cabeça -->
      <ellipse cx="100" cy="118" rx="62" ry="54" fill="#fff" stroke="#EADBE2" stroke-width="2.5"/>
      <!-- faixa na testa -->
      <path d="M41 98 Q100 66 159 98 L157 111 Q100 81 43 111 Z" fill="#FF8FB5"/>
      <path d="M45 101 Q100 72 155 101" stroke="#FFC2D6" stroke-width="2" fill="none" stroke-dasharray="1 7" stroke-linecap="round"/>
      <g class="knot">
        <path d="M156 102 Q178 92 184 112 Q170 110 160 108Z" fill="#FF8FB5"/>
        <path d="M156 106 Q174 118 172 136 Q162 124 155 110Z" fill="#FF7AA6"/>
        <circle cx="157" cy="104" r="6" fill="#FF7AA6"/>
      </g>
      <!-- bochechas -->
      <ellipse cx="62" cy="136" rx="10" ry="6" fill="#FFB3CC" opacity=".7"/>
      <ellipse cx="138" cy="136" rx="10" ry="6" fill="#FFB3CC" opacity=".7"/>
      ${EYES[mood] || EYES.happy}
      <path d="M95 127 Q100 124 105 127 Q100 133 95 127Z" fill="#FF7AA6"/>
      ${MOUTH[mood] || MOUTH.happy}
    </g>
    ${EXTRAS[mood] || ''}
  </svg>`;
}

export const MOOD_LABEL = {
  radiant: 'radiante', happy: 'feliz', ok: 'tranquila', sleepy: 'com preguicinha', sad: 'com saudade',
};

// ---------- Falas ----------
const LINES = {
  welcome: [
    'Oi, {name}! Eu sou a Bia 🐰 Vou te ajudar a montar a semana ideal. Bora começar devagarinho?',
  ],
  radiantWeek: [
    'META DA SEMANA BATIDA! 🎉 {done} treinos! Tô pulando aqui de alegria!',
    'Você é oficialmente uma máquina! {done}/{target} essa semana 💖',
    'Semana completa! Agora é curtir o descanso sem culpa 😌✨',
  ],
  radiantToday: [
    'Treino feito hoje! Tô orgulhosa demais 🥹💗',
    'Isso aí! Mais um pra conta. Lembra de se hidratar 💧',
    'Arrasou! Cada treino conta, e esse contou muito ✨',
  ],
  happy: [
    'Tá indo super bem! {done} de {target} na semana. Hoje tem {treino} 💪',
    'No ritmo certinho! Bora manter? Hoje: {treino}',
    'Gosto de ver! Faltam só {left} treinos pra fechar a semana 🌸',
  ],
  happyRest: [
    'Hoje é dia de descanso, e descanso também é treino 😴💗',
    'Dia livre! Seu músculo agradece. Amanhã a gente volta ✨',
  ],
  ok: [
    'Ainda dá tempo de fazer uma semana linda! Faltam {left} treinos 💪',
    'Bora? Hoje tem {treino}. Um treino de cada vez 🐾',
    'Que tal só começar? O primeiro passo é o mais difícil (e o mais legal) 🌷',
  ],
  sleepy: [
    'Tô com preguicinha… e acho que você também 😴 Que tal uma yoga leve pra acordar?',
    'Faz {gap} dias sem treino… bora só 20 minutinhos hoje? Eu vou junto! 🐰',
    'Psiu… a esteira inclinada tá com saudade de você ⛰️',
  ],
  sad: [
    'Senti sua falta! 🥺 Sem pressão: montei uma semana levinha pra gente voltar juntas.',
    '{gap} dias… tá tudo bem, a gente recomeça hoje. Um treino só já me deixa feliz 💗',
    'Voltar é a parte mais corajosa. Te espero no próximo treino 🐾',
  ],
  weekRecapUp: [
    'Semana passada: {lastDone} treinos! Essa semana vou te puxar um pouquinho: meta de {target} 📈',
  ],
  weekRecapKeep: [
    'Semana passada: {lastDone} treinos, perfeito! Vamos manter {target} essa semana 🔥',
  ],
  weekRecapLow: [
    'Semana passada foi mais devagar ({lastDone}), e tudo bem! Essa semana a meta é {target}, bem possível 💗',
  ],
};

function seeded(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function pickLine(kind, seed, vars) {
  const arr = LINES[kind] || LINES.happy;
  const line = arr[seeded(seed + kind) % arr.length];
  return line.replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? ''));
}

/** Decide humor + fala a partir do contexto da semana */
export function mascotState(ctx) {
  const v = { ...ctx };
  if (ctx.totalDone === 0 && !ctx.doneToday) return { mood: 'happy', line: pickLine('welcome', ctx.today, v) };
  if (ctx.recap) return { mood: ctx.recap === 'weekRecapLow' ? 'happy' : 'radiant', line: pickLine(ctx.recap, ctx.today, v) };
  if (ctx.done >= ctx.target) return { mood: 'radiant', line: pickLine('radiantWeek', ctx.today, v) };
  if (ctx.doneToday) return { mood: 'radiant', line: pickLine('radiantToday', ctx.today, v) };
  if (ctx.gap >= 7) return { mood: 'sad', line: pickLine('sad', ctx.today, v) };
  if (ctx.gap >= 4 && ctx.done === 0) return { mood: 'sleepy', line: pickLine('sleepy', ctx.today, v) };
  if (ctx.done >= ctx.expected) {
    return { mood: 'happy', line: pickLine(ctx.todayRest ? 'happyRest' : 'happy', ctx.today, v) };
  }
  return { mood: 'ok', line: pickLine(ctx.todayRest ? 'happyRest' : 'ok', ctx.today, v) };
}
