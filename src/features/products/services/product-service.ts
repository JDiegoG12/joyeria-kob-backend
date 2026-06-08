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

export type CatalogQueryParams = {
  categoryId?: number;
  minPrice?: number;
  maxPrice?: number;
  /**
   * Término de búsqueda por nombre de producto.
   * La comparación es insensible a mayúsculas/minúsculas y busca coincidencias
   * parciales en cualquier posición del nombre (dependiendo de la collation MySQL).
   * Si es una cadena vacía o undefined, no se aplica ningún filtro de nombre.
   *
   * @example 'anillo'   → encuentra "Anillo Solitario", "Anillo Zafiro Real", etc.
   * @example 'PULS'     → encuentra "Pulsera Oro", "Pulsera Esmeralda", etc.
   */
  search?: string;
  page?: number;
  limit?: number;
};

/**
 * Recupera el catálogo de productos aplicando filtrado por nivel de acceso.
 *
 * @param isAdmin    - Determina si se exponen los productos ocultos o inactivos.
 * @param categoryId - Opcionalmente filtra por categoría específica.
 *                     Si es categoría padre, incluye también los productos de
 *                     sus subcategorías directas (un nivel de profundidad).
 * @param search     - Término opcional de búsqueda por nombre (insensible a
 *                     mayúsculas, coincidencia parcial).
 * @returns Colección de productos disponibles vinculados a su categoría,
 *          cada uno con el precio calculado (`calculatedPrice`).
 */
export const getAllProductsService = async (
  isAdmin: boolean = false,
  categoryId?: number,
  search?: string,
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
    queryFilter.categoryId = { in: targetCategoryIds };
  }

  // ── Filtro de búsqueda por nombre ──────────────────────────────────────────
  // Se aplica solo si `search` es una cadena con al menos un carácter no vacío.
  // La insensibilidad a mayúsculas/minúsculas depende de la collation MySQL.
  const trimmedSearch = search?.trim();
  if (trimmedSearch) {
    queryFilter.name = {
      contains: trimmedSearch,
    };
  }

  const products = await prisma.product.findMany({
    where: queryFilter,
    include: { category: { include: { parent: true } } },
    orderBy: { createdAt: 'desc' },
  });

  const settings = await prisma.systemSetting.findUnique({ where: { id: 1 } });
  const goldPrice = settings?.goldPricePerGram.toNumber() || 350000;

  return products.map((product) => {
    const calculatedPrice = calculateSuggestedPrice(
      product.baseWeight.toNumber(),
      goldPrice,
      product.additionalValue.toNumber(),
    );
    const discountValue = product.discountValue.toNumber();
    return {
      ...product,
      calculatedPrice,
      discountValue,
      // Precio con descuento aplicado. Se limita a 0 para que nunca sea
      // negativo si el precio del oro bajó y el descuento supera el precio.
      finalPrice: Math.max(calculatedPrice - discountValue, 0),
    };
  });
};

/**
 * Recupera el catálogo público con filtros por categoría, precio, nombre y paginación.
 *
 * ## Comportamiento del priceRange
 * El campo `priceRange` de la respuesta refleja el rango REAL de la categoría
 * activa (ignorando los filtros de precio y búsqueda), para que el slider del
 * frontend siempre muestre el rango completo disponible en esa categoría.
 *
 * ## Orden de operaciones
 * 1. `getAllProductsService` consulta la DB aplicando filtros de categoría,
 *    acceso público y, si viene, la búsqueda por nombre.
 * 2. Se calculan `priceRangeMin` y `priceRangeMax` sobre esos resultados
 *    (antes de aplicar el filtro de precio) para alimentar el slider.
 * 3. Se filtra por `minPrice` / `maxPrice` si están presentes.
 * 4. Se pagina el resultado filtrado.
 *
 * @param params - Parámetros de filtrado y paginación.
 * @returns Página de productos, metadata de paginación y rango real de precios.
 * @throws `{ code: 'VALIDATION_ERROR' }` si minPrice > maxPrice.
 */
