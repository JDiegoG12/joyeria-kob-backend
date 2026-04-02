# Joyería KOB — Backend

API REST de la plataforma Joyería KOB, construida con Express 5, TypeScript 6 y documentada con Swagger (OpenAPI 3.0).

---

## Requisitos previos

Antes de clonar el repositorio, asegúrate de tener instaladas estas versiones exactas en tu máquina:

| Herramienta | Versión requerida  | Verificar con   |
| ----------- | ------------------ | --------------- |
| Node.js     | v22.19.0           | `node -v`       |
| npm         | v10.9.3            | `npm -v`        |
| Git         | Cualquier reciente | `git --version` |

> Si tu versión de Node no coincide, usa [nvm-windows](https://github.com/coreybutler/nvm-windows) (Windows) o [nvm](https://github.com/nvm-sh/nvm) (Mac/Linux) para cambiar de versión sin afectar otros proyectos.

---

## Extensiones recomendadas para VS Code

| Extensión   | ID                       | Para qué sirve                           |
| ----------- | ------------------------ | ---------------------------------------- |
| ESLint      | `dbaeumer.vscode-eslint` | Muestra errores de código en tiempo real |
| Prettier    | `esbenp.prettier-vscode` | Formatea el código al guardar            |
| REST Client | `humao.rest-client`      | Probar endpoints HTTP desde VS Code      |
| DotENV      | `mikestead.dotenv`       | Resaltado de sintaxis en archivos `.env` |

### Configuración de VS Code requerida

Crea el archivo `.vscode/settings.json` en la raíz del proyecto con este contenido:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },
  "typescript.tsdk": "node_modules/typescript/lib"
}
```

> Este archivo no está en el repositorio porque es configuración local de cada desarrollador.

---

## Primeros pasos al clonar el repositorio

Ejecuta estos comandos **en orden** la primera vez que clones el proyecto:

```bash
# 1. Clonar el repositorio
git clone <url-del-repositorio>
cd joyeria-kob-backend

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env
```

Abre el archivo `.env` recién creado y completa los valores según tu entorno local:

```env
PORT=4000
DB_URL=          # URL de conexión a la base de datos
JWT_SECRET=      # Clave secreta para firmar los tokens JWT
```

> El archivo `.env` nunca se sube al repositorio. Si necesitas agregar una nueva variable de entorno, agrégala también en `.env.example` con el valor vacío para que el equipo sepa que existe.

```bash
# 4. Verificar que todo está en orden antes de empezar a trabajar
npm run lint
npm run build
```

Si ambos comandos terminan sin errores, el entorno está listo.

```bash
# 5. Iniciar el servidor en modo desarrollo
npm run dev
```

El servidor quedará corriendo en `http://localhost:4000`.

---

## Scripts disponibles

| Comando          | Descripción                                                                       |
| ---------------- | --------------------------------------------------------------------------------- |
| `npm run dev`    | Inicia el servidor con `nodemon` — se reinicia automáticamente al guardar cambios |
| `npm run build`  | Compila TypeScript a JavaScript plano en la carpeta `/dist`                       |
| `npm run start`  | Ejecuta el build compilado (usar en producción)                                   |
| `npm run lint`   | Analiza el código con ESLint y reporta errores                                    |
| `npm run format` | Formatea automáticamente todos los archivos `src/**/*.ts`                         |

---

## Stack tecnológico

| Tecnología         | Versión  | Rol                                          |
| ------------------ | -------- | -------------------------------------------- |
| Node.js            | v22.19.0 | Entorno de ejecución                         |
| TypeScript         | ^6.0.2   | Tipado estático                              |
| Express            | ^5.2.1   | Framework HTTP                               |
| swagger-jsdoc      | ^6.2.8   | Genera la spec OpenAPI desde anotaciones     |
| swagger-ui-express | ^5.0.1   | Sirve la UI interactiva de Swagger           |
| Axios              | ^1.14.0  | Cliente HTTP para consumo de APIs externas   |
| ESLint             | ^9.10.0  | Análisis estático de código                  |
| Prettier           | ^3.3.3   | Formateo de código                           |
| Husky              | ^9.1.7   | Git hooks automáticos                        |
| commitlint         | ^19.8.0  | Validación de mensajes de commit             |
| nodemon            | ^3.1.14  | Reinicio automático en desarrollo            |
| ts-node            | ^10.9.2  | Ejecuta TypeScript directamente sin compilar |

---

## Estructura de carpetas

