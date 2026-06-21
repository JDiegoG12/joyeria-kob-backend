import { Router } from 'express';
import { asyncHandler } from '../../shared/utils/async-handler';
import { detectBot } from '../../api/middlewares/bot-detection.middleware';
import {
  renderHome,
  renderCatalog,
  renderProduct,
} from './render.controller';

/**
 * Rutas de dynamic rendering (SEO) montadas bajo `/render`.
 *
 * Devuelven HTML COMPLETO (no JSON) con el contenido real de las páginas
 * públicas equivalentes del frontend, para que los crawlers lo indexen. Apache
 * (del lado del frontend) enruta hacia aquí cuando detecta un user-agent de bot
 * (vía redirect 302 o proxy reverso — ver README/resumen).
 *
 * `detectBot` se aplica a nivel de router solo para exponer `req.isBot` (header
 * de diagnóstico `X-Rendered-For`); NO restringe el acceso, de modo que estas
 * rutas se puedan probar con `curl` o un navegador sin falsear el User-Agent.
 *
 * No requieren autenticación ni dependen de cookies de sesión: el HTML se sirve
 * igual sin importar el origen, lo cual es necesario porque frontend y backend
 * son dominios distintos.
 */
const router = Router();

router.use(detectBot);

router.get('/home', asyncHandler(renderHome));
router.get('/catalogo', asyncHandler(renderCatalog));
router.get('/producto/:slug', asyncHandler(renderProduct));

export default router;
