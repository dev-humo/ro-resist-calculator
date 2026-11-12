/**
 * Optimizador: búsqueda local con reinicios sobre las mismas reglas del motor.
 * Busca que cada elemento llegue a 100 (resistencia + reducción) entre el equipo puesto y sus cambios.
 */

import { ELEMENTS, EL_INDEX, OPT_GOAL, SHIELD_TYPES, SLOT_COUNT, SPRINTING_SHOES, VALIS_ELEMENTS } from '../config/constants.js';
import { gameData } from '../config/gameData.js';
import { calculate, swapScenarios } from './engine.js';
import { clone, emptyState, newGroup, slotPool } from './state.js';

const OPT_SHIELD_POOL = Object.keys(gameData.resistances.resist5); // el optimizador solo puntúa elementos

const OPT_RESTARTS = 16;       // arranques aleatorios por búsqueda
const OPT_REFINE_ROUNDS = 30;  // sacudidas de la mejor build para salir de óptimos locales
const OPT_ARMOR_COUNT = 2;

function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pathVar(path, options) {
  const last = path[path.length - 1];
  const parents = path.slice(0, -1);
  return {
    options: [...options, ''], // '' al final: a igualdad de puntuación se prefiere un objeto equipado
    get: s => path.reduce((o, k) => o[k], s),
    set: (s, v) => { parents.reduce((o, k) => o[k], s)[last] = v; }
  };
}

/** Ruta al grupo i-ésimo de un tipo: el 0 es el principal; el resto, los extra. */
const groupPath = (kind, i) => (i === 0 ? [kind] : ['extras', kind, i - 1]);

function optimizerVariables(armorCount, valisCount) {
  const vars = [];
  for (const kind of ['hat', 'wings', 'mid']) {
    for (let i = 0; i < SLOT_COUNT; i++) vars.push(pathVar([kind, 'slots', i], slotPool(kind, i)));
  }
  for (let g = 0; g < armorCount; g++) {
    const base = groupPath('armor', g);
    vars.push(pathVar([...base, 'type'], gameData.options.armor.types));
    for (let i = 0; i < SLOT_COUNT; i++) vars.push(pathVar([...base, 'slots', i], slotPool('armor', i)));
  }
  for (let g = 0; g < valisCount; g++) {
    const base = groupPath('valis', g);
    vars.push(pathVar([...base, 'element'], VALIS_ELEMENTS));
    for (let i = 0; i < SLOT_COUNT; i++) vars.push(pathVar([...base, 'slots', i], slotPool('valis', i)));
  }
  vars.push(pathVar(['shield', 'type'], SHIELD_TYPES));
  for (let i = 0; i < SLOT_COUNT; i++) vars.push(pathVar(['shield', 'slots', i], OPT_SHIELD_POOL));
  vars.push({
    options: [...ELEMENTS, ''],
    get: s => s.shoes.element,
    set: (s, v) => { s.shoes.element = v; s.shoes.type = v ? SPRINTING_SHOES : ''; }
  });
  return vars;
}

function seedState(vip, armorCount, valisCount) {
  const s = emptyState();
  s.vip = vip;
  for (let i = 1; i < armorCount; i++) s.extras.armor.push(newGroup('armor'));
  for (let i = 1; i < valisCount; i++) s.extras.valis.push(newGroup('valis'));
  return s;
}

/**
 * Puntuación comparable lexicográficamente (mayor es mejor). Solo se lleva 1 Armor y
 * 1 Valis a la vez; los extras son cambios. Se evalúan el equipo puesto y cada cambio
 * (resistencia + reducción por elemento) con la meta de 100 sin pasarse mucho:
 * 1) cobertura: cada elemento debe llegar a 100 en al menos un escenario,
 * 2) el equipo puesto debe quedar lo más cerca posible de 100 en todo,
 * 3) cada cambio también debe acercarse a 100 en lo que cubre,
 * 4) mínimo exceso sobre 100 (no desperdiciar),
 * 5) a igualdad, más combos elementales.
 * Con un elemento elegido, ese elemento debe estar en 100 en todos los escenarios
 * y el resto de criterios se aplica a los demás elementos.
 */
function scoreKey(s, target) {
  const scenarios = [calculate(s), ...swapScenarios(s).map(sc => calculate(s, sc))];
  const effs = scenarios.map(t => t.resist.map((v, i) => v + t.reduc[i]));
  const gap = v => Math.max(0, OPT_GOAL - v);
  const over = v => Math.max(0, v - OPT_GOAL);
  const sum = arr => arr.reduce((a, b) => a + b, 0);
  const t = target === 'all' ? -1 : EL_INDEX[target];
  const idx = ELEMENTS.map((_, i) => i).filter(i => i !== t);

  const best = idx.map(i => Math.max(...effs.map(e => e[i])));
  const cover = [-Math.max(...best.map(gap)), -sum(best.map(gap))];
  const baseGap = -sum(idx.map(i => gap(effs[0][i])));
  const swapGap = -sum(effs.slice(1).map(e => sum(idx.map(i => gap(e[i])))));
  const waste = -sum(effs.map(e => sum(idx.map(i => over(e[i])))));
  const combos = sum(scenarios.map(x => x.combos.length));

  if (t < 0) return [...cover, baseGap, swapGap, waste, combos];
  return [-sum(effs.map(e => gap(e[t]))), -sum(effs.map(e => over(e[t]))), ...cover, baseGap, swapGap, waste, combos];
}

function compareKeys(a, b) {
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return a[i] - b[i];
  }
  return 0;
}

function climb(s, vars, target) {
  let best = scoreKey(s, target);
  for (let pass = 0, improved = true; improved && pass < 50; pass++) {
    improved = false;
    for (const v of vars) {
      const current = v.get(s);
      let bestOption = current;
      for (const option of v.options) {
        if (option === current) continue;
        v.set(s, option);
        const key = scoreKey(s, target);
        if (compareKeys(key, best) > 0) { best = key; bestOption = option; }
      }
      v.set(s, bestOption);
      if (bestOption !== current) improved = true;
    }
  }
  return { state: s, key: best };
}

export function searchBest(target, vip, valisCount = 3, armorCount = OPT_ARMOR_COUNT) {
  const rand = mulberry32(0x9E3779B9 + valisCount * 7919 + armorCount * 104729 + (vip ? 1 : 0));
  const vars = optimizerVariables(armorCount, valisCount);
  const randomize = (s, count) => {
    const picks = count === undefined ? vars : Array.from({ length: count }, () => vars[Math.floor(rand() * vars.length)]);
    for (const v of picks) v.set(s, v.options[Math.floor(rand() * v.options.length)]);
  };
  let best = null;

  for (let r = 0; r < OPT_RESTARTS; r++) {
    const s = seedState(vip, armorCount, valisCount);
    if (r > 0) randomize(s);
    const result = climb(s, vars, target);
    if (!best || compareKeys(result.key, best.key) > 0) best = result;
  }

  // Refinamiento: se sacude un poco la mejor build y se vuelve a escalar.
  for (let k = 0; k < OPT_REFINE_ROUNDS; k++) {
    const s = clone(best.state);
    randomize(s, 2 + Math.floor(rand() * 5));
    const result = climb(s, vars, target);
    if (compareKeys(result.key, best.key) > 0) best = result;
  }
  return { vip, valisCount, armorCount, state: best.state, totals: calculate(best.state) };
}
