/**
 * @file prerender.cli.ts
 * @description Entrypoint STANDALONE del pre-render, para el disparo MANUAL por
 * SSH tras cada deploy del frontend (regenera con los hashes de Vite nuevos).
 * Genera el pre-render completo y termina.
 *
 * La regeneración periódica NO la hace un cron (deshabilitado en el plan de
 * Hostinger) sino un timer interno en la app — ver `prerender.scheduler.ts`.
 * Este CLI es adicional a ese timer.
 *
 * Carga `dotenv` explícitamente porque, al ejecutarse fuera de la app (sesión
 * SSH), no hereda las variables que Hostinger inyecta al proceso Node. Ver el
 * comando exacto (con `--env-file`) en SEO-DEPLOY.md.
 *
 * Códigos de salida: 0 = ok, 1 = error.
 */

import 'dotenv/config';
import { prisma } from '../../../config/prisma';
import { runPrerender } from './prerender.generator';

runPrerender()
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
