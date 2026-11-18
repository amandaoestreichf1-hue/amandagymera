// ============================================================
// My Gym Era — dados fixos: estúdios, grades de horário e modalidades
// Para atualizar uma grade, edite só este arquivo.
// Dias da semana seguem o JS: 0 = domingo, 1 = segunda ... 6 = sábado
// ============================================================

export const SCHEDULE_UPDATED = '2026-10-28';

// Categorias (cor = identidade, validada para daltonismo em claro e escuro)
export const CATEGORIES = {
  strength: { label: 'Força', emoji: '💪', color: 'var(--cat-strength)' },
  hiit:     { label: 'HIIT',  emoji: '⚡', color: 'var(--cat-hiit)' },
  mobility: { label: 'Yoga & mobilidade', emoji: '🧘‍♀️', color: 'var(--cat-mobility)' },
  cardio:   { label: 'Cardio', emoji: '🏃‍♀️', color: 'var(--cat-cardio)' },
  swim:     { label: 'Natação', emoji: '🏊‍♀️', color: 'var(--cat-swim)' },
};

export const FOCUS = {
  lower:    'Inferiores',
  upper:    'Superiores',
  glutes:   'Glúteos & Abs',
  core:     'Core & Abs',
  full:     'Full Body',
  cardio:   'Cardio',
  mobility: 'Mobilidade',
  recovery: 'Recuperação',
};

// ---------- Grades dos estúdios ----------
const TONUS_WEEKDAY = ['05:00','06:00','07:00','08:20','09:20','10:20','12:20','15:00','17:00','18:00','19:00','20:00','21:00'];
const TONUS_WEEKEND = ['06:00','07:00','08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00'];
const RACE_WEEKDAY  = ['06:05','07:05','08:05','12:10','16:00','18:20','19:20','20:20'];
const RACE_WEEKEND  = ['06:10','07:10','08:10','09:10','10:10','11:10','12:10','13:10','14:10','15:10'];

// Vidya: F = Hot Yoga Flow, S = Hot Sculpt, T = Hot Stretch, M = Hot Meditation
// Cada string tem 5 letras = segunda..sexta
const VIDYA_WEEKDAY = [
  ['05:00','SSSSS'], ['06:05','SSSSS'], ['07:10','FFFFF'], ['08:15','FFFFF'],
  ['09:20','FFFFF'], ['10:25','FFFFF'], ['11:30','FTTFT'], ['12:35','TFFTF'],
  ['13:40','FFFFF'], ['14:45','FSFSF'], ['15:50','FSFSF'], ['16:55','SFSFS'],
  ['18:00','SFSFS'], ['19:05','FFFFF'], ['20:10','FFFFF'], ['21:15','MMMMM'],
];
const VIDYA_WEEKEND = [
  ['06:00','F'], ['07:05','F'], ['08:10','F'], ['09:15','F'], ['10:20','F'],
  ['11:25','F'], ['12:30','F'], ['13:35','T'], ['14:40','S'], ['15:45','S'],
];
const VIDYA_CODE = { F: 'vidya_flow', S: 'vidya_sculpt', T: 'vidya_stretch', M: 'vidya_meditation' };

export const STUDIOS = {
  tonus: {
    name: 'Tônus', full: 'Tônus Gym Santo André', insta: 'tonus.santoandre',
    focusByDay: { 1: 'lower', 2: 'upper', 3: 'glutes', 4: 'upper', 5: 'lower', 6: 'full', 0: 'full' },
    labelByDay: { 1: 'Lower Body', 2: 'Upper Body', 3: 'Glutes & Abs', 4: 'Upper Body', 5: 'Lower Body', 6: 'Full Body', 0: 'Full Body' },
  },
  race: {
    name: 'Race Bootcamp', full: 'Race Bootcamp Santo André', insta: 'race.santoandre',
    focusByDay: { 1: 'upper', 2: 'lower', 3: 'core', 4: 'upper', 5: 'full', 6: 'full', 0: 'full' },
    labelByDay: { 1: 'Upper Body', 2: 'Lower Body', 3: 'Core & Abs', 4: 'Upper Body', 5: 'Full Body Lift', 6: 'Full Body', 0: 'Full Body' },
  },
  vidya: { name: 'Vidya', full: 'Vidya Studio Santo André', insta: 'vidya_santoandre' },
};

