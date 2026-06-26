import { Request, Response } from 'express';
import { getGoogleFeedItems } from './google-feed.service';
import { buildGoogleFeedXml } from './google-feed.xml';

/**
 * GET /google-feed.xml — Genera dinámicamente el feed de productos de Google
 * (Merchant Center) desde la BD vía Prisma, igual que `getSitemap`.
 *
 * Incluye solo los productos públicos (status AVAILABLE), con precios calculados
 * en vivo, por lo que cada fetch de Google recibe precios actualizados al precio
 * del oro vigente. Responde RSS 2.0 con el Content-Type correcto.
 */
export const getGoogleFeed = async (
  _req: Request,
  res: Response,
): Promise<void> => {
  const items = await getGoogleFeedItems();
  const xml = buildGoogleFeedXml(items);

  res
    .status(200)
    .set({
      'Content-Type': 'application/xml; charset=utf-8',
      // Caché moderada: el feed cambia con el catálogo y el precio del oro, pero
      // no necesita estar siempre fresco para el rastreador de Google.
      'Cache-Control': 'public, max-age=3600',
    })
    .send(xml);
};
