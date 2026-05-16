const { execSync } = require('child_process');

console.log(
  '--- [START SCRIPT] Iniciando script de arranque de producción ---',
);

console.log(
  '--- [START SCRIPT] Ejecutando migraciones de base de datos... ---',
);
execSync('npx prisma migrate deploy', { stdio: 'inherit' });

console.log(
  '--- [START SCRIPT] Migraciones completadas. Iniciando servidor... ---',
);
require('../dist/index.js');
