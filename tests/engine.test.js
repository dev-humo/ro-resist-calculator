import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { ELEMENTS } from '../js/config/constants.js';
import { emptyState, sanitizeState } from '../js/core/state.js';
import { activeNotes, calculate, scenarioRows } from '../js/core/engine.js';
import { searchBest } from '../js/core/optimizer.js';

const idx = el => ELEMENTS.indexOf(el);
const total = (t, el) => t.resist[idx(el)] + t.reduc[idx(el)];

test('un build vacío no da resistencias ni bonos', () => {
  const t = calculate(emptyState());
  assert.deepEqual(t.resist, new Array(ELEMENTS.length).fill(0));
  assert.deepEqual(t.reduc, new Array(ELEMENTS.length).fill(0));
  assert.deepEqual(t.stats, {});
  assert.deepEqual(t.combos, []);
});

test('el VIP suma 20 de resistencia a todos los elementos', () => {
  const s = emptyState();
  s.vip = true;
  assert.ok(calculate(s).resist.every(v => v === 20));
});

test('las cartas únicas se limitan a 1 por ítem y se pueden repetir entre ítems', () => {
  const s = emptyState();
  s.shield.slots = ['Hardrock Mommoth', 'Hardrock Mommoth', 'Paladin', 'Paladin'];
  s.accessory.slots = ['Clow', 'Clow', 'Stalker', 'Stalker'];
  s.accessory2.slots = ['Clow', 'Stalker', '', ''];
  const clean = sanitizeState(s);
  assert.deepEqual(clean.shield.slots, ['Hardrock Mommoth', '', 'Paladin', '']);
  assert.deepEqual(clean.accessory.slots, ['Clow', '', 'Stalker', '']);
  assert.deepEqual(clean.accessory2.slots, ['Clow', 'Stalker', '', '']);
  const { stats } = calculate(clean);
  assert.equal(stats.flee, 50);
  assert.equal(stats.resRange, 10);
});

test('los estados guardados antiguos se completan con los módulos nuevos', () => {
  const old = emptyState();
  delete old.accessory2;
  old.accessory.slots = ['Stalker', 'Clow'];
  const clean = sanitizeState(old);
  assert.equal(clean.accessory.slots.length, 4);
  assert.equal(clean.accessory2.slots.length, 4);
});

test('el combo exige Armor y Valis puestos del mismo elemento y suma DEF/MDEF +1', () => {
  const s = emptyState();
  s.armor.type = 'Earth Golden Lord Robe';
  s.valis.element = 'Earth';
  const t = calculate(s);
  assert.deepEqual(t.combos, ['Earth']);
  assert.equal(t.stats.def, 1);
  assert.equal(t.stats.mdef, 1);
  assert.equal(t.stats.resSmall, 5);
  s.valis.element = 'Fire';
  assert.deepEqual(calculate(s).combos, []);
});

test('Holy no tiene combo', () => {
  const s = emptyState();
  s.armor.type = 'Holy Divine Cloth';
  s.valis.element = 'Water';
  assert.deepEqual(calculate(s).combos, []);
});

test('los extras no se suman: solo cuentan al cambiarlos por la pieza puesta', () => {
  const s = emptyState();
  s.valis.element = 'Earth';
  s.extras.valis.push({ slots: ['', '', '', ''], element: 'Fire' });
  const base = calculate(s);
  assert.equal(total(base, 'Earth'), 25);
  assert.equal(total(base, 'Fire'), 0);

  const swapped = calculate(s, { kind: 'valis', index: 0 });
  assert.equal(total(swapped, 'Earth'), 0);
  assert.equal(total(swapped, 'Fire'), 25);

  const rows = scenarioRows(s);
  assert.equal(rows.length, 2);
  assert.equal(rows[0].isBase, true);
});

