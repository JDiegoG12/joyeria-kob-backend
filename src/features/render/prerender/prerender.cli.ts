/**
 * @file prerender.cli.ts
 * @description Entrypoint ejecutado por el CRON de hPanel. Genera el pre-render
 * completo y termina. Carga `dotenv` explícitamente porque el cron NO hereda las
 * variables de entorno que el panel inyecta al proceso Node persistente.
 *
 * Ejecución (cada 6h): ver comando del cron en el README/plan SEO. También sirve
 * para el disparo MANUAL tras cada deploy del frontend (evita assets stale).
 *
 * Códigos de salida: 0 = ok, 1 = error (queda en el log del cron).
 */

import 'dotenv/config';
import { prisma } from '../../../config/prisma';
import { generatePrerender } from './prerender.generator';

const main = async (): Promise<void> => {
  const startedAt = Date.now();
  const result = await generatePrerender();
  const secs = ((Date.now() - startedAt) / 1000).toFixed(1);
  const prunedNote = result.pruned.length
    ? ` · purgados: ${result.pruned.join(', ')}`
    : '';
  console.log(
    `[prerender] ${new Date().toISOString()} · ${result.pages} páginas + ` +
      `${result.products} productos en ${secs}s${prunedNote}`,
  );
};

main()
  .then(async () => {
    await prisma.$disconnect();
    process.exit(0);
  })
  .catch(async (err) => {
    console.error(
      `[prerender] ERROR: ${err instanceof Error ? err.message : String(err)}`,
    );
    await prisma.$disconnect().catch(() => undefined);
    process.exit(1);
  });
