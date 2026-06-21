import { Request, Response } from 'express';
import { BotAwareRequest } from '../../api/middlewares/bot-detection.middleware';
import {
  getRenderHomeData,
  getRenderCatalogData,
  getRenderProductData,
} from './render.service';
import {
  buildHomeHtml,
  buildCatalogHtml,
  buildProductHtml,
  buildNotFoundHtml,
} from './render.view';

/**
 * Envía una respuesta HTML. Centraliza los headers comunes:
 * - `Content-Type: text/html` con charset.
 * - `Cache-Control` corto: el contenido (precios) cambia, pero un poco de caché
 *   alivia los crawlers agresivos. `s-maxage` para CDN/proxy intermedios.
 * - `X-Rendered-For`: diagnóstico (bot vs. generic) según la detección de isbot.
 *   No altera el contenido; solo ayuda a verificar el flujo desde Apache/curl.
 */
const sendHtml = (
  req: BotAwareRequest,
  res: Response,
  html: string,
  statusCode = 200,
): void => {
  res
    .status(statusCode)
    .set({
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=300, s-maxage=600',
      'X-Rendered-For': req.isBot ? 'bot' : 'generic',
    })
    .send(html);
};

/** GET /render/home — HTML pre-renderizado de la página principal. */
export const renderHome = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const data = await getRenderHomeData();
  sendHtml(req, res, buildHomeHtml(data));
};

/** GET /render/catalogo — HTML pre-renderizado del catálogo público. */
export const renderCatalog = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const products = await getRenderCatalogData();
  sendHtml(req, res, buildCatalogHtml(products));
};

/**
 * GET /render/producto/:slug — HTML pre-renderizado del detalle de una joya.
 * Si el slug no resuelve a un producto indexable, responde 404 con HTML
 * `noindex` (no JSON), que es lo que un crawler espera de una URL inexistente.
 */
export const renderProduct = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const slug = String(req.params.slug ?? '');
  const product = await getRenderProductData(slug);
  if (!product) {
    sendHtml(req, res, buildNotFoundHtml(), 404);
    return;
  }
  sendHtml(req, res, buildProductHtml(product));
};
