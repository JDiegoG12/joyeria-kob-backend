/**
 * @file env.ts
 * @description Lectura y validación centralizada de las variables de entorno
 * sensibles. Su objetivo es "fallar rápido": si una variable crítica no está
 * definida, la aplicación aborta el arranque en lugar de recurrir a un valor
 * por defecto inseguro (p. ej. un `JWT_SECRET` hardcodeado, que permitiría a
 * cualquiera falsificar tokens de administrador).
 *
 * En producción, Hostinger inyecta estas variables en el entorno del proceso.
 * En desarrollo se leen del `.env` (cargado por Prisma / `dotenv`).
 */

/**
 * Devuelve el valor de una variable de entorno obligatoria. Lanza un error
 * descriptivo si falta o está vacía, deteniendo el arranque de la app.
 */
const requireEnv = (name: string): string => {
  const value = process.env[name];
  if (!value || value.trim() === '') {
    throw new Error(
      `La variable de entorno ${name} es obligatoria y no está definida. ` +
        'Configúrala en el entorno (o en el archivo .env en desarrollo) antes ' +
        'de arrancar la aplicación.',
    );
  }
  return value;
};

/**
 * Secreto usado para firmar y verificar los JWT. NO tiene valor por defecto:
 * un secreto conocido permitiría a un atacante emitir tokens válidos con rol
 * ADMIN. Debe configurarse con un valor fuerte y aleatorio.
 */
export const JWT_SECRET = requireEnv('JWT_SECRET');
