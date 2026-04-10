/**
 * Tipos base y reutilizables
 */
export type ProductStatus = 'AVAILABLE' | 'OUT_OF_STOCK' | 'HIDDEN';

// Estructura del JSON flexible para los atributos variables de las joyas.
export interface IJewelSpecifications {
  requiresSize: boolean;
  availableSizes?: number[];
  hasStones: boolean;
  stoneType?: string;
  isConfigurable?: boolean;
}

/**
 * 1. Definición de la base del producto
 */
export interface IProductBase {
  categoryId: number;
  name: string;
  description: string;
  baseWeight: number;
  additionalValue: number;
  laborCost: number;
  stock: number;
  specifications: IJewelSpecifications;
}

/**
 * 2. DTO de creación, lo esperado en el body para crear un producto.
 */
export interface ICreateProductDTO extends IProductBase {
  images: string[]; // URLs de las imágenes procesadas
}

/**
 * 3. DTO de Actualización (Interno/Clean).
 * Usamos "Partial" para hacer que todos los campos del Create sean opcionales
 * y le agregamos el status.
 */
export type IUpdateProductDTO = Partial<ICreateProductDTO> & {
  status?: ProductStatus;
};

/**
 * 4. Tipos Mapeados (Mapped Types) para el Form Data (Raw)
 * Este tipo genérico convierte todas las propiedades de cualquier interfaz a `string`.
 */
export type IRawInput<T> = {
  [P in keyof T]: string;
};

/**
 * Representa los datos que recibimos del formulario para crear un producto (todos como string).
 */
export type IProductCreateRaw = IRawInput<Omit<ICreateProductDTO, 'images'>>;

/**
 * Representa los datos que recibimos del formulario para actualizar un producto (todos como string).
 */
export type IProductUpdateRaw = Partial<IProductCreateRaw> & {
  status?: string; // El status también viene como string
};
