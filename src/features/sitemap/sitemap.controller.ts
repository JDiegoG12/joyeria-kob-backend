import { Request, Response } from 'express';
import { getSitemapEntries } from './sitemap.service';
import { buildSitemapXml } from './sitemap.xml';

/**
 * GET /sitemap.xml — Genera el sitemap dinámicamente desde la BD (productos no
 * ocultos vía Prisma) más las páginas estáticas, incluyendo el sitemap de
 * imágenes. Responde XML con el Content-Type correcto.
 */
export const getSitemap = async (
  _req: Request,
  res: Response,
): Promise<void> => {
  const entries = await getSitemapEntries();
  const xml = buildSitemapXml(entries);

  res
    .status(200)
    .set({
      'Content-Type': 'application/xml; charset=utf-8',
      // Caché moderada: el sitemap cambia cuando cambia el catálogo, pero no
      // necesita estar siempre fresco para los crawlers.
      'Cache-Control': 'public, max-age=3600',
    })
    .send(xml);
};
