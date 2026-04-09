import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import 'multer';

//Carpeta donde Hostinger guardará las fotos fisicamente
const UPLOAD_PATH = path.join(process.cwd(), 'public/uploads/products');

/**
 * Procesa una imagen, la optimiza en formato WebP y la guarda en el sistema de archivos.
 * @param file Archivo de imagen a procesar (de Multer)
 * @return nombre del archivo optimizado guardado
 */
export const processAndSaveImage = async (
  file: Express.Multer.File,
): Promise<string> => {
  //Asegurar que la carpeta exista (si no, crearla)
  await fs.mkdir(UPLOAD_PATH, { recursive: true });
  //
  const filename = `${uuidv4()}.webp`; // Generar un nombre único para la imagen optimizada (Alta calidad bajo peso)
  const filePath = path.join(UPLOAD_PATH, filename); // Ruta completa donde se guardará la imagen optimizada

  // Procesar la imagen con Sharp: convertir a WebP y optimizar
  await sharp(file.buffer)
    .resize(1000, 1000, { fit: 'inside', withoutEnlargement: true }) // Redimensionar para que no exceda 1000x1000 (manteniendo proporciones)
    .webp({ quality: 80 }) // Convertir a WebP con calidad del 80% (balance entre calidad y peso)
    .toFile(filePath); // Guardar la imagen optimizada en el sistema de archivos

  return filename; // Retornar el nombre del archivo optimizado para guardarlo en la base de datos
};
