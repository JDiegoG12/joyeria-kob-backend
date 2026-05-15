import { Request, Response, NextFunction } from 'express';
import { productFacade } from '../facade/product.facade';

const parseOptionalNumber = (value: unknown): number | undefined => {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

/**
 * Extrae y sanitiza un parámetro de búsqueda de texto del query string.
 *
 * - Devuelve `undefined` si el valor es ausente, no es string, o es una
 *   cadena vacía / solo espacios.
 * - No hace trim aquí: el trim se hace en el service para mantener
 *   la responsabilidad de limpieza de datos en la capa de negocio.
 *
 * @param value - Valor crudo de `req.query`.
 * @returns String listo para pasar al service, o `undefined`.
 */
const parseOptionalString = (value: unknown): string | undefined => {
  if (typeof value !== 'string' || value.trim() === '') {
    return undefined;
  }
  return value;
};

/**
 * Obtiene todos los productos del catálogo.
 */
export const getProducts = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const isAdmin = req.query.admin === 'true';
    const categoryId = req.query.categoryId
      ? Number(req.query.categoryId)
      : undefined;
    const result = await productFacade.getProducts(isAdmin, categoryId);

    res.status(result.status).json({
      success: result.success,
      data: result.data,
      message: result.message,
      ...(result.error && { error: result.error }),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Obtiene el catálogo público con filtros opcionales y paginación.
 *
 * ## Query params aceptados
 * | Param        | Tipo    | Descripción                                                     |
 * |:-------------|:--------|:----------------------------------------------------------------|
 * | `categoryId` | integer | Filtra por ID de categoría (raíz o subcategoría). Opcional.    |
 * | `minPrice`   | number  | Precio calculado mínimo en COP. Opcional.                      |
 * | `maxPrice`   | number  | Precio calculado máximo en COP. Opcional.                      |
 * | `search`     | string  | Búsqueda por nombre (insensible a mayúsculas, parcial). Nuevo. |
 * | `page`       | integer | Página a recuperar, base 1. Default: 1.                        |
 * | `limit`      | integer | Productos por página. Default: 12. Máximo: 48.                 |
 *
 * ## Comportamiento de `search`
 * - Si `search` está presente y no es vacío, el filtro se aplica sobre el
 *   campo `name` de todos los productos AVAILABLE de la categoría activa,
 *   directamente en la consulta SQL (Prisma `contains`).
 * - El filtrado ocurre en la DB, por lo que los resultados paginados
 *   corresponden al catálogo completo que coincide con el término, no solo
 *   a la página actual cargada en memoria.
 * - El campo `pagination.total` refleja el número total de productos que
 *   coinciden con la búsqueda, para que el frontend pueda mostrar el conteo
 *   real y construir la paginación correctamente.
 *
 * @example
 * GET /api/products/catalog?search=anillo&page=1&limit=12
 * GET /api/products/catalog?search=PULS&categoryId=2&minPrice=100000
 */
export const getCatalogProducts = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const categoryIdRaw = parseOptionalNumber(req.query.categoryId);
    const minPrice = parseOptionalNumber(req.query.minPrice);
    const maxPrice = parseOptionalNumber(req.query.maxPrice);
    const pageRaw = parseOptionalNumber(req.query.page);
    const limitRaw = parseOptionalNumber(req.query.limit);
    const search = parseOptionalString(req.query.search);

    const categoryId =
      categoryIdRaw !== undefined ? Math.trunc(categoryIdRaw) : undefined;
    const page = pageRaw !== undefined ? Math.trunc(pageRaw) : undefined;
    const limit = limitRaw !== undefined ? Math.trunc(limitRaw) : undefined;

    const result = await productFacade.getCatalogProducts(
      categoryId,
      minPrice,
      maxPrice,
      search,
      page,
      limit,
    );

    res.status(result.status).json({
      success: result.success,
      data: result.data,
      message: result.message,
      ...(result.error && { error: result.error }),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Obtiene un producto específico.
 */
export const getProduct = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = req.params.id as string;
    const result = await productFacade.getProduct(id);

    res.status(result.status).json({
      success: result.success,
      data: result.data,
      message: result.message,
      ...(result.error && { error: result.error }),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Crea una nueva joya en el sistema.
 */
export const postProduct = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const productData = req.body;
    // Capturamos los archivos de imagen inyectados por el middleware de Multer
    const files = req.files as Express.Multer.File[];

    const result = await productFacade.createProduct(productData, files);

    res.status(result.status).json({
      success: result.success,
      data: result.data,
      message: result.message,
      ...(result.error && { error: result.error }),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Elimina un producto permanentemente.
 */
export const removeProduct = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = req.params.id as string;
    const result = await productFacade.deleteProduct(id);

    res.status(result.status).json({
      success: result.success,
      message: result.message,
      ...(result.error && { error: result.error }),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Actualiza una joya existente.
 * Soporta actualización parcial (PATCH) y total (PUT).
 */
export const putProduct = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = req.params.id as string;
    const productData = req.body;
    const files = req.files as Express.Multer.File[] | undefined;

    const result = await productFacade.updateProduct(id, productData, files);

    res.status(result.status).json({
      success: result.success,
      data: result.data,
      message: result.message,
      ...(result.error && { error: result.error }),
    });
  } catch (error) {
    next(error);
  }
};
