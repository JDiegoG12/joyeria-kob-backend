import multer from 'multer';

// Configuración de almacenamiento en memoria para procesar con Sharp
const storage = multer.memoryStorage();

/**
 * Filtro para aceptar solo archivos de imagen.
 */
const fileFilter = (
  req: Express.Request,
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
  limits: { fileSize: 10 * 1024 * 1024 }, // Límite de 10MB
});

/**
 * Middleware para subir múltiples imágenes de joyas (hasta 5).
 * El campo en el form-data debe llamarse `imageFiles`.
 */
export const uploadJewelImages = upload.array('imageFiles', 5);

/**
 * Middleware para subir una única imagen para el banner.
 * El campo en el form-data debe llamarse `imageFile`.
 */
export const uploadBannerImage = upload.single('imageFile');
