import { prisma } from '../../../config/prisma';
import {
  IProductCreateRaw,
  ICreateProductDTO,
  IProductUpdateRaw,
  IUpdateProductDTO,
  ProductStatus,
} from '../models/product-types';
import { calculateSuggestedPrice } from '../../../shared/utils/price-calculator';
import { processAndSaveImage } from '../../../shared/utils/image.processor';
import fs from 'fs/promises';
import path from 'path';
/**
 * Obtiene el catálogo completo de productos.
 * @param isAdmin - Si es true, trae todos los productos incluyendo los ocultos; si es false, solo los disponibles.
 * @returns Un arreglo con todos los productos activos.
 */
//traer todos los estados disponibles, incluyendo los ocultos, para que el admin pueda verlos y editarlos
export const getAllProductsService = async (isAdmin: boolean = false) => {
  // Si es admin, no aplicamos el filtro (traemos todo). Si no es admin, filtramos solo los disponibles.
  const queryFilter = isAdmin ? {} : { status: 'AVAILABLE' as ProductStatus };

  return await prisma.product.findMany({
    where: queryFilter,
    include: { category: true }, // Prisma hace el JOIN automáticamente
    orderBy: { createdAt: 'desc' },
  });
};

/**
 * Obtiene un producto específico por su UUID.
 * @param id - Identificador único de la joya.
 * @returns El producto o null si no existe.
 */
export const getProductByIdService = async (id: string) => {
  return await prisma.product.findUnique({
    where: { id },
    include: { category: true },
  });
};

/**
 * Crea un nuevo producto calculando su precio dinámicamente.
 *
 * @param data - Datos de la joya provenientes del cliente.
 * @returns El producto recién creado en la base de datos.
 * @throws Error si no se encuentra la configuración del precio del oro.
 */
export const createProductService = async (
  data: IProductCreateRaw,
  files: Express.Multer.File[],
) => {
  // 1. Obtener el precio actual del oro desde la base de datos (Fail-Fast)
  const systemSettings = await prisma.systemSetting.findUnique({
    where: { id: 1 },
  });

  if (!systemSettings) {
    throw {
      status: 500,
      code: 'SETTINGS_NOT_FOUND',
      message: 'No se encontró el precio global del oro configurado.',
    };
  }

  // 2. Transformación y Limpieza
  const validatedData: ICreateProductDTO = {
    categoryId: Number(data.categoryId),
    name: data.name,
    description: data.description,
    baseWeight: Number(data.baseWeight),
    additionalValue: Number(data.additionalValue),
    stock: Number(data.stock),
    specifications: JSON.parse(data.specifications), // Convertimos texto a objeto
    images: [], // Se llenará con imageNames
  };

  // 3. Procesar imágenes (Solo procedemos a guardar si hay garantías de que no fallará la BD por configuraciones)
  const imageNames = await Promise.all(
    files.map((file) => processAndSaveImage(file)),
  );

  // 4. Calcular el precio sugerido
  // Usamos .toNumber() porque Prisma devuelve tipos Decimal seguros
  const calculatedPrice = calculateSuggestedPrice(
    validatedData.baseWeight,
    systemSettings.goldPricePerGram.toNumber(),
    validatedData.additionalValue,
  );
  // Lógica inteligente de estado según el stock
  const initialStatus = validatedData.stock > 0 ? 'AVAILABLE' : 'OUT_OF_STOCK';

  // 3. Guardar en la base de datos con Prisma
  const newProduct = await prisma.product.create({
    data: {
      categoryId: validatedData.categoryId,
      name: validatedData.name,
      description: validatedData.description,
      baseWeight: validatedData.baseWeight,
      additionalValue: validatedData.additionalValue,
      stock: validatedData.stock,
      status: initialStatus,
      calculatedPrice: calculatedPrice,
      specifications: validatedData.specifications as object,
      images: imageNames, // Guardamos ["uuid1.webp", "uuid2.webp"]
    },
  });

  return newProduct;
};

/**
 * Elimina un producto por su ID.
 * @param id - Identificador del producto a eliminar.
 * @returns True si se eliminó, arroja error si no existe.
 */
export const deleteProductService = async (id: string) => {
  // 1. Obtener el producto para saber qué imágenes borrar físicamente (Evita archivos "huérfanos")
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) {
    throw {
      status: 404,
      code: 'PRODUCT_NOT_FOUND',
      message: 'El producto a eliminar no existe.',
    };
  }

  // 2. Eliminar imágenes del disco duro/servidor
  const images = product.images as string[];
  for (const imgName of images) {
    const oldPath = path.join(
      process.cwd(),
      'public/uploads/products',
      imgName,
    );
    await fs
      .unlink(oldPath)
      .catch(() => console.warn(`[Warning] No se pudo borrar ${imgName}`));
  }

  // 3. Eliminar registro de la BD
  await prisma.product.delete({
    where: { id },
  });
  return true;
};

