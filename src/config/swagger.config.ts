import swaggerJsdoc from 'swagger-jsdoc';

/**
 * Opciones de configuración para swagger-jsdoc.
 * Define los metadatos de la API y dónde buscar las anotaciones @openapi.
 */
const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Joyería KOB API',
      version: '1.0.0',
      description:
        'Documentación de la API REST de la plataforma Joyería KOB. ' +
        'Aquí encontrarás todos los endpoints disponibles para el manejo ' +
        'de productos, usuarios y órdenes.',
      contact: {
        name: 'Equipo JADI',
      },
    },
    servers: [
      {
        url: 'http://localhost:4000',
        description: 'Servidor de desarrollo',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Ingresa el token JWT obtenido al hacer login.',
        },
      },
      responses: {
        UnauthorizedError: {
          description: 'Token ausente o inválido.',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: false },
                  error: { type: 'string', example: 'UNAUTHORIZED' },
                  message: {
                    type: 'string',
                    example: 'Token inválido o expirado.',
                  },
                },
              },
            },
          },
        },
        NotFoundError: {
          description: 'El recurso solicitado no existe.',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: false },
                  error: { type: 'string', example: 'NOT_FOUND' },
                  message: {
                    type: 'string',
                    example: 'El recurso solicitado no existe.',
                  },
                },
              },
            },
          },
        },
        InternalServerError: {
          description: 'Ocurrió un error inesperado en el servidor.',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: false },
                  error: { type: 'string', example: 'INTERNAL_ERROR' },
                  message: {
                    type: 'string',
                    example:
                      'Ocurrió un error inesperado. Por favor, intente de nuevo más tarde.',
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  // Aquí le decimos a swagger-jsdoc dónde buscar las anotaciones @openapi
  // Cuando agregues nuevos archivos de rutas, sigue este mismo patrón
  apis: ['./src/api/app.ts', './src/features/**/routes.ts'],
};

/**
 * Especificación OpenAPI generada a partir de las opciones y anotaciones.
 * Se exporta para ser usada por swagger-ui-express en app.ts.
 */
export const swaggerSpec = swaggerJsdoc(options);