/** Horários disponíveis de uma modalidade num dia da semana (vazio = sem grade fixa) */
export function classTimes(actId, dow) {
  const weekend = dow === 0 || dow === 6;
  if (actId === 'tonus') return weekend ? TONUS_WEEKEND : TONUS_WEEKDAY;
  if (actId === 'race') return weekend ? RACE_WEEKEND : RACE_WEEKDAY;
  if (actId.startsWith('vidya_')) {
    if (weekend) return VIDYA_WEEKEND.filter(([, c]) => VIDYA_CODE[c] === actId).map(([t]) => t);
    return VIDYA_WEEKDAY.filter(([, codes]) => VIDYA_CODE[codes[dow - 1]] === actId).map(([t]) => t);
  }
  return [];
}

// ---------- Catálogo de modalidades ----------
// place: 'studio' | 'home' (prédio/casa) | 'other'
// heat: multiplicador de suor em relação ao seu teste (musculação, moderado, 22°C)
export const ACTIVITIES = {
  tonus: {
    name: 'Tônus', emoji: '🏋️‍♀️', cat: 'strength', place: 'studio', studio: 'tonus', dur: 50,
    heat: 1.1, desc: 'Musculação intervalada',
  },
  race: {
    name: 'Race Bootcamp', short: 'Race', emoji: '⚡', cat: 'hiit', place: 'studio', studio: 'race', dur: 50,
    heat: 1.6, desc: 'HIIT: corrida, esteira e força',
  },
  vidya_flow: {
    name: 'Hot Yoga Flow', emoji: '🧘‍♀️', cat: 'mobility', place: 'studio', studio: 'vidya', dur: 60,
    focus: 'mobility', heat: 1.9, hot: true, desc: 'Yoga em sala aquecida',
  },
  vidya_sculpt: {
    name: 'Hot Sculpt', emoji: '🔥', cat: 'strength', place: 'studio', studio: 'vidya', dur: 60,
    focus: 'full', heat: 2.0, hot: true, desc: 'Força leve em sala aquecida',
  },
  vidya_stretch: {
    name: 'Hot Stretch', emoji: '🤸‍♀️', cat: 'mobility', place: 'studio', studio: 'vidya', dur: 60,
    focus: 'mobility', heat: 1.4, hot: true, desc: 'Alongamento em sala aquecida',
  },
  vidya_meditation: {
    name: 'Hot Meditation', emoji: '🪷', cat: 'mobility', place: 'studio', studio: 'vidya', dur: 45,
    focus: 'recovery', heat: 0.7, hot: true, desc: 'Meditação em sala aquecida', light: true,
  },
  gym: {
    name: 'Musculação', emoji: '🏋️', cat: 'strength', place: 'home', dur: 50,
    heat: 1.0, desc: 'Academia do prédio', chooseFocus: ['upper', 'lower', 'glutes', 'core', 'full'],
  },
  incline: {
    name: 'Esteira inclinada', emoji: '⛰️', cat: 'cardio', place: 'home', dur: 40,
    focus: 'cardio', heat: 1.3, desc: 'Caminhada na inclinação',
  },
  swim: {
    name: 'Natação', emoji: '🏊‍♀️', cat: 'swim', place: 'home', dur: 45,
    focus: 'full', heat: 0.8, desc: 'Piscina do prédio',
  },
  home: {
    name: 'Treino em casa', emoji: '🏠', cat: 'strength', place: 'home', dur: 35,
    heat: 0.9, desc: 'Funcional sem equipamento', chooseFocus: ['full', 'upper', 'lower', 'glutes', 'core'],
  },
  bike: {
    name: 'Bike', emoji: '🚴‍♀️', cat: 'cardio', place: 'home', dur: 40,
    focus: 'cardio', heat: 1.2, desc: 'Bike ergométrica ou rua',
  },
  pilates: {
    name: 'Pilates', emoji: '🩰', cat: 'mobility', place: 'other', dur: 50,
    focus: 'core', heat: 0.7, desc: 'Core e postura',
  },
  run: {
    name: 'Corrida', emoji: '👟', cat: 'cardio', place: 'other', dur: 35,
    focus: 'cardio', heat: 1.5, desc: 'Corrida leve',
  },
};

