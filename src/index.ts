import app from './api/app';
import { startPrerenderScheduler } from './features/render/prerender/prerender.scheduler';

/**
 * Puerto de ejecución del servidor.
 * Toma el valor de las variables de entorno o usa el 4000 por defecto.
 */
const PORT = process.env.PORT || 4000;

/**
 * Inicializa el servidor Express y lo deja escuchando peticiones. Una vez
 * activo, arranca el temporizador interno del pre-render (SEO): regenera los
 * HTML estáticos al arrancar y cada N horas. Sustituye al cron de sistema, que
 * está deshabilitado en el plan de Hostinger. Ver prerender.scheduler.ts.
 */
app.listen(PORT, () => {
  console.log(`Servidor de Joyería KOB corriendo en http://localhost:${PORT}`);
  console.log(`Documentación Swagger en http://localhost:${PORT}/api-docs`);
  startPrerenderScheduler();
});
