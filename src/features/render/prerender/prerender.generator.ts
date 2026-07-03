/**
 * @file prerender.generator.ts
 * @description Orquesta la generación COMPLETA del pre-render en cada corrida:
 * home, catálogo, las 4 páginas de información, una página por producto
 * indexable (no-HIDDEN) y el sitemap.xml. Escribe atómicamente en el
 * `public_html` del frontend y purga las páginas de productos ya retirados.
 *
 * Regeneración total (no incremental) a propósito: es lo más robusto y el
 * modelo Product no tiene `updatedAt` para detectar cambios; el volumen de una
 * joyería hace el costo irrelevante.
 */

import path from 'node:path';
import {
  getRenderHomeData,
  getRenderCatalogData,
  getAllRenderProductDetails,
} from '../render.service';
import {
  buildHomeView,
  buildCatalogView,
  buildProductView,
  buildInfoView,
  INFO_PAGES,
} from '../render.view';
import { buildSeoHead, RenderView } from '../utils/html.util';
import { getSitemapEntries } from '../../sitemap/sitemap.service';
import { buildSitemapXml } from '../../sitemap/sitemap.xml';
import { readShell, composePage } from './prerender.compose';
import { writeFileAtomic, pruneHtml } from './prerender.writer';
import { PRERENDER_DIR, SITEMAP_PATH } from './prerender.config';

/** Resumen de una corrida del generador. */
export interface PrerenderResult {
  /** Páginas estáticas generadas (home + catálogo + informacion). */
  pages: number;
  /** Productos pre-renderizados. */
  products: number;
  /** Slugs de productos cuyas páginas se purgaron por estar retirados. */
  pruned: string[];
}

/** Compone el HTML final de un view (shell + head SEO + body). */
const renderFile = (shell: string, view: RenderView): string =>
  composePage(shell, buildSeoHead(view.meta), view.body);

/**
 * Genera todo el pre-render y el sitemap, y devuelve un resumen. Lanza si el
 * shell del frontend no está disponible (no escribe nada parcial en ese caso).
 */
export const generatePrerender = async (): Promise<PrerenderResult> => {
  const shell = await readShell();

  // ── Páginas estáticas: home + catálogo ──────────────────────────────────
  const [homeData, catalogData] = await Promise.all([
    getRenderHomeData(),
    getRenderCatalogData(),
  ]);

  await writeFileAtomic(
    path.join(PRERENDER_DIR, 'home.html'),
    renderFile(shell, buildHomeView(homeData)),
  );
  await writeFileAtomic(
    path.join(PRERENDER_DIR, 'catalogo.html'),
    renderFile(shell, buildCatalogView(catalogData)),
  );
  let pages = 2;

  // ── Páginas de información (terminos, garantia, privacidad, materiales) ──
  for (const slug of Object.keys(INFO_PAGES)) {
    const view = buildInfoView(slug);
    if (!view) continue;
    await writeFileAtomic(
      path.join(PRERENDER_DIR, 'informacion', `${slug}.html`),
      renderFile(shell, view),
    );
    pages += 1;
  }

  // ── Una página por producto indexable + purga de retirados ──────────────
  const products = await getAllRenderProductDetails();
  const productDir = path.join(PRERENDER_DIR, 'producto');
  const keep = new Set<string>();
  for (const product of products) {
    keep.add(product.slug);
    await writeFileAtomic(
      path.join(productDir, `${product.slug}.html`),
      renderFile(shell, buildProductView(product)),
    );
  }
  const pruned = await pruneHtml(productDir, keep);

  // ── Sitemap (mismo host que las URLs) ───────────────────────────────────
  const entries = await getSitemapEntries();
  await writeFileAtomic(SITEMAP_PATH, buildSitemapXml(entries));

  return { pages, products: products.length, pruned };
};
