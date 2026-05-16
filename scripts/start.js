const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// --- Marcador de depuración ---
// Escribe en un archivo en la raíz del proyecto para confirmar la ejecución.
try {
  const markerPath = path.join(__dirname, '..', 'start-ran.txt');
  const timestamp = new Date().toISOString();
  const logMessage = `Script de inicio ejecutado a las: ${timestamp}\n`;
  fs.writeFileSync(markerPath, logMessage, { flag: 'a' });
  console.log(`--- [START SCRIPT] Marcador escrito en ${markerPath} ---`);
} catch (error) {
  console.error('--- [START SCRIPT] Fallo al escribir el marcador:', error);
}

console.log(
  '--- [START SCRIPT] Iniciando script de arranque de producción ---',
);

console.log('--- [START SCRIPT] Ejecutando migraciones de base de datos...');
execSync('npx prisma migrate deploy', { stdio: 'inherit' });

console.log(
  '--- [START SCRIPT] Migraciones completadas. Iniciando servidor... ---',
);
require('../dist/index.js');
