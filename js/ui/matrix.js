/**
 * Matriz de cambios: equipo puesto frente a cada pieza de cambio (se usa en la página y en el optimizador).
 */

import { ELEMENTS, OPT_GOAL, OPT_OK_BAND } from '../config/constants.js';
import { scenarioRows } from '../core/engine.js';
import { $, elVar, fmt, h } from './dom.js';
import { store } from './store.js';

/**
 * Matriz elemento x escenario. Cada celda es resistencia + reducción; en los cambios
 * se indica la diferencia con el equipo puesto (\u25b2 se cuida más, \u25bc se descuida)
 * y se resalta cuando el elemento cruza la meta de 100.
 */
export function buildMatrix(rows, { wide = false } = {}) {
  const eff = t => t.resist.map((v, i) => v + t.reduc[i]);
  const baseEff = eff(rows[0].totals);
  const statusOf = v => (v < OPT_GOAL ? 'is-short' : v <= OPT_GOAL + OPT_OK_BAND ? 'is-ok' : 'is-over');

  const head = h('div', { class: 'mx-row mx-head', 'aria-hidden': 'true' },
    h('div', { class: 'mx-label' }),
    h('div', { class: 'mx-cells' }, ELEMENTS.map(el =>
      h('div', { class: 'mx-name', style: `--el:${elVar(el)}` },
        h('span', { class: 'abbr' }, el.slice(0, 3)), h('span', { class: 'full' }, el)))));

  const body = rows.map(row => {
    const cells = eff(row.totals).map((total, i) => {
      const diff = total - baseEff[i];
      let cls = `mx-cell ${statusOf(total)}`;
      let delta = null;
      let text = '';
      if (!row.isBase && diff !== 0) {
        const crossed = (baseEff[i] < OPT_GOAL) !== (total < OPT_GOAL);
        if (crossed) cls += diff > 0 ? ' is-gain' : ' is-loss';
        delta = h('small', { class: `delta ${diff > 0 ? 'up' : 'down'}` },
          `${diff > 0 ? '\u25b2' : '\u25bc'}${Math.abs(diff)}`);
        text = `, ${diff > 0 ? 'sube' : 'baja'} ${Math.abs(diff)} respecto al equipo puesto`;
      }
      const label = `${ELEMENTS[i]}: ${fmt(total)} (resistencia ${fmt(row.totals.resist[i])} + reducción ${fmt(row.totals.reduc[i])})${text}`;
      return h('div', { class: cls, title: label, 'aria-label': label, role: 'text' },
        h('b', {}, fmt(total)), delta);
    });
    return h('div', { class: `mx-row${row.isBase ? ' is-base' : ''}` },
      h('div', { class: 'mx-label' },
        h('span', { class: 'mx-title' }, row.label),
        row.detail ? h('span', { class: 'mx-detail' }, row.detail) : null,
        row.combos.length ? h('span', { class: 'mx-combo' }, `combo ${row.combos.join(', ')}`) : null),
      h('div', { class: 'mx-cells' }, cells));
  });

  return h('div', { class: `matrix${wide ? ' matrix-wide' : ''}` }, head, ...body);
}

export function renderSwaps() {
  const root = $('#swaps');
  const rows = scenarioRows(store.state);
  root.hidden = rows.length < 2;
  if (root.hidden) return;
  const holder = $('#swapsMatrix');
  holder.textContent = '';
  holder.append(buildMatrix(rows, { wide: true }));
}
