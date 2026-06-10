import { calculateSuggestedPrice } from '../price-calculator';

// Pruebas para la función `calculateSuggestedPrice`, núcleo del cálculo de
// precios de las joyas. No tiene dependencias externas, por lo que se prueba
// directamente la fórmula (peso * valorOro) + valorAdicional, redondeada.
describe('calculateSuggestedPrice', () => {
  // Caso base: aplica correctamente la fórmula con valores típicos.
  it('aplica la fórmula (peso * valorOro) + valorAdicional', () => {
    // (2 * 350000) + 100000 = 800000
    expect(calculateSuggestedPrice(2, 350000, 100000)).toBe(800000);
  });

  // Sin valor adicional, el precio es simplemente peso * valorOro.
  it('devuelve peso * valorOro cuando el valor adicional es 0', () => {
    expect(calculateSuggestedPrice(3, 200000, 0)).toBe(600000);
  });

  // Un peso de 0 deja el precio igual al valor adicional.
  it('devuelve solo el valor adicional cuando el peso es 0', () => {
    expect(calculateSuggestedPrice(0, 350000, 50000)).toBe(50000);
  });

  // Todos los valores en 0 producen 0.
  it('devuelve 0 cuando todos los valores son 0', () => {
    expect(calculateSuggestedPrice(0, 0, 0)).toBe(0);
  });

  // El resultado se redondea al entero más cercano.
  it('redondea el resultado al entero más cercano', () => {
    // (1.5 * 333333) + 0 = 499999.5 → 500000
    expect(calculateSuggestedPrice(1.5, 333333, 0)).toBe(500000);
    // (0.1 * 1) + 0 = 0.1 → 0
    expect(calculateSuggestedPrice(0.1, 1, 0)).toBe(0);
  });

  // Soporta pesos decimales (gramos con fracción).
  it('soporta pesos decimales', () => {
    // (2.5 * 100000) + 25000 = 275000
    expect(calculateSuggestedPrice(2.5, 100000, 25000)).toBe(275000);
  });

  // No impone un mínimo: con entradas negativas la fórmula puede dar negativo.
  it('no acota el resultado a un mínimo (puede ser negativo)', () => {
    // (1 * 100) + (-500) = -400
    expect(calculateSuggestedPrice(1, 100, -500)).toBe(-400);
  });
});
