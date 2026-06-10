/**
 * Genera un slug apto para URLs a partir de un nombre legible.
 *
 * Transforma el texto en una versi\u00f3n normalizada: elimina acentos y diacr\u00edticos,
 * lo pasa a min\u00fasculas, reemplaza los espacios por guiones y descarta cualquier
 * car\u00e1cter que no sea alfanum\u00e9rico o guion.
 *
 * @param name - Nombre original (por ejemplo, el de una categor\u00eda o producto).
 * @returns El slug resultante (por ejemplo, "Anillos de Oro" produce "anillos-de-oro").
 */
export const generateSlug = (name: string): string => {
  return name
    .normalize('NFD') // Descompone los caracteres acentuados en base + diacr\u00edtico.
    .replace(/[\u0300-\u036f]/g, '') // Elimina los diacr\u00edticos resultantes.
    .toLowerCase()
    .replace(/ /g, '-') // Sustituye los espacios por guiones.
    .replace(/[^\w-]+/g, ''); // Descarta los caracteres no permitidos en una URL.
};
