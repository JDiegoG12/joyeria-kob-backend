/**
 * Estructura del JSON flexible para los atributos variables de las joyas.
 */
export interface IJewelSpecifications {
  requiresSize: boolean;
  availableSizes?: number[];
  hasStones: boolean;
  stoneType?: string;
  isConfigurable?: boolean;
}

/**
 * DTO (Data Transfer Object) esperado en el body para crear un producto.
 */
export interface ICreateProductDTO {
  categoryId: number;
  name: string;
  description: string;
  baseWeight: number;
  additionalValue: number;
  laborCost: number;
  stock: number;
  specifications: IJewelSpecifications;
  images: string[];
}

/**
 * Representa los datos tal cual llegan del formulario (todo como string).
 */
export interface IProductRawInput {
  categoryId: string;
  name: string;
  description: string;
  baseWeight: string;
  additionalValue: string;
  laborCost: string;
  stock: string;
  specifications: string; // JSON en texto
}
