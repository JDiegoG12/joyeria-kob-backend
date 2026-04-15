import { IProduct } from '../models/product.model';

/**
 * Base de datos en memoria para el ejemplo.
 * En producción esto será reemplazado por las consultas reales a la DB.
 */
const products: IProduct[] = [
    {
        id: '1',
        name: 'Anillo Esmeralda Colonial',
        description: 'Anillo en oro de 18k con esmeralda colombiana certificada.',
        priceCop: 4500000,
        material: 'oro',
        stock: 3,
    },
    {
        id: '2',
        name: 'Collar Lágrima de Plata',
        description: 'Collar en plata 950 con dije artesanal.',
        priceCop: 850000,
        material: 'plata',
        stock: 12,
    },
];

/**
 * Retorna todas las joyas del catálogo.
 *
 * @returns Arreglo con todos los productos disponibles.
 */
export const getAllProducts = (): IProduct[] => {
    return products;
};

/**
 * Busca una joya por su ID único.
 *
 * @param id - El identificador único del producto.
 * @returns El producto encontrado o undefined si no existe.
 */
export const getProductById = (id: string): IProduct | undefined => {
    return products.find((p) => p.id === id);
};

/**
 * Crea una nueva joya en el catálogo.
 *
 * @param data - Los datos del nuevo producto sin el ID (se genera aquí).
 * @returns El producto recién creado con su ID asignado.
 */
export const createProduct = (data: Omit<IProduct, 'id'>): IProduct => {
    const newProduct: IProduct = {
        id: String(products.length + 1),
        ...data,
    };
    products.push(newProduct);
    return newProduct;
};

/**
 * Elimina una joya del catálogo por su ID.
 *
 * @param id - El identificador único del producto a eliminar.
 * @returns true si fue eliminado, false si no se encontró.
 */
export const deleteProduct = (id: string): boolean => {
    const index = products.findIndex((p) => p.id === id);
    if (index === -1) return false;
    products.splice(index, 1);
    return true;
};