/**
 * Representa una joya del catálogo de Joyería KOB.
 */
export interface IProduct {
    id: string;
    name: string;
    description: string;
    priceCop: number;
    material: 'oro' | 'plata' | 'platino';
    stock: number;
}