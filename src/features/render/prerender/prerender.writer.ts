/**
 * @file prerender.writer.ts
 * @description Escritura atómica de los HTML y limpieza de productos retirados.
 *
 * Atomicidad: se escribe a un archivo temporal en el MISMO directorio y luego
 * se renombra sobre el definitivo. `rename(2)` es atómico dentro de un mismo
 * filesystem, así que Apache nunca sirve un `.html` a medio escribir.
 *
 * Permisos: se fija `0644` explícitamente para que Apache/LiteSpeed (mismo
 * usuario Linux) siempre pueda leerlos, sin depender del `umask` del cron.
 */

import { writeFile, rename, mkdir, chmod, readdir, unlink } from 'node:fs/promises';
import path from 'node:path';

/** Escribe `content` en `filePath` de forma atómica, con permisos 0644. */
export const writeFileAtomic = async (
  filePath: string,
  content: string,
): Promise<void> => {
  await mkdir(path.dirname(filePath), { recursive: true });
  const tmp = `${filePath}.tmp-${process.pid}`;
  await writeFile(tmp, content, { encoding: 'utf8', mode: 0o644 });
  // Reafirma permisos aun si el umask del cron los recortó al crear el archivo.
  await chmod(tmp, 0o644);
  await rename(tmp, filePath);
};

/**
 * Borra los `.html` de `dir` cuyo nombre base (sin extensión) NO esté en `keep`.
 * Purga productos retirados/ocultos desde la última corrida. No recursivo.
 *
 * @returns Los slugs efectivamente eliminados.
 */
export const pruneHtml = async (
  dir: string,
  keep: Set<string>,
): Promise<string[]> => {
  let entries: string[];
  try {
    entries = await readdir(dir);
  } catch {
    return []; // El directorio aún no existe (primera corrida): nada que purgar.
  }

  const removed: string[] = [];
  for (const name of entries) {
    if (!name.endsWith('.html')) continue;
    const slug = name.slice(0, -'.html'.length);
    if (!keep.has(slug)) {
      await unlink(path.join(dir, name));
      removed.push(slug);
    }
  }
  return removed;
};
