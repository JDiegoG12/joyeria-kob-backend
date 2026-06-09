import path from 'path';

/**
 * El directorio base para las subidas de archivos.
 * 1. Intenta leer la variable de entorno `UPLOADS_DIR`.
 * 2. Si no está definida, usa `public/uploads` dentro del directorio del proyecto como
 *    valor por defecto. Esto mantiene el comportamiento para el desarrollo local.
 */
const UPLOADS_DIR_BASE =
  process.env.UPLOADS_DIR || path.join(process.cwd(), 'public', 'uploads');

/**
 * La ruta absoluta y resuelta al directorio de uploads.
 * Usar `path.resolve` garantiza que la ruta sea siempre absoluta, evitando problemas.
 */
export const UPLOADS_PATH = path.resolve(UPLOADS_DIR_BASE);

/** Obtiene la ruta absoluta a una subcarpeta específica dentro del directorio de uploads. */
export const getUploadsSubfolderPath = (subfolder: string): string =>
  path.join(UPLOADS_PATH, subfolder);