export const ACTIVITY_ORDER = [
  'tonus', 'race', 'vidya_flow', 'vidya_sculpt', 'vidya_stretch', 'vidya_meditation',
  'gym', 'incline', 'swim', 'home', 'bike', 'pilates', 'run',
];

/** Foco real de um treino num dia (estúdios mudam o foco conforme o dia) */
export function focusOf(actId, dow, chosen) {
  const a = ACTIVITIES[actId];
  if (!a) return 'full';
  if (a.studio === 'tonus' || a.studio === 'race') return STUDIOS[a.studio].focusByDay[dow];
  if (a.chooseFocus) return chosen || a.chooseFocus[0];
  return a.focus || 'full';
}

/** Nome da aula do dia, ex.: "Tônus · Lower Body" */
export function classLabel(actId, dow, chosen) {
  const a = ACTIVITIES[actId];
  if (!a) return '?';
  if (a.studio === 'tonus' || a.studio === 'race') return STUDIOS[a.studio].labelByDay[dow];
  if (a.chooseFocus) return FOCUS[chosen || a.chooseFocus[0]];
  return a.desc;
}

// ---------- Objetivos ----------
// slots em ordem de prioridade: a semana usa os N primeiros
export const GOALS = {
  secar: {
    label: 'Secar', emoji: '🔥', desc: 'Mais HIIT e cardio, com força pra manter o músculo',
    slots: [
      { cat: 'hiit' }, { cat: 'strength', focus: 'lower' }, { cat: 'hiit' },
      { cat: 'strength', focus: 'upper' }, { cat: 'mobility' }, { cat: 'cardio' }, { cat: 'strength', focus: 'glutes' },
    ],
  },
  tonificar: {
    label: 'Tonificar', emoji: '💪', desc: 'Foco em força, corpo todo',
    slots: [
      { cat: 'strength', focus: 'lower' }, { cat: 'strength', focus: 'upper' }, { cat: 'hiit' },
      { cat: 'strength', focus: 'glutes' }, { cat: 'mobility' }, { cat: 'strength', focus: 'core' }, { cat: 'cardio' },
    ],
  },
  bracos: {
    label: 'Tonificar braços', emoji: '💪', desc: 'Mais dias de superiores',
    slots: [
      { cat: 'strength', focus: 'upper' }, { cat: 'hiit' }, { cat: 'strength', focus: 'lower' },
      { cat: 'strength', focus: 'upper' }, { cat: 'mobility' }, { cat: 'cardio' }, { cat: 'strength', focus: 'core' },
    ],
  },
  pernas: {
    label: 'Pernas e glúteos', emoji: '🍑', desc: 'Mais dias de inferiores e glúteos',
    slots: [
      { cat: 'strength', focus: 'lower' }, { cat: 'strength', focus: 'glutes' }, { cat: 'hiit' },
      { cat: 'strength', focus: 'upper' }, { cat: 'mobility' }, { cat: 'strength', focus: 'lower' }, { cat: 'cardio' },
    ],
  },
  condicionamento: {
    label: 'Condicionamento', emoji: '🫀', desc: 'Fôlego e resistência',
    slots: [
      { cat: 'hiit' }, { cat: 'cardio' }, { cat: 'strength', focus: 'full' },
      { cat: 'hiit' }, { cat: 'mobility' }, { cat: 'cardio' }, { cat: 'strength', focus: 'lower' },
    ],
  },
  equilibrio: {
    label: 'Equilíbrio', emoji: '🌸', desc: 'Corpo e mente: yoga, força e cardio leve',
    slots: [
      { cat: 'mobility' }, { cat: 'strength', focus: 'full' }, { cat: 'cardio' },
      { cat: 'mobility' }, { cat: 'hiit' }, { cat: 'strength', focus: 'upper' }, { cat: 'strength', focus: 'lower' },
    ],
  },
};

export const DOW_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
export const DOW_LONG = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
export const MONTHS = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
