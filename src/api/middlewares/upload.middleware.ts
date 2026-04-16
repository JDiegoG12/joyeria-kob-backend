import multer from 'multer';

// Guardamos los archivos en memoria RAM para procesarlos con Sharp antes de guardarlos en el sistema de archivos
const storage = multer.memoryStorage();

export const uploadJewelImages = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Limitar el tamaño de cada imagen a 5MB
  fileFilter: (req, file, cb) => {
    // Aceptar solo archivos de imagen (jpg, jpeg, png)
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else
      cb(
        new Error('Solo se permiten archivos de imagen (jpg, jpeg, png, webp)'),
      );
  },
}).array('imageFiles', 5); // Esperamos un campo 'imageFiles' con hasta 5 archivos