export const getCatalogProductsService = async (params: CatalogQueryParams) => {
  const { categoryId, minPrice, maxPrice, search, page, limit } = params;
  const safePage = Math.max(1, Math.floor(page ?? 1));
  const safeLimit = Math.min(Math.max(1, Math.floor(limit ?? 12)), 48);

  if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) {
    throw {
      code: 'VALIDATION_ERROR',
      status: 400,
      message: 'minPrice no puede ser mayor que maxPrice.',
    };
  }

  // Pasamos `search` a getAllProductsService para que el filtro de nombre
  // se aplique directamente en la consulta SQL, no en memoria.
  const baseProducts = await getAllProductsService(false, categoryId, search);

  // ── Rango de precios ────────────────────────────────────────────────────────
  // Se calcula ANTES del filtro de precio para reflejar el rango real de la
  // categoría/búsqueda activa, independientemente del rango seleccionado.
  let priceRangeMin = 0;
  let priceRangeMax = 0;
  if (baseProducts.length > 0) {
    priceRangeMin = baseProducts.reduce(
      (min, product) => Math.min(min, product.calculatedPrice),
      baseProducts[0].calculatedPrice,
    );
    priceRangeMax = baseProducts.reduce(
      (max, product) => Math.max(max, product.calculatedPrice),
      baseProducts[0].calculatedPrice,
    );
  }

  // ── Filtro de precio ────────────────────────────────────────────────────────
  // El precio calculado no está en la DB, por lo que este filtro se aplica
  // en memoria después de obtener los productos de Prisma.
  const filtered = baseProducts.filter((product) => {
    if (minPrice !== undefined && product.calculatedPrice < minPrice) {
      return false;
    }
    if (maxPrice !== undefined && product.calculatedPrice > maxPrice) {
      return false;
    }
    return true;
  });

  const total = filtered.length;
  const totalPages = total === 0 ? 0 : Math.ceil(total / safeLimit);
  const startIndex = (safePage - 1) * safeLimit;
  const products = filtered.slice(startIndex, startIndex + safeLimit);

  return {
    products,
    pagination: {
      total,
      page: safePage,
      limit: safeLimit,
      totalPages,
      hasNextPage: totalPages > 0 && safePage < totalPages,
      hasPrevPage: totalPages > 0 && safePage > 1,
    },
    priceRange: {
      min: priceRangeMin,
      max: priceRangeMax,
    },
  };
};

/**
 * Obtiene los detalles de un producto específico mediante su identificador.
 *
 * @param id - Identificador único universal (UUID) del producto.
 * @returns El producto encontrado junto a su información de categoría, o null si no existe.
 */
export const getProductByIdService = async (id: string) => {
  const product = await prisma.product.findUnique({
    where: { id },
    include: { category: { include: { parent: true } } },
  });

  if (!product) return null;

  const settings = await prisma.systemSetting.findUnique({ where: { id: 1 } });
  const goldPrice = settings?.goldPricePerGram.toNumber() || 350000;

  const calculatedPrice = calculateSuggestedPrice(
    product.baseWeight.toNumber(),
    goldPrice,
    product.additionalValue.toNumber(),
  );
  const discountValue = product.discountValue.toNumber();

  return {
    ...product,
    calculatedPrice,
    discountValue,
    finalPrice: Math.max(calculatedPrice - discountValue, 0),
  };
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

  const newProduct = await prisma.product.create({
    data: {
      categoryId: validatedData.categoryId,
      name: validatedData.name,
      description: validatedData.description,
      baseWeight: validatedData.baseWeight,
      additionalValue: validatedData.additionalValue,
      stock: validatedData.stock,
      status: initialStatus,
      specifications: validatedData.specifications as object,
      images: imageNames,
    },
  });

  return {
    ...newProduct,
    calculatedPrice,
    discountValue: newProduct.discountValue.toNumber(),
    finalPrice: calculatedPrice, // Recién creado, sin descuento.
  };
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
    // El descuento llega como string desde el FormData. Se acepta '0' (quitar
    // descuento). Solo es `undefined` cuando el campo no viene en la petición.
    discountValue:
      rawData.discountValue !== undefined && rawData.discountValue !== ''
        ? Number(rawData.discountValue)
        : undefined,
  };

  let finalImages = currentProduct.images as string[];

  if (rawData.imagesToDelete) {
    const imagesToDelete: string[] = JSON.parse(rawData.imagesToDelete);

    if (imagesToDelete.length > 0) {
      for (const imgName of imagesToDelete) {
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

  // ── Validación del descuento ────────────────────────────────────────────────
  // El descuento (COP) no puede superar el precio actual del producto. Se valida
  // contra el precio recalculado para reflejar el valor real en el momento del
  // guardado. Se permite 0 (quitar descuento) y valores negativos se rechazan.
  if (cleanData.discountValue !== undefined) {
    if (
      !Number.isFinite(cleanData.discountValue) ||
      cleanData.discountValue < 0
    ) {
      throw {
        code: 'BUSINESS_CONSTRAINT_FAILED',
        message: 'El descuento debe ser un valor en COP mayor o igual a 0.',
      };
    }
    if (cleanData.discountValue > recalibratedPricing) {
      throw {
        code: 'BUSINESS_CONSTRAINT_FAILED',
        message:
          'El descuento no puede superar el precio actual del producto.',
      };
    }
  }

  const referenceStock = cleanData.stock ?? currentProduct.stock;
  let reactiveStatus =
    cleanData.status ?? (currentProduct.status as ProductStatus);

  if (referenceStock <= 0 && reactiveStatus !== 'HIDDEN') {
    reactiveStatus = 'OUT_OF_STOCK';
  } else if (referenceStock > 0 && reactiveStatus === 'OUT_OF_STOCK') {
    reactiveStatus = 'AVAILABLE';
  }

  const updatedProduct = await prisma.product.update({
    where: { id },
    data: {
      ...cleanData,
      status: reactiveStatus,
      images: finalImages,
      specifications: cleanData.specifications as object | undefined,
    },
  });

  const finalDiscount = updatedProduct.discountValue.toNumber();

  return {
    ...updatedProduct,
    calculatedPrice: recalibratedPricing,
    discountValue: finalDiscount,
    finalPrice: Math.max(recalibratedPricing - finalDiscount, 0),
  };
};
