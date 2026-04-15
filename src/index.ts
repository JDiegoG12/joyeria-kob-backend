import app from './api/app';

/**
 * Puerto de ejecución del servidor.
 * Toma el valor de las variables de entorno o usa el 4000 por defecto.
 */
const PORT = process.env.PORT || 4000;

/**
 * Inicializa el servidor Express y lo deja escuchando peticiones.
 */
app.listen(PORT, () => {
    console.log(`🚀 Servidor de Joyería KOB corriendo en http://localhost:${PORT}`);
    console.log(`📖 Documentación Swagger en http://localhost:${PORT}/api-docs`);
});