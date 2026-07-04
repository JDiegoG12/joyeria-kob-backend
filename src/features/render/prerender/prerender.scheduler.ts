/**
 * @file prerender.scheduler.ts
 * @description Temporizador INTERNO del pre-render. El plan de Hostinger tiene
 * el cron de sistema deshabilitado, así que en vez de un cron externo la propia
 * app Node (proceso persistente) regenera el pre-render: una vez al arrancar y
 * luego cada N horas con `setInterval`.
 *
 * Al correr dentro de la app, ya dispone de las variables de entorno que
 * Hostinger inyecta (DB_URL, etc.) — NO necesita `dotenv` ni `--env-file`.
 *
 * Robustez: cada ejecución va envuelta en try/catch, de modo que un fallo del
 * pre-render (p. ej. BD momentáneamente caída) NUNCA tumba el servidor ni
 * detiene el timer. Un flag `isRunning` evita solapamientos si una corrida tarda
 * más que el intervalo.
 *
 * Este timer es ADICIONAL al CLI (`prerender.cli.ts`), que se sigue usando
 * manualmente por SSH tras cada deploy del frontend (hashes de Vite nuevos).
 */

import { runPrerender } from './prerender.generator';

/** Horas entre regeneraciones. Configurable; default 6, mínimo defensivo 0.1h. */
const INTERVAL_HOURS = (() => {
  const parsed = Number(process.env.PRERENDER_INTERVAL_HOURS);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 6;
})();

const INTERVAL_MS = INTERVAL_HOURS * 60 * 60 * 1000;

/** `true` mientras hay una generación en curso: evita corridas solapadas. */
let isRunning = false;

/**
 * Corre una regeneración protegida: salta si ya hay una en curso y captura
 * cualquier error para no propagarlo al proceso.
 *
 * @param trigger - Origen de la corrida ('arranque' | 'timer'), solo para log.
 */
const runGuarded = async (trigger: string): Promise<void> => {
  if (isRunning) {
    console.warn(
      `[prerender] ${new Date().toISOString()} · omitido (${trigger}): ` +
        'ya hay una generación en curso',
    );
    return;
  }

  isRunning = true;
  try {
    await runPrerender();
  } catch (err) {
    console.error(
      `[prerender] ${new Date().toISOString()} · ERROR (${trigger}): ` +
        `${err instanceof Error ? err.message : String(err)}`,
    );
  } finally {
    isRunning = false;
  }
};

/**
 * Arranca el temporizador interno del pre-render. Se llama una vez desde el
 * bootstrap del servidor, cuando la app ya está escuchando.
 *
 * Interruptores por env (para apagarlo sin redeploy):
 *  - `PRERENDER_ON_BOOT=false`       → no regenerar al arrancar.
 *  - `PRERENDER_TIMER_ENABLED=false` → no programar el intervalo.
 *  - `PRERENDER_INTERVAL_HOURS=N`    → cambiar la frecuencia (default 6).
 */
export const startPrerenderScheduler = (): void => {
  const onBoot = process.env.PRERENDER_ON_BOOT !== 'false';
  const timerEnabled = process.env.PRERENDER_TIMER_ENABLED !== 'false';

  if (onBoot) {
    // Sin await: no bloquear el arranque del servidor. runGuarded captura errores.
    void runGuarded('arranque');
  }

  if (!timerEnabled) {
    console.log(
      '[prerender] scheduler DESACTIVADO (PRERENDER_TIMER_ENABLED=false)' +
        (onBoot ? ' — solo corre al arrancar' : ''),
    );
    return;
  }

  const timer = setInterval(() => void runGuarded('timer'), INTERVAL_MS);
  // No mantener vivo el proceso solo por el timer; permite cierres limpios.
  timer.unref();

  console.log(
    `[prerender] scheduler activo: cada ${INTERVAL_HOURS}h (on-boot=${onBoot})`,
  );
};
