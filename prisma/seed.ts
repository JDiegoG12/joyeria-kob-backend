import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seedUsers() {
  console.log('Iniciando la siembra de usuarios...');

  const adminPassword = await bcrypt.hash('Admin123!', 10);
  await prisma.user.upsert({
    where: { email: 'admin@kob.com' },
    update: { password: adminPassword },
    create: {
      email: 'admin@kob.com',
      password: adminPassword,
      role: UserRole.ADMIN,
    },
  });

  const clientPassword = await bcrypt.hash('Cliente123!', 10);
  await prisma.user.upsert({
    where: { email: 'cliente@test.com' },
    update: { password: clientPassword },
    create: {
      email: 'cliente@test.com',
      password: clientPassword,
      role: UserRole.CLIENT,
    },
  });

  console.log('Usuarios de ejemplo insertados.');
}

async function main() {
  console.log('Iniciando la siembra de la base de datos...');

  await seedUsers();

  // 1. Sembrar Configuración del Sistema (Precio del Oro)
  await prisma.systemSetting.upsert({
    where: { id: 1 },
    update: {
      goldPricePerGram: 350000,
    },
    create: {
      id: 1,
      goldPricePerGram: 350000,
    },
  });
  console.log('Configuraciones del sistema inicializadas.');

  // 2. Sembrar Categorías
  await prisma.category.createMany({
    data: [
      {
        name: 'Anillos',
        slug: 'anillos',
        description: 'Categoría de anillos de joyería',
      },
      {
        name: 'Aretes',
        slug: 'aretes',
        description: 'Categoría de aretes y pendientes',
      },
      {
        name: 'Dijes',
        slug: 'dijes',
        description: 'Categoría de dijes y colgantes',
      },
      {
        name: 'Herrajes',
        slug: 'herrajes',
        description: 'Categoría de herrajes para joyería',
      },
      {
        name: 'Cadenas',
        slug: 'cadenas',
        description: 'Categoría de cadenas y collares',
      },
      {
        name: 'Pulseras',
        slug: 'pulseras',
        description: 'Categoría de pulseras y brazaletes',
      },
    ],
    skipDuplicates: true,
  });
  console.log('Categorías iniciales insertadas.');

  // 3. Sembrar Productos
  console.log('Limpiando productos existentes...');
  await prisma.product.deleteMany({});

  const categories = await prisma.category.findMany();
  const categoryMap = new Map(categories.map((c) => [c.slug, c.id]));

  const productsToSeed = [
    {
      name: 'Anillo de Compromiso Solitario',
      description:
        'Clásico anillo de compromiso con un diamante solitario, fabricado en oro de 18k.',
      baseWeight: 4.5,
      additionalValue: 250000, // Valor del diamante
      stock: 10,
      specifications: { Talla: '6', 'Quilates Diamante': '0.5' },
      images: ['anillo-solitario-1.webp', 'anillo-solitario-2.webp'],
      categorySlug: 'anillos',
    },
    {
      name: 'Aretes Argollas de Oro',
      description:
        'Elegantes aretes tipo argolla, perfectos para el día a día.',
      baseWeight: 3.0,
      additionalValue: 0,
      stock: 25,
      specifications: { Diámetro: '2cm' },
      images: ['aretes-argollas-1.webp'],
      categorySlug: 'aretes',
    },
    {
      name: 'Cadena Tejido Chino',
      description: 'Sofisticada cadena de oro con un tradicional tejido chino.',
      baseWeight: 10.0,
      additionalValue: 0,
      stock: 5,
      specifications: { Longitud: '50cm', Ancho: '3mm' },
      images: ['cadena-chino-1.webp'],
      categorySlug: 'cadenas',
    },
    {
      name: 'Pulsera de Eslabones',
      description: 'Moderna pulsera de eslabones grandes en oro de 18k.',
      baseWeight: 8.2,
      additionalValue: 0,
      stock: 8,
      specifications: { Longitud: '19cm' },
      images: ['pulsera-eslabones-1.webp'],
      categorySlug: 'pulseras',
    },
    {
      name: 'Dije de Cruz',
      description: 'Dije clásico de cruz, ideal para cadenas delgadas.',
      baseWeight: 1.5,
      additionalValue: 0,
      stock: 0, // Producto agotado
      specifications: { Alto: '2.5cm', Ancho: '1.5cm' },
      images: ['dije-cruz-1.webp'],
      categorySlug: 'dijes',
    },
    {
      name: 'Herrajes de Oro',
      description: 'Set de herrajes de oro para fabricación de joyas.',
      baseWeight: 0.5,
      additionalValue: 0,
      stock: 0, // Este producto estará agotado (OUT_OF_STOCK)
      specifications: { Tipo: 'Cierre de mosquetón' },
      images: ['herrajes-de-oro.webp'],
      categorySlug: 'herrajes',
    },
    {
      name: 'Anillo de Rubí',
      description:
        'Anillo de oro con rubí. Producto de muestra, no visible en tienda.',
      baseWeight: 6.0,
      additionalValue: 400000, // Valor del rubí
      stock: 3, // Tiene stock, pero está oculto
      status: 'HIDDEN', // Estado asignado manualmente
      specifications: { Talla: '7', 'Quilates Rubí': '1.2' },
      images: ['anillo-de-rubi.webp'],
      categorySlug: 'anillos',
    },
  ];

  const productData = productsToSeed
    .map((p) => {
      const categoryId = categoryMap.get(p.categorySlug);
      if (!categoryId) {
        console.warn(
          `Categoría '${p.categorySlug}' no encontrada. Saltando producto '${p.name}'.`,
        );
        return null;
      }

      return {
        name: p.name,
        description: p.description,
        baseWeight: p.baseWeight,
        additionalValue: p.additionalValue,
        stock: p.stock,
        status: p.status ?? (p.stock > 0 ? 'AVAILABLE' : 'OUT_OF_STOCK'),
        specifications: p.specifications,
        images: p.images,
        categoryId: categoryId,
      };
    })
    .filter((p) => p !== null) as any[];

  if (productData.length > 0) {
    await prisma.product.createMany({
      data: productData,
    });
    console.log(`${productData.length} productos han sido insertados.`);
  }

  console.log('Siembra completada exitosamente.');
}

main()
  .catch((e) => {
    console.error('Error en seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