test('el optimizador cubre los 10 elementos con la meta de 100 entre el equipo puesto y sus cambios', { timeout: 60000 }, () => {
  const result = searchBest('all', true, 2);
  const rows = scenarioRows(result.state);
  assert.equal(rows.length, 3); // equipo puesto + 1 Valis + 1 Armor de cambio
  for (const el of ELEMENTS) {
    const best = Math.max(...rows.map(r => total(r.totals, el)));
    assert.ok(best >= 100, `${el} no llega a 100 (mejor: ${best})`);
  }
});

test('la build del optimizador sobrevive al saneado (se puede aplicar tal cual)', { timeout: 60000 }, () => {
  const result = searchBest('Water', false, 3);
  const clean = sanitizeState(JSON.parse(JSON.stringify(result.state)));
  assert.deepEqual(calculate(clean).resist, calculate(result.state).resist);
  assert.equal(clean.extras.valis.length, 2);
  assert.equal(clean.extras.armor.length, 1);
});

test('cartas de accesorio: Yoyo se repite; Vesper y Bacsojin son únicas por accesorio', () => {
  const s = emptyState();
  s.accessory.slots = ['Yoyo', 'Yoyo', 'Vesper', 'Vesper'];
  s.accessory2.slots = ['Bacsojin', 'Bacsojin', 'Vesper', ''];
  const clean = sanitizeState(s);
  assert.deepEqual(clean.accessory.slots, ['Yoyo', 'Yoyo', 'Vesper', '']);
  assert.deepEqual(clean.accessory2.slots, ['Bacsojin', '', 'Vesper', '']);
  const { stats } = calculate(clean);
  assert.equal(stats.perfectDodge, 5 + 5 + 2 + 2); // 2 Yoyo + 2 Vesper
  assert.equal(stats.resPhys, 3);
  assert.equal(stats.resMisc, 3);
});

test('Shoes: Sprinting suma +5 al elemento elegido; Variant Shoes V2 +10 suma bonos físicos y mágicos', () => {
  const s = emptyState();
  s.shoes = { type: 'Sprinting shoes Plus', element: 'Fire' };
  assert.equal(calculate(s).resist[idx('Fire')], 5);
  assert.deepEqual(calculate(s).stats, {});

  s.shoes = { type: 'Variant Shoes V2 +10', element: '' };
  const t = calculate(s);
  assert.equal(t.stats.resPhys, 5);
  assert.equal(t.stats.resMagic, 5);
  assert.ok(t.resist.every(v => v === 0));
});

test('el elemento del calzado solo se conserva con Sprinting shoes Plus', () => {
  const clean = sanitizeState({ shoes: { type: 'Variant Shoes V2 +10', element: 'Fire' } });
  assert.equal(clean.shoes.element, '');
});

test('los builds guardados con el sprinting antiguo se migran a Shoes', () => {
  const on = sanitizeState({ sprint: { on: true, element: 'Water' } });
  assert.deepEqual(on.shoes, { type: 'Sprinting shoes Plus', element: 'Water' });
  const off = sanitizeState({ sprint: { on: false, element: 'Water' } });
  assert.deepEqual(off.shoes, { type: '', element: '' });
});

test('notas flotantes: combo del equipo puesto y aviso del calzado +10', () => {
  const s = emptyState();
  assert.deepEqual(activeNotes(s), []);
  s.armor.type = 'Earth Golden Lord Robe';
  s.valis.element = 'Earth';
  s.shoes.type = 'Variant Shoes V2 +10';
  const notes = activeNotes(s);
  assert.deepEqual(notes.map(n => n.id), ['combo:Earth', 'shoes:Variant Shoes V2 +10']);
  assert.match(notes[1].lines[0], /\+10/);
});

test('el CSS no usa funciones de color que html2canvas no entiende (rompen "Exportar imagen")', () => {
  const css = readFileSync(new URL('../css/style.css', import.meta.url), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  for (const fn of ['color-mix(', 'oklch(', 'oklab(', 'lab(', 'lch(', 'color(', 'light-dark(']) {
    assert.ok(!css.includes(fn), `style.css usa ${fn}`);
  }
});
