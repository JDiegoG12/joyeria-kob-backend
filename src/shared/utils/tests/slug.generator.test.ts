import { generateSlug } from '../slug.generator';

// Pruebas para `generateSlug`, que normaliza un nombre legible a un slug apto
// para URLs (minúsculas, sin acentos, espacios como guiones).
describe('generateSlug', () => {
  // Pasa el texto a minúsculas y reemplaza los espacios por guiones.
  it('convierte a minúsculas y reemplaza espacios por guiones', () => {
    expect(generateSlug('Anillos de Oro')).toBe('anillos-de-oro');
  });

  // Elimina los acentos y diacríticos manteniendo la letra base.
  it('elimina acentos y diacríticos', () => {
    expect(generateSlug('Anilló Único')).toBe('anillo-unico');
  });

  // Al normalizar, la 'ñ' se descompone en 'n' + tilde; se elimina la tilde y
  // queda la 'n' base.
  it('convierte la ñ en n al eliminar la tilde combinante', () => {
    expect(generateSlug('Niña')).toBe('nina');
  });

  // Descarta los caracteres especiales no permitidos en una URL.
  it('descarta caracteres especiales', () => {
    expect(generateSlug('Oro 24K!! @2024')).toBe('oro-24k-2024');
  });

  // Un texto ya en formato slug se mantiene sin cambios.
  it('mantiene un slug ya válido', () => {
    expect(generateSlug('collares-plata')).toBe('collares-plata');
  });

  // Una cadena vacía produce una cadena vacía.
  it('devuelve cadena vacía para una entrada vacía', () => {
    expect(generateSlug('')).toBe('');
  });
});
