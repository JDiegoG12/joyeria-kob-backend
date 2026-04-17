import { prisma } from '../../../config/prisma';
import { Prisma } from '@prisma/client';
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

const UPLOAD_DIR = path.join(process.cwd(), 'public/uploads/products');

/**
 * Recupera el catálogo de productos aplicando filtrado por nivel de acceso.
 *
 * @param isAdmin - Determina si se exponen los productos ocultos o inactivos.
 * @param categoryId - Opcionalmente filtra por categoría específica. Si es padre, incluye los productos de sus subcategorías.
 * @returns Colección de productos disponibles vinculados a su categoría.
 */
export const getAllProductsService = async (
  isAdmin: boolean = false,
  categoryId?: number,
) => {
  let targetCategoryIds: number[] | undefined = undefined;

  if (categoryId) {
    const categoryTree = await prisma.category.findUnique({
      where: { id: categoryId },
      include: { children: true },
    });

    if (categoryTree) {
      targetCategoryIds = [
        categoryTree.id,
        ...categoryTree.children.map((child) => child.id),
      ];
    } else {
      return []; // Si la categoría no existe, retornamos un array vacío
    }
  }

  const queryFilter: Prisma.ProductWhereInput = isAdmin
    ? {}
    : { status: 'AVAILABLE' as ProductStatus };
  if (targetCategoryIds) {
    queryFilter.categoryId = { in: targetCategoryIds }; // Filtra por el padre Y los hijos
  }
  return await prisma.product.findMany({
    where: queryFilter,
    include: {
      category: {
        include: { parent: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
};

/**
 * Obtiene los detalles de un producto específico mediante su identificador.
 *
 * @param id - Identificador único universal (UUID) del producto.
 * @returns El producto encontrado junto a su información de categoría, o null si no existe.
 */
export const getProductByIdService = async (id: string) => {
  return await prisma.product.findUnique({
    where: { id },
    include: {
      category: {
        include: { parent: true },
      },
    },
  });
};

/**
 * Registra un nuevo producto en el catálogo.
 * Transforma los datos de entrada, procesa las imágenes subidas y calcula dinámicamente el precio sugerido
 * empleando la configuración global del sistema (precio del oro).
 *
 * @param data - Carga útil serializada con los datos de creación de la joya.
 * @param files - Colección de archivos de imagen provenientes de la petición (Multer).
 * @returns La entidad del producto recién registrado en la persistencia.
 * @throws Excepción si no se encuentra definido el factor global de tasación.
 */
export const createProductService = async (
  data: IProductCreateRaw,
  files: Express.Multer.File[],
) => {
  const systemSettings = await prisma.systemSetting.findUnique({
    where: { id: 1 },
  });

  if (!systemSettings) {
    throw {
      code: 'SETTINGS_NOT_FOUND',
      message: 'No se encontró la configuración base del precio de oro.',
    };
  }

  const validatedData: ICreateProductDTO = {
    categoryId: Number(data.categoryId),
    name: data.name,
    description: data.description,
    baseWeight: Number(data.baseWeight),
    additionalValue: Number(data.additionalValue),
    stock: Number(data.stock),
    specifications: JSON.parse(data.specifications),
    images: [],
  };

  const imageNames = await Promise.all(
    files.map((file) => processAndSaveImage(file)),
  );

  const calculatedPrice = calculateSuggestedPrice(
    validatedData.baseWeight,
    systemSettings.goldPricePerGram.toNumber(),
    validatedData.additionalValue,
  );

  const initialStatus = validatedData.stock > 0 ? 'AVAILABLE' : 'OUT_OF_STOCK';

  return await prisma.product.create({
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
      images: imageNames,
    },
  });
};

/**
 * Elimina lógicamente un producto del sistema y sus activos vinculados en el almacenamiento físico.
 *
 * @param id - Identificador único de la entidad (UUID).
 * @returns Boolean confirmando la eliminación.
 * @throws Excepción HTTP (404) si el identificador no existe.
 */
export const deleteProductService = async (id: string) => {
  const product = await prisma.product.findUnique({ where: { id } });

  if (!product) {
    throw {
      code: 'PRODUCT_NOT_FOUND',
      message: 'El producto a eliminar no existe.',
    };
  }

  const images = product.images as string[];

  for (const imgName of images) {
    const oldPath = path.join(UPLOAD_DIR, imgName);
    await fs
      .unlink(oldPath)
      .catch((err) =>
        console.warn(
          `[Image Delete Warning] Falló eliminación de ${imgName}:`,
          err.message,
        ),
      );
  }

  await prisma.product.delete({ where: { id } });

  return true;
};

/**
 * Refactoriza y actualiza la información paramétrica y el estado de un producto.
 * Orquesta actualizaciones aditivas/sustractivas de adjuntos visuales e invoca
 * recálculos automáticos del precio en función de los costos de metales preciosos si procede.
 *
 * @param id - Identificador de la joya en la base de datos (UUID).
 * @param rawData - Estructura de recolección de formulario multiparte en bruto.
 * @param files - Listado opcional de archivos de imagen recientes capturados por Middleware.
 * @returns El estado reconstruido de la entidad producto actualizada.
 * @throws Excepción si se incumple alguna regla de negocio estricta del dominio (ej. tope de imágenes).
 */
export const updateProductService = async (
  id: string,
  rawData: IProductUpdateRaw,
  files?: Express.Multer.File[],
) => {
  const currentProduct = await prisma.product.findUnique({ where: { id } });

  if (!currentProduct) {
    throw {
      code: 'PRODUCT_NOT_FOUND',
      message: 'La joya o variación solicitada no fue hallada en el sistema.',
    };
  }

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

  let finalImages = currentProduct.images as string[];

  if (rawData.imagesToDelete) {
    const imagesToDelete: string[] = JSON.parse(rawData.imagesToDelete);

    if (imagesToDelete.length > 0) {
      for (const imgName of imagesToDelete) {
        // Solo intentamos borrar si la imagen realmente pertenecía a este producto
        if (finalImages.includes(imgName)) {
          const targetPath = path.join(UPLOAD_DIR, imgName);
          await fs
            .unlink(targetPath)
            .catch((err) =>
              console.warn(
                `[Image Delete Sys Warning] Omitiendo fallido ${imgName}:`,
                err.message,
              ),
            );
        }
      }
      finalImages = finalImages.filter((img) => !imagesToDelete.includes(img));
    }
  }

  if (files && files.length > 0) {
    const newImageNames = await Promise.all(
      files.map((file) => processAndSaveImage(file)),
    );
    finalImages = [...finalImages, ...newImageNames];
  }

  if (finalImages.length > 5) {
    throw {
      code: 'BUSINESS_CONSTRAINT_FAILED',
      message: `Cuota de capacidad gráfica superada. Límite: 5 imágenes permitidas por variante. Valor actual calculado: ${finalImages.length}.`,
    };
  }

  const settings = await prisma.systemSetting.findUnique({ where: { id: 1 } });
  const baseGoldValuation = settings?.goldPricePerGram.toNumber() || 350000;

  const operativeWeight =
    cleanData.baseWeight ?? currentProduct.baseWeight.toNumber();
  const operativeValueAdded =
    cleanData.additionalValue ?? currentProduct.additionalValue.toNumber();

  const recalibratedPricing = calculateSuggestedPrice(
    operativeWeight,
    baseGoldValuation,
    operativeValueAdded,
  );

  const referenceStock = cleanData.stock ?? currentProduct.stock;
  let reactiveStatus =
    cleanData.status ?? (currentProduct.status as ProductStatus);

  if (referenceStock <= 0 && reactiveStatus !== 'HIDDEN') {
    reactiveStatus = 'OUT_OF_STOCK';
  } else if (referenceStock > 0 && reactiveStatus === 'OUT_OF_STOCK') {
    reactiveStatus = 'AVAILABLE';
  }

  return await prisma.product.update({
    where: { id },
    data: {
      ...cleanData,
      status: reactiveStatus,
      calculatedPrice: recalibratedPricing,
      images: finalImages,
      specifications: cleanData.specifications as object | undefined,
    },
  });
};
