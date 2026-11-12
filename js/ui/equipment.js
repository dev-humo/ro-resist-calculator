/**
 * Tarjetas de equipo: selectores de cartas, tipos, VIP, calzado y piezas de cambio.
 */

import { ELEMENTS, KIND_TITLES, MAX_EXTRAS, SHIELD_TYPES, SHOE_TYPES, SPRINTING_SHOES, STAT_BY_ID, VALIS_ELEMENTS } from '../config/constants.js';
import { gameData } from '../config/gameData.js';
import { shoesEffect, slotEffect, sprintEffect, typeEffect } from '../core/engine.js';
import { isUniqueCard, newGroup, slotPool } from '../core/state.js';
import { $, elVar, h } from './dom.js';
import { commit, store } from './store.js';

function describeEffect(eff) {
  if (!eff) return null;
  const entries = [];
  for (const [el, v] of Object.entries(eff.res || {})) entries.push({ el, v, type: 'res' });
  for (const [el, v] of Object.entries(eff.red || {})) entries.push({ el, v, type: 'red' });
  for (const [id, v] of Object.entries(eff.stat || {})) entries.push({ id, v, type: 'stat' });
  if (!entries.length) return null;

  const sign = v => (v > 0 ? '+' : '') + v;
  const title = entries
    .map(e => e.type === 'stat'
      ? `${STAT_BY_ID[e.id].label} ${sign(e.v)}${STAT_BY_ID[e.id].unit}`
      : `${e.type === 'red' ? 'Reducción' : 'Resistencia'} ${e.el} ${sign(e.v)}`)
    .join('\n');

  if (entries.length === 1) {
    const e = entries[0];
    if (e.type === 'stat') {
      const d = STAT_BY_ID[e.id];
      return { text: `${sign(e.v)}${d.unit} ${d.short}`, title, el: null };
    }
    return { text: `${e.type === 'red' ? 'Red. ' : ''}${sign(e.v)} ${e.el}`, title, el: e.el };
  }
  const uniform = entries.length === ELEMENTS.length &&
    entries.every(e => e.type === 'res' && e.v === entries[0].v);
  if (uniform) return { text: `${sign(entries[0].v)} a todos`, title, el: null };
  const onlyElements = entries.every(e => e.type !== 'stat');
  return { text: `${entries.length} ${onlyElements ? 'elementos' : 'bonos'}`, title, el: null };
}

function paintHint(node, info) {
  node.textContent = info ? info.text : '';
  node.title = info ? info.title : '';
  if (info && info.el) {
    node.style.setProperty('--el', elVar(info.el));
    node.classList.add('has-el');
  } else {
    node.style.removeProperty('--el');
    node.classList.remove('has-el');
  }
}

/* ---------- Equipo (render) ---------- */

function selectRow({ label, placeholder, options, value, fid, describe, onChange, disabled = false }) {
  const select = h('select', { 'aria-label': label, 'data-fid': fid, disabled },
    h('option', { value: '' }, placeholder),
    options.map(o => h('option', { value: o }, o)));
  select.value = value;

  const hint = h('span', { class: 'hint' });
  const refresh = () => {
    select.dataset.empty = String(select.value === '');
    paintHint(hint, describe(select.value));
  };
  select.addEventListener('change', () => {
    onChange(select.value);
    refresh();
    commit();
  });
  refresh();
  return h('div', { class: 'slot-row' }, select, hint);
}

function switchControl({ label, checked, onChange, fid }) {
  const input = h('input', { type: 'checkbox', role: 'switch', 'data-fid': fid });
  input.checked = checked;
  input.addEventListener('change', () => onChange(input.checked));
  return h('label', { class: 'switch' },
    input,
    h('span', { class: 'switch-track', 'aria-hidden': 'true' }),
    h('span', { class: 'switch-text' }, label));
}

function stepper(kind) {
  const count = store.state.extras[kind].length;
  const name = KIND_TITLES[kind];
  return h('div', { class: 'stepper', role: 'group', 'aria-label': `Cambios de ${name}` },
    h('span', {}, 'Cambios'),
    h('button', {
      type: 'button', class: 'step-btn', 'aria-label': `Quitar un cambio de ${name}`,
      'data-fid': `${kind}-minus`, disabled: count === 0, onClick: () => removeExtra(kind)
    }, '\u2212'),
    h('output', {}, `${count}/${MAX_EXTRAS[kind]}`),
    h('button', {
      type: 'button', class: 'step-btn', 'aria-label': `Añadir un cambio de ${name}`,
      'data-fid': `${kind}-plus`, disabled: count >= MAX_EXTRAS[kind], onClick: () => addExtra(kind)
    }, '+'));
}

