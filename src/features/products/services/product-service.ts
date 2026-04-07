import { prisma } from '../../../config/prisma';
import { ICreateProductDTO } from '../models/product-types';
import { calculateSuggestedPrice } from '../../../shared/utils/price-calculator';

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
export const createProductService = async (data: ICreateProductDTO) => {
  // 1. Obtener el precio actual del oro desde la base de datos (SystemSetting)
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

  // 2. Calcular el precio sugerido
  // Usamos .toNumber() porque Prisma devuelve tipos Decimal seguros
  const calculatedPrice = calculateSuggestedPrice(
    data.baseWeight,
    systemSettings.goldPricePerGram.toNumber(),
    data.stoneValue,
  );
  // Lógica inteligente de estado según el stock
  const initialStatus = data.stock > 0 ? 'AVAILABLE' : 'OUT_OF_STOCK';

  // 3. Guardar en la base de datos con Prisma
  const newProduct = await prisma.product.create({
    data: {
      categoryId: data.categoryId,
      name: data.name,
      description: data.description,
      baseWeight: data.baseWeight,
      stoneValue: data.stoneValue,
      laborCost: data.laborCost,
      stock: data.stock,
      status: initialStatus,
      calculatedPrice: calculatedPrice,
      specifications: data.specifications as object,
      images: data.images,
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