```
src/
├── api/
│   ├── app.ts              # Configuración de Express, middlewares y registro de rutas
│   └── middlewares/        # Middlewares transversales (auth, manejo de errores)
├── config/
│   └── swagger.config.ts   # Configuración central de Swagger/OpenAPI
├── features/               # Módulos de negocio — uno por cada dominio
│   ├── products/           # Ejemplo: gestión de joyas del catálogo
│   │   ├── controllers/    # Maneja Request/Response, llama al service
│   │   ├── services/       # Lógica de negocio pura (cálculos, validaciones, DB)
│   │   ├── models/         # Interfaces y tipos del dominio
│   │   └── routes.ts       # Define endpoints y contiene anotaciones @openapi
│   └── users/              # Módulo de usuarios y autenticación
├── shared/
│   ├── constants/          # Códigos de error, valores fijos
│   └── utils/              # Funciones de utilidad reutilizables
└── index.ts                # Punto de entrada — arranca el servidor
```

### Reglas de arquitectura

- **El controller nunca habla con la base de datos.** Eso es responsabilidad del service.
- **El service nunca conoce `Request` ni `Response`.** Solo recibe datos planos y retorna datos planos.
- **Las rutas de un feature no importan nada de otro feature.** Si algo se comparte, va a `shared/`.
- **Toda función, service y hook público debe tener bloque TSDoc.** Sin documentación, no se aprueba el PR.

---

## Formato de respuesta unificado

Todas las respuestas de la API siguen la misma estructura. Nunca rompas este contrato.

**Respuesta exitosa:**

```json
{
  "success": true,
  "data": { "id": "1", "name": "Anillo Esmeralda Colonial" },
  "message": "Producto obtenido correctamente."
}
```

**Respuesta de error:**

```json
{
  "success": false,
  "error": "PRODUCT_NOT_FOUND",
  "message": "La joya solicitada no existe en el catálogo."
}
```

---

## Documentación con Swagger

La documentación interactiva de la API está disponible en:

```
http://localhost:4000/api-docs
```

Desde ahí puedes ver todos los endpoints disponibles, sus parámetros, los cuerpos de las peticiones y las respuestas esperadas. También puedes **ejecutar peticiones directamente** desde el navegador sin necesidad de Postman u otra herramienta.

### Cómo funciona

La documentación se genera automáticamente a partir de anotaciones `@openapi` escritas como comentarios encima de cada ruta en los archivos `routes.ts`. La configuración central (metadatos, esquema JWT, respuestas de error reutilizables) vive en `src/config/swagger.config.ts`.

### Cómo documentar un nuevo endpoint

Cada vez que crees una ruta nueva, agrega su bloque `@openapi` encima de la definición. Este es el patrón completo:

```typescript
/**
 * @openapi
 * /api/orders/{id}:
 *   get:
 *     tags:
 *       - Órdenes
 *     summary: Obtener una orden por ID
 *     description: Descripción detallada opcional del endpoint.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: "42"
 *     responses:
 *       200:
 *         description: Orden encontrada.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Order'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/:id', getOrder);
```

Puntos clave a recordar:

- **`tags`**: agrupa los endpoints en secciones dentro de la UI. Usa el nombre del dominio en español (Productos, Usuarios, Órdenes).
- **`security: - bearerAuth: []`**: activa el candado en la UI. Agrégalo a todos los endpoints que requieran autenticación JWT.
- **`$ref: '#/components/schemas/NombreSchema'`**: reutiliza un schema definido en el mismo `routes.ts` o en `swagger.config.ts`. Nunca repitas la misma estructura en dos sitios.
- **`$ref: '#/components/responses/NotFoundError'`**: reutiliza las respuestas de error globales ya definidas en `swagger.config.ts`.
- **Regla del equipo**: ningún endpoint nuevo se aprueba en PR sin su bloque `@openapi` completo.

### Registrar las rutas de un nuevo feature en Swagger

Cuando crees un nuevo módulo (por ejemplo `orders`), debes hacer dos cosas:

**1. Agregar el archivo al campo `apis` en `swagger.config.ts`:**

```typescript
apis: ['./src/api/app.ts', './src/features/**/routes.ts'],
```

El patrón `**/routes.ts` ya cubre automáticamente cualquier `routes.ts` dentro de `features/`, así que si respetas la estructura de carpetas, **no necesitas modificar `swagger.config.ts`** al agregar nuevos features.

**2. Registrar el router en `app.ts`:**

```typescript
import orderRouter from '../features/orders/routes';
app.use('/api/orders', orderRouter);
```

---

## Módulo de productos — Ejemplo de referencia

La carpeta `src/features/products/` contiene una implementación completa de ejemplo que ilustra cómo debe estructurarse cualquier módulo del proyecto. Incluye los cuatro patrones fundamentales de una API REST:

| Endpoint            | Método   | Descripción                |
| ------------------- | -------- | -------------------------- |
| `/api/products`     | `GET`    | Listar todos los productos |
| `/api/products/:id` | `GET`    | Obtener un producto por ID |
| `/api/products`     | `POST`   | Crear un nuevo producto    |
| `/api/products/:id` | `DELETE` | Eliminar un producto       |

