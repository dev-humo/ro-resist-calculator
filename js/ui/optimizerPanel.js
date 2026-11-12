/**
 * Panel del optimizador: lanza la búsqueda y muestra las builds propuestas.
 */

import { OPT_GOAL, OPT_OK_BAND, OPT_VALIS_COUNTS } from '../config/constants.js';
import { scenarioRows } from '../core/engine.js';
import { searchBest } from '../core/optimizer.js';
import { $, h } from './dom.js';
import { buildMatrix } from './matrix.js';
import { replaceState, store } from './store.js';
import { toast } from './toast.js';

function describeBuild(s) {
  const list = arr => {
    const counts = new Map();
    arr.filter(Boolean).forEach(name => counts.set(name, (counts.get(name) || 0) + 1));
    return [...counts].map(([name, n]) => (n > 1 ? `${name} \u00d7${n}` : name)).join(', ');
  };
  const rows = [
    ['Hat', list(s.hat.slots)],
    ['Wings', list(s.wings.slots)],
    ['Mid', list(s.mid.slots)],
    ['Armor', list(s.armor.slots)],
    ['Tipo de armor', s.armor.type],
    ['Valis', list(s.valis.slots)],
    ['Elemento valis', s.valis.element]
  ];
  s.extras.armor.forEach((g, i) => rows.push(
    [`Armor \u00b7 cambio ${i + 1}`, list(g.slots)], [`Tipo \u00b7 cambio ${i + 1}`, g.type]));
  s.extras.valis.forEach((g, i) => rows.push(
    [`Valis \u00b7 cambio ${i + 1}`, list(g.slots)], [`Elemento \u00b7 cambio ${i + 1}`, g.element]));
  rows.push(
    ['Shield', list(s.shield.slots)],
    ['Tipo de shield', s.shield.type],
    ['Shoes', s.shoes.type && s.shoes.element ? `${s.shoes.type} \u00b7 ${s.shoes.element}` : s.shoes.type]);
  return rows.filter(([, value]) => value);
}

function buildResultCard(result) {
  const parts = [];
  if (result.valisCount > 1) parts.push(`${result.valisCount - 1} de Valis`);
  if (result.armorCount > 1) parts.push(`${result.armorCount - 1} de Armor`);

  const items = h('dl', { class: 'opt-items' },
    describeBuild(result.state).map(([label, value]) =>
      h('div', {}, h('dt', {}, label), h('dd', {}, value))));

  return h('article', { class: 'opt-card' },
    h('h3', {}, `Base + cambios: ${parts.join(' \u00b7 ')}${result.vip ? ' \u00b7 VIP' : ''}`),
    buildMatrix(scenarioRows(result.state)),
    items,
    h('button', {
      type: 'button', class: 'btn btn-primary',
      onClick: () => {
        replaceState(result.state);
        toast('Build aplicada.');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }, 'Aplicar esta build'));
}

function renderResults(target, results) {
  const panel = $('#optResults');
  const label = target === 'all' ? 'todos los elementos' : target;
  panel.textContent = '';
  panel.append(
    h('div', { class: 'opt-head' },
      h('div', {},
        h('h2', {}, `Mejores builds para ${label}`),
        h('p', { class: 'opt-note' },
          'Solo llevas 1 Armor y 1 Valis: la primera fila es el equipo puesto y las demás, lo que pasa al cambiar una pieza. ' +
          `Cada número es resistencia + reducción; la meta es ${OPT_GOAL} o poco más ` +
          `(verde ${OPT_GOAL}\u2013${OPT_GOAL + OPT_OK_BAND}, ámbar más de ${OPT_GOAL + OPT_OK_BAND}, rojo menos de ${OPT_GOAL}). ` +
          '\u25b2 = ese elemento se cuida más al cambiar, \u25bc = se descuida. ' +
          'Se usa el VIP que tengas activado en Wings.')),
      h('button', { type: 'button', class: 'btn', onClick: () => { panel.hidden = true; } }, 'Cerrar')),
    h('div', { class: 'opt-grid' }, results.map(r => buildResultCard(r))));
  panel.hidden = false;
  panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  panel.focus({ preventScroll: true });
}

const yieldToBrowser = () => new Promise(resolve => setTimeout(resolve, 30));

export async function optimizeBuild() {
  const target = $('#optimizeElement').value;
  const vip = store.state.vip;
  const btn = $('#optimizeBtn');
  btn.disabled = true;

  try {
    const results = [];
    for (const valisCount of OPT_VALIS_COUNTS) {
      // Cede el hilo entre búsquedas para que el navegador pinte el avance.
      btn.textContent = `Calculando ${results.length + 1}/${OPT_VALIS_COUNTS.length}\u2026`;
      await yieldToBrowser();
      results.push(searchBest(target, vip, valisCount));
    }
    renderResults(target, results);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Optimizar build';
  }
}
