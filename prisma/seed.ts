import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando la siembra de la base de datos...');

  // 1. Sembrar Configuración del Sistema (Precio del Oro)
  // Usamos upsert para que si volvemos a correr el seed, no intente duplicar el ID 1
  await prisma.systemSetting.upsert({
    where: { id: 1 },
    update: {}, // Si ya existe, no hace nada
    create: {
      id: 1,
      goldPricePerGram: 350000, // Valor base inicial simulado en COP
    },
  });
  console.log('✅ Precio del oro inicializado.');

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
  console.log('✅ Categorías iniciales insertadas.');

  console.log('🎉 Siembra completada exitosamente.');
}

main()
  .catch((e) => {
    console.error('❌ Error en seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