> **Importante:** los datos de este módulo son ficticios y se almacenan en memoria (un arreglo en `product.service.ts`). Esto es intencional para que el ejemplo funcione sin necesitar una base de datos configurada. Cuando se implemente el módulo real de productos, el service debe reemplazarse con las consultas reales a la DB. El modelo, el controller y las rutas pueden tomarse como base y ajustarse a las necesidades reales del negocio.

---

## Flujo de trabajo con Git

Seguimos **GitFlow simplificado** con tres tipos de ramas:

```
main       ← Producción. Nunca se sube directo aquí.
develop    ← Integración del equipo.
feature/*  ← Tu rama de trabajo. Siempre se crea desde develop.
```

### Ciclo de trabajo normal

```bash
# 1. Asegúrate de partir desde develop actualizado
git checkout develop
git pull origin develop

# 2. Crea tu rama para la tarea
git checkout -b feature/nombre-de-la-tarea

# 3. Trabaja y haz commits con el formato correcto
git add .
git commit -m "feat: add orders endpoint with swagger docs"

# 4. Cuando termines, sube tu rama y abre un Pull Request hacia develop
git push origin feature/nombre-de-la-tarea
```

> Nunca trabajes directamente en `develop` ni en `main`.

---

## Formato de commits (Conventional Commits)

Husky valida automáticamente el formato al hacer `git commit`. Un commit con formato incorrecto será **rechazado**.

| Prefijo     | Cuándo usarlo                            | Ejemplo                                     |
| ----------- | ---------------------------------------- | ------------------------------------------- |
| `feat:`     | Nueva funcionalidad                      | `feat: add orders module`                   |
| `fix:`      | Corrección de bug                        | `fix: correct price calculation in service` |
| `docs:`     | Solo documentación                       | `docs: add swagger docs to users route`     |
| `style:`    | Cambios de formato o estilo              | `style: format product controller`          |
| `refactor:` | Mejora de código sin nueva funcionalidad | `refactor: simplify auth middleware`        |
| `chore:`    | Mantenimiento o instalación de librerías | `chore: install bcrypt`                     |

---

## Estándares de código

### Nomenclatura

| Elemento              | Formato            | Ejemplo                    |
| --------------------- | ------------------ | -------------------------- |
| Carpetas y archivos   | `kebab-case`       | `product-service.ts`       |
| Clases e interfaces   | `PascalCase`       | `IProduct`, `OrderService` |
| Variables y funciones | `camelCase`        | `getProductById`           |
| Constantes            | `UPPER_SNAKE_CASE` | `MAX_RETRY_LIMIT`          |
| Tipos                 | `PascalCase`       | `UserRole`, `APIResponse`  |

### Reglas generales

- **`any` está prohibido** salvo que sea estrictamente necesario y esté documentado con un comentario que explique el porqué.
- **Funciones pequeñas**: si una función supera 30 líneas, debe dividirse.
- **Early return**: valida errores primero y sal de la función rápido. Evita `if/else` anidados.
- **TSDoc obligatorio** en todas las funciones, servicios y middlewares públicos.

```typescript
/**
 * Busca una joya por su ID único.
 *
 * @param id - El identificador único del producto.
 * @returns El producto encontrado o undefined si no existe.
 */
export const getProductById = (id: string): IProduct | undefined => {
  return products.find((p) => p.id === id);
};
```

---

## Proceso de Pull Request

Ningún código llega a `develop` sin revisión. Al abrir un PR, el revisor debe verificar:

- El código compila sin errores (`npm run build`)
- No hay errores de lint (`npm run lint`)
- Cada función y service tiene TSDoc
- Cada endpoint nuevo tiene su bloque `@openapi` completo
- Se respeta la estructura de capas (controller → service → model)
- El nombre de la rama y los commits siguen el estándar

---

## Preguntas frecuentes

**¿Por qué mi commit fue rechazado?**
Husky está validando el formato. Revisa la tabla de prefijos permitidos y asegúrate de que el mensaje tenga la estructura `tipo: descripción en minúscula`.

**¿Cómo agrego una nueva variable de entorno?**
Agrégala en tu `.env` local y también en `.env.example` con el valor vacío para que el resto del equipo sepa que existe.

**¿Dónde va la lógica de conexión a la base de datos?**
En `src/config/` para la configuración de la conexión, y en el `service` de cada feature para las consultas específicas.

**¿Puedo hacer consultas a la DB directamente desde el controller?**
No. El controller solo maneja `Request` y `Response`. Toda interacción con datos va en el service.

**¿Qué hago si necesito un tipo que comparten dos features?**
Lo defines en `src/shared/` y lo importas desde ahí en ambos features.
