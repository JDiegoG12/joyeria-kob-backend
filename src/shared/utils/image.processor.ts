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

/**
 * Procesa una imagen, la optimiza en formato WebP y la guarda en el sistema de archivos.
 * La resolución de salida depende de la subcarpeta:
 * - `banners` / `promo-banners`: 1920x1080 (recortado para cubrir).
 * - `social-content`: 1080x1920 (recortado para cubrir, formato vertical 9:16).
 * - `products`: Máximo 1000x1000 (contenido dentro).
 *
 * @param file Archivo de imagen a procesar (de Multer).
 * @param subfolder Subcarpeta de destino ('products', 'banners', 'promo-banners' o 'social-content').
 * @returns El nombre del archivo optimizado guardado.
 */
export const processAndSaveImage = async (
  file: Express.Multer.File,
  subfolder: 'products' | 'banners' | 'social-content' | 'promo-banners' = 'products',
): Promise<string> => {
  const uploadPath = getUploadsSubfolderPath(subfolder);

  // Asegurar que la carpeta de destino exista (si no, crearla)
  await fs.mkdir(uploadPath, { recursive: true });

  const filename = `${uuidv4()}.webp`; // Generar un nombre único para la imagen optimizada (Alta calidad bajo peso)
  const filePath = path.join(uploadPath, filename); // Ruta completa donde se guardará la imagen optimizada

  // .rotate() sin argumentos auto-orienta según el tag EXIF Orientation y lo
  // limpia. Sin esto, sharp descarta el EXIF al re-codificar a WebP y los
  // píxeles quedan en la orientación cruda del sensor (imagen rotada).
  let imageProcessor = sharp(file.buffer).rotate();

  if (subfolder === 'banners' || subfolder === 'promo-banners') {
    // Para banners (principal y de promoción del carrusel), redimensionar a
    // 1920x1080, cubriendo el área y recortando si es necesario.
    imageProcessor = imageProcessor.resize(1920, 1080, {
      fit: 'cover', // Cubre el área, puede recortar.
      position: 'center', // Centra la imagen antes de recortar.
    });
  } else if (subfolder === 'social-content') {
    // Para contenido social, redimensionar a 1080x1920 (formato vertical 9:16).
    imageProcessor = imageProcessor.resize(1080, 1920, {
      fit: 'cover',
      position: 'center',
    });
  } else {
    // Para productos, mantener el tamaño máximo de 1000x1000.
    imageProcessor = imageProcessor.resize(1000, 1000, {
      fit: 'inside',
      withoutEnlargement: true,
    });
  }

  // Convertir a formato WebP con una calidad del 80% y guardar en la ruta especificada.
  await imageProcessor.webp({ quality: 80 }).toFile(filePath);

  // Devolver solo el nombre del archivo, ya que la ruta completa se reconstruye
  // en el frontend o al servir el archivo.
  return filename;
}