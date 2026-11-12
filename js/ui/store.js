/**
 * Estado vivo de la aplicación y avisos de cambio entre módulos.
 */

import { emptyState, sanitizeState } from '../core/state.js';

/** Estado vivo de la aplicación. Siempre se lee como `store.state` (se reemplaza entero al cargar). */
export const store = { state: emptyState() };

const handlers = { change: [], replace: [] };

/** 'change': cambió algún valor. 'replace': se reemplazó el build o cambió la estructura. */
export const subscribe = (event, fn) => handlers[event].push(fn);

/** Avisa que el estado cambió (refresca resumen, matriz y guarda). */
export const commit = () => handlers.change.forEach(fn => fn());

/** Reemplaza todo el build (ya saneado), reconstruye el equipo y avisa del cambio. */
export function replaceState(next) {
  store.state = sanitizeState(next);
  handlers.replace.forEach(fn => fn());
  commit();
}
