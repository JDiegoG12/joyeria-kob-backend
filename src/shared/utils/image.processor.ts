import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import { getUploadsSubfolderPath } from '../../config/paths.config';
import 'multer';

// --- Configuración de sharp para hosting compartido (CloudLinux) ---
// El servidor reporta los núcleos del host (no nuestra cuota real de ~1 núcleo), así que
// por defecto libvips crearía un pool de hilos = nº de CPUs del host (decenas). En
// CloudLinux cada hilo cuenta como un proceso ("Max Processes"), por lo que una sola
// subida de imagen del admin podría disparar el límite. Limitamos la concurrencia a 1
// hilo y desactivamos la caché de libvips para minimizar hilos/memoria por operación.
sharp.concurrency(1);
sharp.cache(false);

export type ImageSubfolder =
  | 'products'
  | 'banners'
  | 'social-content'
  | 'promo-banners';

/** Sufijo del archivo miniatura derivado (p. ej. `uuid-thumb.webp`). */
export const THUMBNAIL_SUFFIX = '-thumb';

/** Especificación de redimensionado para una variante de imagen. */
interface ResizeSpec {
  width: number;
  height: number;
  /**
   * `cover`: cubre el área y recorta (banners, social 9:16).
   * `inside`: encaja dentro del área sin recortar ni ampliar (productos).
   */
  fit: 'cover' | 'inside';
}

/** Resolución de la imagen "grande" (principal) por subcarpeta. */
const FULL_SPECS: Record<ImageSubfolder, ResizeSpec> = {
  banners: { width: 1920, height: 1080, fit: 'cover' },
  'promo-banners': { width: 1920, height: 1080, fit: 'cover' },
  'social-content': { width: 1080, height: 1920, fit: 'cover' },
  products: { width: 1000, height: 1000, fit: 'inside' },
};

/**
 * Resolución de la miniatura por subcarpeta. Solo las subcarpetas presentes
 * aquí generan miniatura; banners/promo-banners se muestran a tamaño completo
 * (ocupan todo el ancho) y no la necesitan.
 *
 * Las anchuras deben coincidir con los descriptores `w` del `srcset` del
 * frontend (`PRODUCT_IMAGE_WIDTHS` / `SOCIAL_IMAGE_WIDTHS`).
 */
const THUMBNAIL_SPECS: Partial<Record<ImageSubfolder, ResizeSpec>> = {
  products: { width: 400, height: 400, fit: 'inside' },
  'social-content': { width: 600, height: 1067, fit: 'cover' },
};

/** Indica si una subcarpeta genera (y por tanto puede servir) miniatura. */
export const subfolderHasThumbnail = (
  subfolder: string,
): subfolder is keyof typeof THUMBNAIL_SPECS =>
  Object.prototype.hasOwnProperty.call(THUMBNAIL_SPECS, subfolder);

/** Inserta el sufijo de miniatura antes de la extensión `.webp`. */
export const toThumbnailFilename = (filename: string): string =>
  filename.replace(/\.webp$/i, `${THUMBNAIL_SUFFIX}.webp`);

/** Aplica el redimensionado adecuado según el `fit` de la especificación. */
const applyResize = (
  pipeline: sharp.Sharp,
  spec: ResizeSpec,
): sharp.Sharp =>
  spec.fit === 'cover'
    ? pipeline.resize(spec.width, spec.height, {
        fit: 'cover',
        position: 'center',
      })
    : pipeline.resize(spec.width, spec.height, {
        fit: 'inside',
        withoutEnlargement: true,
      });

/**
 * Procesa una imagen, la optimiza en formato WebP y la guarda en el sistema de
 * archivos. La resolución de salida depende de la subcarpeta:
 * - `banners` / `promo-banners`: 1920x1080 (recortado para cubrir).
 * - `social-content`: 1080x1920 (recortado para cubrir, formato vertical 9:16).
 * - `products`: máximo 1000x1000 (contenido dentro).
 *
 * Para `products` y `social-content` además se genera una **miniatura** derivada
 * (`uuid-thumb.webp`) que el frontend usa vía `srcset` en tarjetas y carruseles,
 * evitando descargar la versión grande en contenedores pequeños.
 *
 * @param file Archivo de imagen a procesar (de Multer).
 * @param subfolder Subcarpeta de destino.
 * @returns El nombre del archivo grande optimizado (la miniatura se deriva con `toThumbnailFilename`).
 */
export const processAndSaveImage = async (
  file: Express.Multer.File,
  subfolder: ImageSubfolder = 'products',
): Promise<string> => {
  const uploadPath = getUploadsSubfolderPath(subfolder);

  // Asegurar que la carpeta de destino exista (si no, crearla)
  await fs.mkdir(uploadPath, { recursive: true });

  const filename = `${uuidv4()}.webp`; // Nombre único para la imagen optimizada
  const filePath = path.join(uploadPath, filename);

  // .rotate() sin argumentos auto-orienta según el tag EXIF Orientation y lo
  // limpia. Sin esto, sharp descarta el EXIF al re-codificar a WebP y los
  // píxeles quedan en la orientación cruda del sensor (imagen rotada).
  // Se decodifica una sola vez y se clona el pipeline por cada variante.
  const base = sharp(file.buffer).rotate();

  // --- Imagen grande (principal) ---
  await applyResize(base.clone(), FULL_SPECS[subfolder])
    .webp({ quality: 80 })
    .toFile(filePath);

  // --- Miniatura derivada (solo subcarpetas con srcset) ---
  const thumbSpec = THUMBNAIL_SPECS[subfolder];
  if (thumbSpec) {
    const thumbPath = path.join(uploadPath, toThumbnailFilename(filename));
    await applyResize(base.clone(), thumbSpec)
      .webp({ quality: 78 })
      .toFile(thumbPath);
  }

  // Devolver solo el nombre del archivo grande; la ruta completa (y la de la
  // miniatura) se reconstruyen en el frontend o al servir el archivo.
  return filename;
};

/**
 * Genera bajo demanda la miniatura de una imagen ya guardada, a partir del
 * archivo grande que existe en disco. Lo usa el middleware `thumbnailOnDemand`
 * para imágenes subidas antes de que existiera la generación de miniaturas, de
 * modo que los `srcset` del frontend funcionen tanto para imágenes nuevas como
 * antiguas sin reprocesar nada de forma masiva.
 *
 * No modifica el original: solo escribe un archivo `-thumb.webp` adicional.
 *
 * @param subfolder Subcarpeta de la imagen (debe soportar miniatura).
 * @param fullFilename Nombre del archivo grande (sin el sufijo `-thumb`).
 * @returns La ruta absoluta de la miniatura escrita, o `null` si la subcarpeta no usa miniatura.
 */
export const generateThumbnailFromDisk = async (
  subfolder: string,
  fullFilename: string,
): Promise<string | null> => {
  if (!subfolderHasThumbnail(subfolder)) return null;
  const spec = THUMBNAIL_SPECS[subfolder]!;

  const dir = getUploadsSubfolderPath(subfolder);
  const originalPath = path.join(dir, fullFilename);
  const thumbPath = path.join(dir, toThumbnailFilename(fullFilename));

  await applyResize(sharp(originalPath).rotate(), spec)
    .webp({ quality: 78 })
    .toFile(thumbPath);

  return thumbPath;
};
