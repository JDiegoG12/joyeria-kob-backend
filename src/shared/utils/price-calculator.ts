/**
 * Calcula el precio final sugerido de una joya aplicando la fórmula de negocio.
 * Fórmula: (peso * valorOro) + (peso * 100k) + valorAdicional
 *
 * @param weight - Peso base de la joya en gramos.
 * @param goldPrice - Precio actual del mercado por gramo de oro.
 * @param additionalValue - Costo extra por piedras o detalles personalizados.
 * @param laborPricePerGram - Costo de mano de obra por gramo.
 * @returns El precio total sugerido redondeado al entero más cercano.
 */
export const calculateSuggestedPrice = (
  weight: number,
  goldPrice: number,
  additionalValue: number,
): number => {
  const total = weight * goldPrice + additionalValue;

  return Math.round(total);
};
