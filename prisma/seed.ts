import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
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

  console.log('Categorías iniciales insertadas exitosamente.');
}

main()
  .catch((e) => {
    console.error('Error en seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
