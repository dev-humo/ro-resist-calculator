/**
 * Forma del estado de un build, saneado de datos guardados y reglas de cartas únicas.
 * Sin DOM: se puede probar con Node.
 */

import { ACCESSORY_SLOTS, ELEMENTS, EXTRA_KINDS, KIND_TITLES, MAX_EXTRAS, SHIELD_TYPES, SHOE_TYPES, SLOT_COUNT, SPRINTING_SHOES, VALIS_ELEMENTS } from '../config/constants.js';
import { gameData } from '../config/gameData.js';

export function newGroup(kind) {
  const group = { slots: Array(kind.startsWith('accessory') ? ACCESSORY_SLOTS : SLOT_COUNT).fill('') };
  if (kind === 'armor' || kind === 'shield') group.type = '';
  if (kind === 'valis') group.element = '';
  return group;
}

export function emptyState() {
  return {
    hat: newGroup('hat'),
    wings: newGroup('wings'),
    mid: newGroup('mid'),
    armor: newGroup('armor'),
    valis: newGroup('valis'),
    shield: newGroup('shield'),
    accessory: newGroup('accessory'),
    accessory2: newGroup('accessory2'),
    vip: false,
    shoes: { type: '', element: '' },
    extras: { hat: [], armor: [], valis: [] }
  };
}

export function slotPool(kind, index) {
  const o = gameData.options;
  if (kind === 'armor') return index === 0 ? o.armor.unique : o.armor.element;
  return o[kind];
}

export const isUniqueCard = name => !!(gameData.cards[name] && gameData.cards[name].unique);

/** Deja una sola copia de cada carta única dentro del mismo ítem. */
function dedupeUnique(slots) {
  const seen = new Set();
  return slots.map(v => {
    if (!isUniqueCard(v)) return v;
    if (seen.has(v)) return '';
    seen.add(v);
    return v;
  });
}

export function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

/** Descarta cualquier valor que no exista en los datos (URLs/almacenamiento manipulados). */
export function sanitizeState(raw) {
  const s = emptyState();
  if (!raw || typeof raw !== 'object') return s;

  const pick = (value, list) => (typeof value === 'string' && list.includes(value)) ? value : '';

  const fillGroup = (kind, src, dst) => {
    if (!src || typeof src !== 'object') return;
    const srcSlots = Array.isArray(src.slots) ? src.slots : [];
    dst.slots = dedupeUnique(dst.slots.map((_, i) => pick(srcSlots[i], slotPool(kind, i))));
    if (kind === 'armor') dst.type = pick(src.type, gameData.options.armor.types);
    if (kind === 'shield') dst.type = pick(src.type, SHIELD_TYPES);
    if (kind === 'valis') dst.element = pick(src.element, VALIS_ELEMENTS);
  };

  for (const kind of Object.keys(KIND_TITLES)) fillGroup(kind, raw[kind], s[kind]);

  s.vip = raw.vip === true;
  if (raw.shoes && typeof raw.shoes === 'object') {
    s.shoes.type = pick(raw.shoes.type, SHOE_TYPES);
    s.shoes.element = pick(raw.shoes.element, ELEMENTS);
  } else if (raw.sprint && typeof raw.sprint === 'object' && raw.sprint.on === true) {
    // Builds guardados antes de la sección "Shoes": el sprinting era un interruptor aparte.
    s.shoes.type = SPRINTING_SHOES;
    s.shoes.element = pick(raw.sprint.element, ELEMENTS);
  }
  if (s.shoes.type !== SPRINTING_SHOES) s.shoes.element = '';

  const extras = raw.extras && typeof raw.extras === 'object' ? raw.extras : {};
  for (const kind of EXTRA_KINDS) {
    const list = Array.isArray(extras[kind]) ? extras[kind].slice(0, MAX_EXTRAS[kind]) : [];
    s.extras[kind] = list.map(src => {
      const group = newGroup(kind);
      fillGroup(kind, src, group);
      return group;
    });
  }
  return s;
}
