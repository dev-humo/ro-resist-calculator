/**
 * Exportar la página como imagen PNG con html2canvas.
 */

import { $, h } from './dom.js';
import { toast } from './toast.js';

const nextFrame = () => new Promise(resolve => requestAnimationFrame(() => resolve()));

const HTML2CANVAS_URLS = [
  'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js',
  'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js'
];

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = resolve;
    script.onerror = () => reject(new Error(`No se pudo cargar ${src}`));
    document.head.appendChild(script);
  });
}

/** html2canvas llega por <script>; si no estaba disponible se reintenta con un CDN alternativo. */
async function ensureHtml2Canvas() {
  if (typeof window.html2canvas === 'function') return true;
  for (const url of HTML2CANVAS_URLS) {
    try {
      await loadScript(url);
      if (typeof window.html2canvas === 'function') return true;
    } catch (err) {
      console.warn(err.message);
    }
  }
  return false;
}

export async function exportAsImage() {
  if (!(await ensureHtml2Canvas())) {
    toast('No se pudo cargar la herramienta de exportación. Comprueba tu conexión e inténtalo de nuevo.');
    return;
  }
  const btn = $('#exportBtn');
  const scrollY = window.scrollY;
  btn.disabled = true;
  document.body.classList.add('exporting');
  window.scrollTo(0, 0);

  try {
    if (document.fonts && document.fonts.ready) await document.fonts.ready;
    await nextFrame();

    const canvas = await window.html2canvas($('#capture'), {
      backgroundColor: getComputedStyle(document.body).backgroundColor,
      scale: 2,
      logging: false,
      useCORS: true,
      scrollX: 0,
      scrollY: 0
    });

    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
    if (!blob) throw new Error('No se pudo generar la imagen');

    const url = URL.createObjectURL(blob);
    const link = h('a', { href: url, download: 'resistencias-ro-completo.png' });
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    toast('Imagen exportada.');
  } catch (err) {
    console.error(err);
    toast(`No se pudo exportar la imagen: ${String((err && err.message) || err).slice(0, 120)}`);
  } finally {
    document.body.classList.remove('exporting');
    window.scrollTo(0, scrollY);
    btn.disabled = false;
  }
}