/**
 * Actualiza una joya existente en la base de datos.
 * Aplica limpieza de datos crudos, gestión de archivos en el disco y recálculo automático de precio.
 *
 * @param id - UUID del producto a actualizar.
 * @param rawData - Datos en bruto (strings) provenientes del formulario multipart.
 * @param files - Archivos opcionales de imagen subidos mediante Multer.
 * @returns El producto actualizado.
 * @throws Error 404 si la joya no existe en el catálogo.
 */
export const updateProductService = async (
  id: string,
  rawData: IProductUpdateRaw,
  files?: Express.Multer.File[],
) => {
  // 1. Verificar que el producto exista
  const currentProduct = await prisma.product.findUnique({
    where: { id },
  });
  if (!currentProduct) {
    throw {
      status: 404,
      code: 'PRODUCT_NOT_FOUND',
      message: 'La joya solicitada no existe.',
    };
  }

  // 2. Transformar y limpiar los datos de entrada (De Raw a DTO Limpio)
  // TypeScript nos obliga a tratar cada campo de rawData como 'string | undefined'
  const cleanData: IUpdateProductDTO = {
    name: rawData.name,
    description: rawData.description,
    categoryId: rawData.categoryId ? Number(rawData.categoryId) : undefined,
    baseWeight: rawData.baseWeight ? Number(rawData.baseWeight) : undefined,
    additionalValue: rawData.additionalValue
      ? Number(rawData.additionalValue)
      : undefined,
    stock: rawData.stock ? Number(rawData.stock) : undefined,
    specifications: rawData.specifications
      ? JSON.parse(rawData.specifications)
      : undefined,
    status: rawData.status as ProductStatus | undefined,
  };

  // 3. Gestión Física de imagenes en Hostinger
  let finalImages = currentProduct.images as string[]; // Empezamos con las imágenes actuales

  if (files && files.length > 0) {
    // Si hay nuevas fotos, intentamos borrar las viejas para no saturar el disco
    for (const imgName of finalImages) {
      const oldPath = path.join(
        process.cwd(),
        'public/uploads/products',
        imgName,
      );
      // Usamos .catch() para que si un archivo no existe, no rompa la actualización
      await fs
        .unlink(oldPath)
        .catch(() => console.warn(`[Warning] No se pudo borrar ${imgName}`));
    }
    // Procesamos y guardamos las nuevas fotos
    finalImages = await Promise.all(
      files.map((file) => processAndSaveImage(file)),
    );
  }

  // 4. Logica del Recálculo de precio: Si se actualiza el peso, valor adicional o costo de mano de obra, recalculamos el precio sugerido
  const settings = await prisma.systemSetting.findUnique({
    where: { id: 1 },
  });
  const goldPrice = settings?.goldPricePerGram.toNumber() || 350000;

  // Usamos '??' (Nullish coalescing): si cleanData no trae el campo, usamos el de la BD
  const weight = cleanData.baseWeight ?? currentProduct.baseWeight.toNumber();
  const additional =
    cleanData.additionalValue ?? currentProduct.additionalValue.toNumber();

  const newCalculatedPrice = calculateSuggestedPrice(
    weight,
    goldPrice,
    additional,
  );

  // 5. Lógica de Estado Automática e Inteligente
  const finalStock = cleanData.stock ?? currentProduct.stock;
  let finalStatus =
    cleanData.status ?? (currentProduct.status as ProductStatus);

  // Reglas de negocio para el estado:
  if (finalStock <= 0 && finalStatus !== 'HIDDEN') {
    finalStatus = 'OUT_OF_STOCK'; // Fuerza agotado si no hay stock
  } else if (finalStock > 0 && finalStatus === 'OUT_OF_STOCK') {
    finalStatus = 'AVAILABLE'; // Fuerza disponible si se repuso el stock
  }

  // 6. Actualización en la Base de Datos
  const updatedProduct = await prisma.product.update({
    where: { id },
    data: {
      ...cleanData,
      status: finalStatus,
      calculatedPrice: newCalculatedPrice,
      images: finalImages,
      // Prisma requiere que el objeto JSON sea un Input Json válido
      specifications: cleanData.specifications
        ? (cleanData.specifications as object)
        : undefined,
    },
  });

  return updatedProduct;
};
