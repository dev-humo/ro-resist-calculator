/**
 * Resumen superior: casillas por elemento, etiquetas de bonos y notas flotantes.
 */

import { ELEMENTS, STAT_DEFS } from '../config/constants.js';
import { activeNotes, levelOf } from '../core/engine.js';
import { $, elVar, fmt, h } from './dom.js';
import { store } from './store.js';

let tileRefs = [];
let firstPaint = true;

export function buildTiles() {
  const wrap = $('#tiles');
  wrap.textContent = '';
  tileRefs = ELEMENTS.map(el => {
    const mk = (kind, label) => {
      const value = h('output', { class: 'stat-value' }, '0');
      const fill = h('i');
      const node = h('div', { class: 'stat lvl-zero', 'data-kind': kind },
        h('span', { class: 'stat-label' }, label),
        value,
        h('span', { class: 'meter', 'aria-hidden': 'true' }, fill));
      return { node, value, fill };
    };
    const res = mk('res', 'Resist.');
    const red = mk('red', 'Reduc.');
    const tile = h('div', { class: 'tile', role: 'group', style: `--el:${elVar(el)}` },
      h('div', { class: 'tile-name' }, el),
      h('div', { class: 'stats' }, res.node, red.node));
    wrap.appendChild(tile);
    return { tile, res, red };
  });
}

function paintStat(stat, value, animate) {
  const text = fmt(value);
  const changed = stat.value.textContent !== text;
  stat.value.textContent = text;
  stat.fill.style.width = Math.min(100, Math.max(0, value)) + '%';
  stat.node.className = `stat lvl-${levelOf(value)}`;
  if (changed && animate) {
    stat.node.classList.remove('changed');
    void stat.node.offsetWidth; // reinicia la animación
    stat.node.classList.add('changed');
  }
}

export function renderSummary(totals) {
  ELEMENTS.forEach((el, i) => {
    const ref = tileRefs[i];
    paintStat(ref.res, totals.resist[i], !firstPaint);
    paintStat(ref.red, totals.reduc[i], !firstPaint);
    ref.tile.setAttribute('aria-label',
      `${el}: resistencia ${totals.resist[i]}, reducción ${totals.reduc[i]}`);
  });
  renderTags(totals.stats);
  renderNotes(activeNotes(store.state));
  firstPaint = false;
}

/* ---------- Etiquetas de bonos (se suman todas las fuentes) ---------- */

let prevStats = {};

function renderTags(stats) {
  const root = $('#tags');
  root.textContent = '';
  for (const def of STAT_DEFS) {
    const v = stats[def.id] || 0;
    if (!v) continue;
    const changed = !firstPaint && prevStats[def.id] !== v;
    root.append(h('span', { class: `tag${changed ? ' changed' : ''}` },
      h('span', {}, def.label),
      h('b', {}, `${v > 0 ? '+' : ''}${fmt(v)}${def.unit}`)));
  }
  root.hidden = root.childElementCount === 0;
  prevStats = { ...stats };
}

/* ---------- Notas flotantes (combos y avisos de calzado) ---------- */

const noteNodes = new Map();
const dismissedNotes = new Set();

function noteNode(note) {
  const color = note.el ? elVar(note.el) : 'var(--accent)';
  return h('article', { class: 'float-note', style: `--el:${color}`, role: 'note' },
    h('header', {},
      h('h3', {}, note.title),
      h('button', {
        type: 'button', class: 'float-close', 'aria-label': `Cerrar nota: ${note.title}`,
        onClick: () => { dismissedNotes.add(note.id); renderNotes(activeNotes(store.state)); }
      }, '\u00d7')),
    h('ul', {}, note.lines.map(text => h('li', {}, text))));
}

function renderNotes(notes) {
  const root = $('#floatingNotes');
  const ids = notes.map(n => n.id);
  // Si una nota deja de aplicar, al volver a activarse reaparece aunque se hubiera cerrado.
  for (const id of [...dismissedNotes]) if (!ids.includes(id)) dismissedNotes.delete(id);
  const wanted = notes.filter(n => !dismissedNotes.has(n.id));
  const wantedIds = wanted.map(n => n.id);
  for (const [id, node] of noteNodes) {
    if (!wantedIds.includes(id)) { node.remove(); noteNodes.delete(id); }
  }
  for (const note of wanted) {
    if (!noteNodes.has(note.id)) {
      const node = noteNode(note);
      noteNodes.set(note.id, node);
      root.append(node);
    }
  }
  root.hidden = noteNodes.size === 0;
}
