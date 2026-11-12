/**
 * Motor de cálculo: aporte de cada pieza, combos elementales y cambios de pieza.
 * Todo es puro (sin DOM): la tabla, la matriz y el optimizador usan estas mismas funciones.
 */

import { ARMOR_TYPE_BONUS, ELEMENTS, EL_INDEX, EXTRA_KINDS, KIND_TITLES, SPRINT_BONUS, SPRINTING_SHOES, VALIS_ELEMENT_BONUS, VIP_BONUS } from '../config/constants.js';
import { ARMOR_TYPE_ELEMENT, gameData } from '../config/gameData.js';

/**
 * Grupos que se llevan puestos. Solo hay 1 pieza de cada tipo; los extras son piezas
 * de cambio: con `swap` ({kind, index}) el extra ocupa el lugar de la pieza principal.
 */
function wornGroups(s, swap = null) {
  const out = [];
  for (const kind of Object.keys(KIND_TITLES)) {
    const group = swap && swap.kind === kind ? s.extras[kind][swap.index] : s[kind];
    if (group) out.push({ kind, group });
  }
  return out;
}

/** Un cambio posible por cada extra: { kind, index, detail }. */
export function swapScenarios(s) {
  const list = [];
  for (const kind of EXTRA_KINDS) {
    s.extras[kind].forEach((group, index) => {
      list.push({ kind, index, detail: kind === 'armor' ? group.type : kind === 'valis' ? group.element : '' });
    });
  }
  return list;
}

/* ---------- Motor de cálculo ---------- */

/** Efecto de un objeto en un slot: { res: {Elemento: n}, red: {Elemento: n} } o null. */
export function slotEffect(kind, index, value) {
  const r = gameData.resistances;
  if (kind === 'valis') {
    return r.resist30[value] ? { res: { [r.resist30[value]]: 30 } } : null;
  }
  if (kind === 'armor') {
    if (index === 0) {
      return r.armorReductions[value] ? { red: { ...r.armorReductions[value] } } : null;
    }
    return r.resist10Armors[value] ? { res: { [r.resist10Armors[value]]: 10 } } : null;
  }
  // hat, wings, mid, shield
  if (r.resist15[value]) return { res: { [r.resist15[value]]: 15 } };
  if (r.resist5[value]) return { res: { [r.resist5[value]]: 5 } };
  if (r.customResistances[value]) return { res: { ...r.customResistances[value] } };
  const card = gameData.cards[value];
  if (card) return { stat: { ...card.stat } };
  return null;
}

/** Efecto del selector de tipo/elemento de cada grupo. */
export function typeEffect(kind, value) {
  if (!value) return null;
  if (kind === 'armor') {
    const el = ARMOR_TYPE_ELEMENT[value];
    return el ? { res: { [el]: ARMOR_TYPE_BONUS } } : null;
  }
  if (kind === 'valis') return { res: { [value]: VALIS_ELEMENT_BONUS } };
  if (kind === 'shield') {
    const s = gameData.resistances.shieldResistances[value];
    return s && Object.keys(s).length ? { res: { ...s } } : null;
  }
  return null;
}

export function sprintEffect(element) {
  return element ? { res: { [element]: SPRINT_BONUS } } : null;
}

/** Efecto del calzado elegido: sprinting (elemento) o un calzado con bonos fijos. */
export function shoesEffect(shoes) {
  if (shoes.type === SPRINTING_SHOES) return sprintEffect(shoes.element);
  const item = gameData.shoes[shoes.type];
  return item && item.stat ? { stat: { ...item.stat } } : null;
}

/** Elementos con combo activo: el Armor y el Valis puestos son del mismo elemento. */
function activeCombos(s, swap = null) {
  let armorEl = null;
  let valisEl = null;
  for (const { kind, group } of wornGroups(s, swap)) {
    if (kind === 'armor') armorEl = ARMOR_TYPE_ELEMENT[group.type] || null;
    if (kind === 'valis') valisEl = group.element || null;
  }
  return ELEMENTS.filter(el => gameData.combos[el] && el === armorEl && el === valisEl);
}

