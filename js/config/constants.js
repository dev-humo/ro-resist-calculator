/**
 * Constantes y definiciones compartidas (elementos, límites, bonos, etiquetas de estadísticas).
 */

import { gameData } from './gameData.js';

/* ---------- Constantes ---------- */

export const ELEMENTS = gameData.elements;
export const EL_INDEX = Object.fromEntries(ELEMENTS.map((el, i) => [el, i]));
export const VALIS_ELEMENTS = ELEMENTS.filter(el => el !== 'Holy');
export const SHIELD_TYPES = ['Valkyrie', 'Supreme Guard'];
export const SLOT_COUNT = 4;
export const MAX_EXTRAS = { hat: 2, armor: 2, valis: 3 }; // grupos extra permitidos (valis: hasta 4 en total)
export const EXTRA_KINDS = ['hat', 'armor', 'valis'];
export const KIND_TITLES = { hat: 'Hat', wings: 'Wings', mid: 'Mid', armor: 'Armor', valis: 'Valis', shield: 'Shield', accessory: 'Accesorios 1', accessory2: 'Accesorios 2' };
export const ACCESSORY_SLOTS = 4; // cuatro slots de carta para accesorios

/** Bonos que se suman en etiquetas (en este orden): resistencias, MDEF, DEF, Perfect Dodge, Flee. */
export const STAT_DEFS = [
  { id: 'resPhys',      label: 'Resist. físico',      short: 'físico',      unit: '%' },
  { id: 'resMagic',     label: 'Resist. mágico',      short: 'mágico',      unit: '%' },
  { id: 'resMisc',      label: 'Resist. Misc',        short: 'Misc',        unit: '%' },
  { id: 'resSmall',     label: 'Resist. Small',       short: 'Small',       unit: '%' },
  { id: 'resMedium',    label: 'Resist. Medium',      short: 'Medium',      unit: '%' },
  { id: 'resDemi',      label: 'Resist. Demi Human',  short: 'Demi Human',  unit: '%' },
  { id: 'resRange',     label: 'Resist. rango',       short: 'rango',       unit: '%' },
  { id: 'resShort',     label: 'Resist. corto rango', short: 'corto rango', unit: '%' },
  { id: 'mdef',         label: 'MDEF',                short: 'MDEF',        unit: '' },
  { id: 'def',          label: 'DEF',                 short: 'DEF',         unit: '' },
  { id: 'perfectDodge', label: 'Perfect Dodge',       short: 'Perfect Dodge', unit: '' },
  { id: 'flee',         label: 'Flee',                short: 'Flee',        unit: '' }
];
export const SHOE_TYPES = Object.keys(gameData.shoes);
export const SPRINTING_SHOES = 'Sprinting shoes Plus';
export const STAT_BY_ID = Object.fromEntries(STAT_DEFS.map(d => [d.id, d]));
export const STORAGE_KEY = 'ro-resist-build-v1';
export const THEME_KEY = 'theme';

export const VIP_BONUS = 20;
export const ARMOR_TYPE_BONUS = 25;
export const VALIS_ELEMENT_BONUS = 25;
export const SPRINT_BONUS = 5;

// Optimizador: meta de resistencia y cantidad de Valis por propuesta
export const OPT_GOAL = 100;          // 100 = daño nulo; por encima, el elemento cura
export const OPT_OK_BAND = 10;        // "un poco más de 100": hasta 110
export const OPT_VALIS_COUNTS = [2, 3, 4];
