/**
 * Avisos temporales (con acción opcional, por ejemplo Deshacer).
 */

import { $, h } from './dom.js';

let toastTimer = null;

export function toast(message, action) {
  const node = $('#toast');
  node.textContent = '';
  node.append(h('span', {}, message));
  if (action) {
    node.append(h('button', {
      type: 'button',
      onClick: () => { action.onClick(); node.hidden = true; }
    }, action.label));
  }
  node.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { node.hidden = true; }, action ? 7000 : 3500);
}
