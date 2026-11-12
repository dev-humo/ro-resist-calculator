/**
 * Guardado local del build y lectura de enlaces antiguos (#b=).
 */

import { STORAGE_KEY } from '../config/constants.js';
import { emptyState, sanitizeState } from '../core/state.js';
import { store } from './store.js';

export function persist() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(store.state)); } catch (e) { /* almacenamiento no disponible */ }
}

function readFromHash() {
  const match = location.hash.match(/^#b=(.+)$/);
  if (!match) return null;
  try {
    return JSON.parse(atob(decodeURIComponent(match[1])));
  } catch (e) {
    return null;
  }
}

export function loadInitialState() {
  const fromHash = readFromHash();
  if (fromHash) {
    history.replaceState(null, '', location.pathname + location.search);
    return sanitizeState(fromHash);
  }
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return sanitizeState(JSON.parse(saved));
  } catch (e) { /* datos corruptos: se ignoran */ }
  return emptyState();
}
