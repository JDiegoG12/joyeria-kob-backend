import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import 'multer';

// Carpeta base donde se guardarán los archivos subidos.
const BASE_UPLOAD_PATH = path.join(process.cwd(), 'public/uploads');

/**
 * Procesa una imagen, la optimiza en formato WebP y la guarda en el sistema de archivos.
 * La resolución de salida depende de la subcarpeta:
 * - `banners`: 1920x1080 (recortado para cubrir).
 * - `social-content`: 1080x1920 (recortado para cubrir, formato vertical 9:16).
 * - `products`: Máximo 1000x1000 (contenido dentro).
 *
 * @param file Archivo de imagen a procesar (de Multer).
 * @param subfolder Subcarpeta de destino ('products', 'banners' o 'social-content').
 * @returns El nombre del archivo optimizado guardado.
 */
export const processAndSaveImage = async (
  file: Express.Multer.File,
  subfolder: 'products' | 'banners' | 'social-content' = 'products',
): Promise<string> => {
  const uploadPath = path.join(BASE_UPLOAD_PATH, subfolder);

  // Asegurar que la carpeta de destino exista (si no, crearla)
  await fs.mkdir(uploadPath, { recursive: true });

  const filename = `${uuidv4()}.webp`; // Generar un nombre único para la imagen optimizada (Alta calidad bajo peso)
  const filePath = path.join(uploadPath, filename); // Ruta completa donde se guardará la imagen optimizada

  let imageProcessor = sharp(file.buffer);

  if (subfolder === 'banners') {
    // Para banners, redimensionar a 1920x1080, cubriendo el área y recortando si es necesario.
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

  // Aplicar conversión a WebP y guardar el archivo
  await imageProcessor
    .webp({ quality: 80 }) // Convertir a WebP con calidad del 80% (balance entre calidad y peso)
    .toFile(filePath); // Guardar la imagen optimizada en el sistema de archivos

  return filename; // Retornar el nombre del archivo optimizado para guardarlo en la base de datos
};