function comboEffect(el) {
  return { stat: { ...gameData.comboBase, ...gameData.combos[el].stat } };
}

function addEffect(t, eff) {
  if (!eff) return;
  for (const [el, v] of Object.entries(eff.res || {})) {
    const i = EL_INDEX[el];
    if (i !== undefined) t.resist[i] += v;
  }
  for (const [el, v] of Object.entries(eff.red || {})) {
    const i = EL_INDEX[el];
    if (i !== undefined) t.reduc[i] += v;
  }
  for (const [id, v] of Object.entries(eff.stat || {})) t.stats[id] = (t.stats[id] || 0) + v;
}

const emptyTotals = () => ({
  resist: new Array(ELEMENTS.length).fill(0),
  reduc: new Array(ELEMENTS.length).fill(0),
  stats: {}
});

/** Aporte de un grupo (con memoria: el optimizador evalúa miles de combinaciones). */
const groupCache = new Map();

function groupContribution(kind, group) {
  const key = `${kind}|${group.type ?? group.element ?? ''}|${group.slots.join('|')}`;
  let c = groupCache.get(key);
  if (c) return c;
  c = emptyTotals();
  group.slots.forEach((value, i) => { if (value) addEffect(c, slotEffect(kind, i, value)); });
  if (kind === 'valis') addEffect(c, typeEffect('valis', group.element));
  else if (kind === 'armor' || kind === 'shield') addEffect(c, typeEffect(kind, group.type));
  if (groupCache.size > 30000) groupCache.clear();
  groupCache.set(key, c);
  return c;
}

/** Totales del equipo puesto, o con una pieza de cambio en lugar de la principal. */
export function calculate(s, swap = null) {
  const t = emptyTotals();
  if (s.vip) for (let i = 0; i < t.resist.length; i++) t.resist[i] += VIP_BONUS;

  for (const { kind, group } of wornGroups(s, swap)) {
    const c = groupContribution(kind, group);
    for (let i = 0; i < t.resist.length; i++) { t.resist[i] += c.resist[i]; t.reduc[i] += c.reduc[i]; }
    for (const id in c.stats) t.stats[id] = (t.stats[id] || 0) + c.stats[id];
  }

  addEffect(t, shoesEffect(s.shoes));

  const combos = activeCombos(s, swap);
  combos.forEach(el => addEffect(t, comboEffect(el)));

  return { resist: t.resist, reduc: t.reduc, stats: t.stats, combos };
}

/**
 * Notas flotantes activas: combos del equipo puesto y avisos del calzado elegido.
 * Cada nota: { id, title, el (elemento para el color o null), lines }.
 */
export function activeNotes(s) {
  const notes = [];
  const base = gameData.comboBase;
  for (const el of activeCombos(s)) {
    notes.push({
      id: `combo:${el}`, title: `Combo ${el}`, el,
      lines: [`DEF +${base.def} \u00b7 MDEF +${base.mdef}`, ...gameData.combos[el].notes]
    });
  }
  const shoe = gameData.shoes[s.shoes.type];
  if (shoe && shoe.notes) {
    notes.push({ id: `shoes:${s.shoes.type}`, title: s.shoes.type, el: null, lines: [...shoe.notes] });
  }
  return notes;
}

/** Misma escala de colores que la versión anterior: <=50 bajo, <=75 medio, >75 alto. */
export function levelOf(value) {
  if (value > 75) return 'high';
  if (value > 50) return 'mid';
  if (value > 0) return 'low';
  if (value < 0) return 'neg';
  return 'zero';
}


/** Filas: equipo puesto + una por cada pieza de cambio, siempre cambiando de una en una. */
export function scenarioRows(s) {
  const base = calculate(s);
  const rows = [{ label: 'Equipo puesto', detail: '', combos: base.combos, totals: base, isBase: true }];
  for (const sc of swapScenarios(s)) {
    const totals = calculate(s, sc);
    rows.push({
      label: `${KIND_TITLES[sc.kind]} \u00b7 cambio ${sc.index + 1}`,
      detail: sc.detail,
      combos: totals.combos.filter(el => !base.combos.includes(el)),
      totals,
      isBase: false
    });
  }
  return rows;
}
