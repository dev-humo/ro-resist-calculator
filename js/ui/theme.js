/**
 * Tema claro/oscuro.
 */

import { THEME_KEY } from '../config/constants.js';
import { $ } from './dom.js';

export function applyTheme(theme, save = true) {
  document.documentElement.setAttribute('data-theme', theme);
  if (save) {
    try { localStorage.setItem(THEME_KEY, theme); } catch (e) { /* ignorar */ }
  }
  const btn = $('#themeToggle');
  if (btn) {
    btn.setAttribute('aria-label', theme === 'dark' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro');
    btn.setAttribute('aria-pressed', String(theme === 'dark'));
  }
}

export function toggleTheme() {
  const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  applyTheme(next);
}
