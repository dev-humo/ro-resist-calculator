/**
 * Utilidades de DOM.
 */

export const $ = (selector, root = document) => root.querySelector(selector);
export const fmt = n => (n < 0 ? '\u2212' + Math.abs(n) : String(n));
export const elVar = el => `var(--el-${el.toLowerCase()})`;

export function h(tag, props = {}, ...children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(props)) {
    if (value == null || value === false) continue;
    if (key === 'class') node.className = value;
    else if (key.startsWith('on')) node.addEventListener(key.slice(2).toLowerCase(), value);
    else node.setAttribute(key, value === true ? '' : value);
  }
  node.append(...children.flat(Infinity).filter(c => c != null && c !== false));
  return node;
}
