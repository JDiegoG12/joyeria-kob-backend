/**
 * @file prerender.compose.ts
 * @description Lee el shell de Vite y compone el HTML final de cada ruta:
 * shell (con los <script>/<link> con hash de Vite) + head SEO + snapshot del
 * contenido dentro de #root. El mismo HTML sirve a usuarios y a bots — React
 * (createRoot) reemplaza #root al montar, así que el snapshot solo lo aprovecha
 * un crawler sin JS. Sin sniffing de User-Agent → sin riesgo de cloaking.
 */

import { readFile } from 'node:fs/promises';
import { SHELL_PATH } from './prerender.config';

/** Lee el `index.html` desplegado del frontend como plantilla base. */
export const readShell = async (): Promise<string> => {
  try {
    return await readFile(SHELL_PATH, 'utf8');
  } catch {
    throw new Error(
      `No se pudo leer el shell del frontend en ${SHELL_PATH}. ` +
        '¿Está desplegado el frontend y es correcta FRONTEND_PUBLIC_DIR?',
    );
  }
};

/**
 * Compone una página: quita el `<title>` genérico del shell, inyecta el head
 * SEO antes de `</head>` y el `body` dentro de `<div id="root">…</div>`.
 *
 * @param shell - Contenido de `index.html` (plantilla de Vite).
 * @param head  - Bloque SEO de `buildSeoHead` (incluye su propio `<title>`).
 * @param body  - HTML del contenido a inyectar en #root.
 */
export const composePage = (shell: string, head: string, body: string): string => {
  const withHead = shell
    .replace(/[ \t]*<title>[\s\S]*?<\/title>\s*\n?/i, '')
    .replace(/<\/head>/i, `${head}\n</head>`);

  const rootRe = /<div id="root">\s*<\/div>/i;
  if (!rootRe.test(withHead)) {
    throw new Error(
      'El shell no contiene <div id="root"></div>; no se pudo inyectar el contenido.',
    );
  }
  return withHead.replace(rootRe, `<div id="root">\n${body}\n  </div>`);
};