function gearCard(kind, group, { title, control = null, isExtra = false, fid }) {
  const rows = [];

  if (kind === 'armor') {
    rows.push(selectRow({
      label: `${title}: tipo`, placeholder: '\u2014 Tipo \u2014', fid: `${fid}-type`,
      options: gameData.options.armor.types, value: group.type,
      describe: v => describeEffect(typeEffect('armor', v)),
      onChange: v => { group.type = v; }
    }));
  } else if (kind === 'valis') {
    rows.push(selectRow({
      label: `${title}: elemento`, placeholder: '\u2014 Elemento \u2014', fid: `${fid}-type`,
      options: VALIS_ELEMENTS, value: group.element,
      describe: v => describeEffect(typeEffect('valis', v)),
      onChange: v => { group.element = v; }
    }));
  } else if (kind === 'shield') {
    rows.push(selectRow({
      label: `${title}: tipo`, placeholder: '\u2014 Tipo \u2014', fid: `${fid}-type`,
      options: SHIELD_TYPES, value: group.type,
      describe: v => describeEffect(typeEffect('shield', v)),
      onChange: v => { group.type = v; }
    }));
  }

  group.slots.forEach((value, i) => {
    rows.push(selectRow({
      label: `${title}: slot ${i + 1}`,
      placeholder: kind === 'armor' ? `Slot ${i + 1} (${i === 0 ? 'Unique' : 'Element'})` : `Slot ${i + 1}`,
      fid: `${fid}-slot-${i}`,
      // Las cartas únicas ya usadas en otro slot del mismo ítem no se ofrecen.
      options: slotPool(kind, i).filter(o => !isUniqueCard(o) || value === o ||
        !group.slots.some((other, j) => j !== i && other === o)),
      value,
      describe: v => (v ? describeEffect(slotEffect(kind, i, v)) : null),
      onChange: v => {
        group.slots[i] = v;
        if (slotPool(kind, 0).some(isUniqueCard)) renderEquipment(); // refresca las opciones únicas disponibles
      }
    }));
  });

  return h('section', { class: `gear${isExtra ? ' is-extra' : ''}`, 'aria-label': title },
    h('header', { class: 'gear-head' }, h('h3', {}, title), control),
    h('div', { class: 'gear-body' }, rows));
}

function shoesCard() {
  const shoes = store.state.shoes;
  const rows = [selectRow({
    label: 'Shoes: calzado', placeholder: '\u2014 Calzado \u2014', fid: 'shoes-type',
    options: SHOE_TYPES, value: shoes.type,
    describe: v => (v ? describeEffect(shoesEffect({ type: v, element: '' })) : null),
    onChange: v => {
      shoes.type = v;
      if (v !== SPRINTING_SHOES) shoes.element = '';
      renderEquipment(); // muestra u oculta el selector de elemento
    }
  })];

  if (shoes.type === SPRINTING_SHOES) {
    rows.push(selectRow({
      label: 'Shoes: elemento', placeholder: '\u2014 Elemento \u2014', fid: 'shoes-element',
      options: ELEMENTS, value: shoes.element,
      describe: v => describeEffect(sprintEffect(v)),
      onChange: v => { shoes.element = v; }
    }));
  }

  return h('section', { class: 'gear', 'aria-label': 'Shoes' },
    h('header', { class: 'gear-head' }, h('h3', {}, 'Shoes')),
    h('div', { class: 'gear-body' }, rows));
}

export function renderEquipment() {
  const active = document.activeElement;
  const focusId = active && active.dataset ? active.dataset.fid : null;

  const root = $('#equipment');
  root.textContent = '';

  const addFamily = (kind, mainControl) => {
    root.appendChild(gearCard(kind, store.state[kind], { title: KIND_TITLES[kind], control: mainControl, fid: kind }));
    store.state.extras[kind].forEach((group, i) => {
      root.appendChild(gearCard(kind, group, {
        title: `${KIND_TITLES[kind]} \u00b7 cambio ${i + 1}`, isExtra: true, fid: `${kind}-extra-${i}`
      }));
    });
  };

  addFamily('hat', stepper('hat'));
  root.appendChild(gearCard('wings', store.state.wings, {
    title: 'Wings', fid: 'wings',
    control: switchControl({
      label: 'VIP', checked: store.state.vip, fid: 'vip',
      onChange: on => { store.state.vip = on; commit(); }
    })
  }));
  root.appendChild(gearCard('mid', store.state.mid, { title: 'Mid', fid: 'mid' }));
  addFamily('armor', stepper('armor'));
  addFamily('valis', stepper('valis'));
  root.appendChild(gearCard('shield', store.state.shield, { title: 'Shield', fid: 'shield' }));
  root.appendChild(gearCard('accessory', store.state.accessory, { title: 'Accesorios 1', fid: 'accessory' }));
  root.appendChild(gearCard('accessory2', store.state.accessory2, { title: 'Accesorios 2', fid: 'accessory2' }));
  root.appendChild(shoesCard());

  if (focusId) {
    let target = root.querySelector(`[data-fid="${focusId}"]`);
    if (target && target.disabled && focusId.endsWith('-minus')) {
      target = root.querySelector(`[data-fid="${focusId.replace('-minus', '-plus')}"]`);
    } else if (target && target.disabled && focusId.endsWith('-plus')) {
      target = root.querySelector(`[data-fid="${focusId.replace('-plus', '-minus')}"]`);
    }
    if (target && !target.disabled) target.focus();
  }
}

function addExtra(kind) {
  if (store.state.extras[kind].length >= MAX_EXTRAS[kind]) return;
  store.state.extras[kind].push(newGroup(kind));
  renderEquipment();
  commit();
}

function removeExtra(kind) {
  if (!store.state.extras[kind].length) return;
  store.state.extras[kind].pop();
  renderEquipment();
  commit();
}
