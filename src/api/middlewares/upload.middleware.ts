import multer from 'multer';
import { Request, Response, NextFunction } from 'express';

// Configuración de almacenamiento en memoria para procesar con Sharp
const storage = multer.memoryStorage();

/**
 * Filtro para aceptar solo archivos de imagen.
 */
const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    // Se usa `as any` como workaround para una posible inconsistencia en los tipos de Multer.
    // La documentación sugiere que se puede pasar un error, pero el tipado estricto
    // a veces causa conflictos de compilación. `as any` resuelve este problema.
    cb(
      new Error(
        '¡No es una imagen! Por favor, sube solo archivos de imagen.',
      ) as any,
      false,
    );
  }
};

const upload = multer({
  storage,
  fileFilter,
  //limits: { fileSize: 10 * 1024 * 1024 }, // Límite de 10MB
});

/**
 * Middleware para subir múltiples imágenes de joyas (hasta 5).
 * El campo en el form-data debe llamarse `imageFiles`.
 */
export const uploadJewelImages = upload.array('imageFiles', 5);

/**
 * Middleware para subir una única imagen para el contenido social.
 * El campo en el form-data debe llamarse `image`.
 */
export const uploadSocialContentImage = upload.single('image');

/**
 * Middleware para subir una única imagen para el banner.
 * El campo en el form-data debe llamarse `imageFile`. Es opcional.
 *
 * **Nota de implementación:**
 * Se utiliza `upload.any()` en lugar de `upload.single()` para evitar un problema
 * conocido en el que `multer` puede colgar la petición si un cliente (como Swagger UI)
 * envía un campo de archivo con un valor explícitamente vacío.
 *
 * Esta implementación es más robusta:
 * 1. Procesa todos los archivos y campos sin colgarse.
 * 2. Busca manualmente el archivo con el `fieldname` 'imageFile'.
 * 3. Si lo encuentra, lo asigna a `req.file` para mantener la compatibilidad con el resto de la aplicación.
 * 4. Si no se envía ningún archivo, simplemente continúa al siguiente middleware.
 */
export const uploadBannerImage = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  upload.any()(req, res, (err) => {
    if (err) {
      return next(err);
    }
    if (req.files && Array.isArray(req.files)) {
      req.file = (req.files as Express.Multer.File[]).find(
        (file) => file.fieldname === 'imageFile',
      );
    }
    next();
  });
};
