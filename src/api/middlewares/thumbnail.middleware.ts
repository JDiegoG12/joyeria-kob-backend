import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import { getUploadsSubfolderPath } from '../../config/paths.config';
import {
  THUMBNAIL_SUFFIX,
  subfolderHasThumbnail,
  generateThumbnailFromDisk,
} from '../../shared/utils/image.processor';

/**
 * Captura una petición de miniatura: `/<subfolder>/<base>-thumb.webp`.
 * `base` se restringe a un único segmento (`[^/]+`) para evitar path traversal;
 * los nombres reales son UUIDs planos.
 */
const THUMB_REQUEST = new RegExp(
  `^/([^/]+)/([^/]+)${THUMBNAIL_SUFFIX}\\.webp$`,
  'i',
);

/**
 * Middleware de **miniaturas bajo demanda**, montado antes de `express.static`
 * en `/uploads`.
 *
 * Cuando se solicita una miniatura (`uuid-thumb.webp`) que aún no existe en
 * disco — caso típico de imágenes subidas antes de que el procesador generara
 * miniaturas —, la genera a partir del archivo grande original y luego deja que
 * `express.static` la sirva (con sus cabeceras de caché). Las miniaturas de
 * imágenes nuevas ya existen, así que para ellas este middleware es un no-op.
 *
 * El original nunca se modifica: solo se crea un archivo `-thumb.webp` adicional.
 * Así los `srcset` del frontend funcionan para imágenes nuevas y antiguas sin
 * necesidad de un reproceso masivo.
 */
export const thumbnailOnDemand = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  if (req.method !== 'GET' && req.method !== 'HEAD') return next();

  const match = req.path.match(THUMB_REQUEST);
  if (!match) return next();

  const [, subfolder, baseName] = match;
  // Defensa extra contra traversal y subcarpetas no soportadas.
  if (baseName.includes('..') || !subfolderHasThumbnail(subfolder)) {
    return next();
  }

  const dir = getUploadsSubfolderPath(subfolder);
  const thumbPath = path.join(dir, `${baseName}${THUMBNAIL_SUFFIX}.webp`);

  // La miniatura ya existe → que la sirva express.static.
  if (fs.existsSync(thumbPath)) return next();

  const fullFilename = `${baseName}.webp`;
  const originalPath = path.join(dir, fullFilename);

  // No hay original del cual derivar → 404 lo maneja express.static.
  if (!fs.existsSync(originalPath)) return next();

  try {
    await generateThumbnailFromDisk(subfolder, fullFilename);
    return next();
  } catch {
    // Si la generación falla, servimos el original como respaldo para no dejar
    // la imagen rota en la tarjeta (solo pierde la optimización de tamaño).
    return res.sendFile(originalPath);
  }
};
