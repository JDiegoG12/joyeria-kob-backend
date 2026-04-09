import { prisma } from '../../../config/prisma';
import { IProductRawInput } from '../models/product-types';
import { ICreateProductDTO } from '../models/product-types';
import { calculateSuggestedPrice } from '../../../shared/utils/price-calculator';
import { processAndSaveImage } from '../../../shared/utils/image.processor';
/**
 * Obtiene el catálogo completo de productos disponibles.
 * @returns Un arreglo con todos los productos activos.
 */
export const getAllProductsService = async () => {
  return await prisma.product.findMany({
    where: { status: 'AVAILABLE' },
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
  data: IProductRawInput,
  files: Express.Multer.File[],
) => {
  // 1. Transformación y Limpieza
  const validatedData: ICreateProductDTO = {
    categoryId: Number(data.categoryId),
    name: data.name,
    description: data.description,
    baseWeight: Number(data.baseWeight),
    additionalValue: Number(data.additionalValue),
    laborCost: Number(data.laborCost),
    stock: Number(data.stock),
    specifications: JSON.parse(data.specifications), // Convertimos texto a objeto
    images: [], // Se llenará con imageNames
  };

  // 2. Procesar imágenes
  const imageNames = await Promise.all(
    files.map((file) => processAndSaveImage(file)),
  );

  // 3. Obtener el precio actual del oro desde la base de datos (SystemSetting)
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

  // 4. Calcular el precio sugerido
  // Usamos .toNumber() porque Prisma devuelve tipos Decimal seguros
  const calculatedPrice = calculateSuggestedPrice(
    validatedData.baseWeight,
    systemSettings.goldPricePerGram.toNumber(),
    validatedData.laborCost,
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
      laborCost: validatedData.laborCost,
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
  // Prisma lanzará un error automático si el ID no existe (RecordNotFound)
  await prisma.product.delete({
    where: { id },
  });
  return true;
};
