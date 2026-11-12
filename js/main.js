/**
 * Punto de entrada: conecta el estado con la interfaz y registra los eventos.
 */

import { calculate } from './core/engine.js';
import { clone, emptyState } from './core/state.js';
import { $ } from './ui/dom.js';
import { renderEquipment } from './ui/equipment.js';
import { exportAsImage } from './ui/exportImage.js';
import { renderSwaps } from './ui/matrix.js';
import { optimizeBuild } from './ui/optimizerPanel.js';
import { loadInitialState, persist } from './ui/persistence.js';
import { commit, replaceState, store, subscribe } from './ui/store.js';
import { buildTiles, renderSummary } from './ui/summary.js';
import { applyTheme, toggleTheme } from './ui/theme.js';
import { toast } from './ui/toast.js';

subscribe('replace', renderEquipment);

// Cada cambio de valores: refresca el resumen y la matriz de cambios y guarda el build.
subscribe('change', () => {
  renderSummary(calculate(store.state));
  renderSwaps();
  persist();
});

function resetAll() {
  const previous = clone(store.state);
  replaceState(emptyState());
  toast('Build reiniciada.', { label: 'Deshacer', onClick: () => replaceState(previous) });
}


function init() {
  applyTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light', false);
  $('#themeToggle').addEventListener('click', toggleTheme);

  buildTiles();
  store.state = loadInitialState();
  renderEquipment();
  commit();

  $('#optimizeBtn').addEventListener('click', optimizeBuild);
  $('#exportBtn').addEventListener('click', exportAsImage);
  $('#resetBtn').addEventListener('click', resetAll);
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();
