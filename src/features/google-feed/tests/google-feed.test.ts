import { getGoogleFeedItems } from '../google-feed.service';
import type { GoogleFeedItem } from '../google-feed.service';
import { buildGoogleFeedXml } from '../google-feed.xml';
import { getAllProductsService } from '../../products/services/product-service';

// Mockea el service de productos para aislar la lógica del feed de Prisma/BD.
// `getGoogleFeedItems` llama a `getAllProductsService(false)`; controlamos su
// salida con datos mock que imitan la forma ya enriquecida con precios.
jest.mock('../../products/services/product-service', () => ({
  getAllProductsService: jest.fn(),
}));

const mockedGetAll = getAllProductsService as jest.Mock;

/** Producto mock con valores por defecto razonables; se sobreescribe por test. */
const makeProduct = (overrides: Record<string, unknown> = {}) => ({
  id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  name: 'Anillo de Compromiso Solitario',
  description: 'Clásico anillo en oro de 18k.',
  images: ['anillo-solitario-1.webp', 'anillo-solitario-2.webp'],
  status: 'AVAILABLE',
  discountValue: 0,
  calculatedPrice: 1825000,
  finalPrice: 1825000,
  category: { name: 'Anillos', slug: 'anillos', parent: null },
  ...overrides,
});

describe('getGoogleFeedItems', () => {
  beforeEach(() => jest.clearAllMocks());

  it('producto sin descuento → g:price = finalPrice "<entero> COP", sin sale_price', async () => {
    mockedGetAll.mockResolvedValue([makeProduct()]);

    const [item] = await getGoogleFeedItems();

    expect(item.price).toBe('1825000 COP');
    expect(item.salePrice).toBeUndefined();
  });

  it('formatea el precio sin separadores de miles ni decimales (redondea)', async () => {
    mockedGetAll.mockResolvedValue([
      makeProduct({ calculatedPrice: 1825000.4, finalPrice: 1825000.4 }),
    ]);

    const [item] = await getGoogleFeedItems();

    expect(item.price).toBe('1825000 COP');
    expect(item.price).not.toMatch(/[.,]/);
  });

  it('producto con descuento → g:price = calculatedPrice y g:sale_price = finalPrice', async () => {
    mockedGetAll.mockResolvedValue([
      makeProduct({
        discountValue: 200000,
        calculatedPrice: 2000000,
        finalPrice: 1800000,
      }),
    ]);

    const [item] = await getGoogleFeedItems();

    expect(item.price).toBe('2000000 COP');
    expect(item.salePrice).toBe('1800000 COP');
  });

  it('descuento mal formado (finalPrice >= calculatedPrice) → cae al caso sin descuento', async () => {
    mockedGetAll.mockResolvedValue([
      makeProduct({
        discountValue: 500, // hay descuento declarado…
        calculatedPrice: 2000000,
        finalPrice: 2000000, // …pero no reduce el precio
      }),
    ]);

    const [item] = await getGoogleFeedItems();

    expect(item.price).toBe('2000000 COP');
    expect(item.salePrice).toBeUndefined();
  });

  it('omite del feed los productos sin imágenes', async () => {
    mockedGetAll.mockResolvedValue([
      makeProduct({ id: 'con-imagen' }),
      makeProduct({ id: 'sin-imagen', images: [] }),
    ]);

    const items = await getGoogleFeedItems();

    expect(items.map((i) => i.id)).toEqual(['con-imagen']);
  });

  it('mapea la taxonomía: categoría conocida (anillos → 200) y desconocida → 188', async () => {
    mockedGetAll.mockResolvedValue([
      makeProduct({ id: 'anillo', category: { name: 'Anillos', slug: 'anillos', parent: null } }),
      makeProduct({ id: 'raro', category: { name: 'Relojes', slug: 'relojes', parent: null } }),
    ]);

    const [anillo, raro] = await getGoogleFeedItems();

    expect(anillo.googleProductCategory).toBe(200);
    expect(raro.googleProductCategory).toBe(188);
  });

  it('construye link al dominio del front e image_link al dominio de la API', async () => {
    mockedGetAll.mockResolvedValue([makeProduct()]);

    const [item] = await getGoogleFeedItems();

    expect(item.link).toBe(
      'https://www.joyeriakob.com/producto/anillo-de-compromiso-solitario-f47ac10b-58cc-4372-a567-0e02b2c3d479',
    );
    expect(item.imageLink).toBe(
      'https://api.joyeriakob.com/uploads/products/anillo-solitario-1.webp',
    );
    expect(item.additionalImageLinks).toEqual([
      'https://api.joyeriakob.com/uploads/products/anillo-solitario-2.webp',
    ]);
  });
});

describe('buildGoogleFeedXml', () => {
  /** Item base del feed; se sobreescribe por test. */
  const makeItem = (overrides: Partial<GoogleFeedItem> = {}): GoogleFeedItem => ({
    id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    title: 'Anillo de Compromiso Solitario',
    description: 'Clásico anillo en oro de 18k.',
    link: 'https://www.joyeriakob.com/producto/anillo-de-compromiso-solitario-f47ac10b-58cc-4372-a567-0e02b2c3d479',
    imageLink: 'https://api.joyeriakob.com/uploads/products/anillo-solitario-1.webp',
    additionalImageLinks: [],
    availability: 'in_stock',
    price: '1825000 COP',
    brand: 'Joyería KOB',
    condition: 'new',
    identifierExists: 'no',
    googleProductCategory: 200,
    productType: 'Anillos',
    ...overrides,
  });

  it('escapa &, < y > en título y descripción', () => {
    const xml = buildGoogleFeedXml([
      makeItem({
        title: 'Anillo & Rubí <especial>',
        description: 'Oro & piedra <preciosa> > calidad',
      }),
    ]);

    expect(xml).toContain('<g:title>Anillo &amp; Rubí &lt;especial&gt;</g:title>');
    expect(xml).toContain(
      '<g:description>Oro &amp; piedra &lt;preciosa&gt; &gt; calidad</g:description>',
    );
    // No debe quedar ningún caracter sin escapar dentro de los valores.
    expect(xml).not.toContain('Anillo & Rubí');
  });

  it('emite g:sale_price solo cuando el item lo trae', () => {
    const conDescuento = buildGoogleFeedXml([
      makeItem({ price: '2000000 COP', salePrice: '1800000 COP' }),
    ]);
    const sinDescuento = buildGoogleFeedXml([makeItem()]);

    expect(conDescuento).toContain('<g:price>2000000 COP</g:price>');
    expect(conDescuento).toContain('<g:sale_price>1800000 COP</g:sale_price>');
    expect(sinDescuento).not.toContain('<g:sale_price>');
  });

  it('genera RSS 2.0 con el namespace g y el channel', () => {
    const xml = buildGoogleFeedXml([makeItem()]);

    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(xml).toContain('xmlns:g="http://base.google.com/ns/1.0"');
    expect(xml).toContain('<link>https://www.joyeriakob.com</link>');
  });
});
