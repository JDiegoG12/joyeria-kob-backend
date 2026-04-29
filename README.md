# Joyería KOB — Backend

API REST de la plataforma Joyería KOB, construida con Express 5, TypeScript 6 y documentada con Swagger (OpenAPI 3.0).

---

## Requisitos previos

Antes de clonar el repositorio, asegúrate de tener instaladas estas versiones exactas en tu máquina:

| Herramienta | Versión requerida  | Verificar con     |
| ----------- | ------------------ | ----------------- |
| Node.js     | v22.19.0           | `node -v`         |
| npm         | v10.9.3            | `npm -v`          |
| MySQL       | v8.0+              | `mysql --version` |
| Git         | Cualquier reciente | `git --version`   |

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
DB_URL= # URL de conexión a la base de datos MySQL
JWT_SECRET=      # Clave secreta para firmar los tokens JWT
APP_URL=http://localhost:4000  # URL base para servir imágenes
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

| Comando                   | Descripción                                                                       |
| ------------------------- | --------------------------------------------------------------------------------- |
| `npm run dev`             | Inicia el servidor con `nodemon` — se reinicia automáticamente al guardar cambios |
| `npm run build`           | Compila TypeScript a JavaScript plano en la carpeta `/dist`                       |
| `npm run start`           | Ejecuta el build compilado (usar en producción)                                   |
| `npm run lint`            | Analiza el código con ESLint y reporta errores                                    |
| `npm run format`          | Formatea automáticamente todos los archivos `src/**/*.ts`                         |
| `npm run db:setup`        | Configura la base de datos: genera cliente, ejecuta migraciones y siembra datos   |
| `npm run prisma:generate` | Genera el cliente de Prisma desde el esquema                                      |
| `npm run prisma:migrate`  | Ejecuta las migraciones de base de datos                                          |
| `npm run prisma:seed`     | Siembra la base de datos con datos iniciales                                      |

---

## Stack tecnológico

| Tecnología         | Versión  | Rol                                          |
| ------------------ | -------- | -------------------------------------------- |
| Node.js            | v22.19.0 | Entorno de ejecución                         |
| TypeScript         | ^5.9.3   | Tipado estático                              |
| Express            | ^5.2.1   | Framework HTTP                               |
| Prisma             | ^4.16.2  | ORM para base de datos                       |
| MySQL              | v8.0+    | Base de datos relacional                     |
| swagger-jsdoc      | ^6.2.8   | Genera la spec OpenAPI desde anotaciones     |
| swagger-ui-express | ^5.0.1   | Sirve la UI interactiva de Swagger           |
| Axios              | ^1.14.0  | Cliente HTTP para consumo de APIs externas   |
| ESLint             | ^9.10.0  | Análisis estático de código                  |
| Prettier           | ^3.3.3   | Formateo de código                           |
| Husky              | ^9.1.7   | Git hooks automáticos                        |
| commitlint         | ^19.8.0  | Validación de mensajes de commit             |
| nodemon            | ^3.1.14  | Reinicio automático en desarrollo            |
| ts-node            | ^10.9.2  | Ejecuta TypeScript directamente sin compilar |
| Multer             | ^1.4.5   | Middleware para recepción de archivos        |

---

## Gestión de Imágenes (Almacenamiento Local en Hostinger)

Para maximizar el uso del almacenamiento de Hostinger y garantizar una carga ultra-rápida (UX Premium), el backend no guarda imágenes crudas. Sigue este flujo:

1.  **Recepción**: `Multer` recibe los archivos en memoria.
2.  **Procesamiento**: `Sharp` redimensiona a 1000px y convierte a formato `.webp` (80% calidad).
3.  **Persistencia**: Se guardan en `public/uploads/products/`.
4.  **Acceso**: Las imágenes son servidas como estáticos a través de la ruta `/uploads`.

> **Nota para producción**: Asegúrate de que la carpeta `public/uploads` tenga permisos de escritura en tu servidor Hostinger.

---

## Estructura de carpetas

```
public/
└── uploads/         # Archivos multimedia (joyas) guardados localmente
prisma/
├── schema.prisma    # Esquema de la base de datos y configuración de Prisma
└── seed.ts          # Script para sembrar datos iniciales
src/
├── api/
│   ├── app.ts              # Configuración de Express, middlewares y registro de rutas
│   └── middlewares/        # Middlewares transversales (auth, manejo de errores)
├── config/
│   └── swagger.config.ts   # Configuración central de Swagger/OpenAPI
├── features/               # Módulos de negocio — uno por cada dominio
│   ├── categories/         # Gestión de categorías jerárquicas
│   │   ├── controllers/    # Maneja Request/Response, llama al facade.
│   │   ├── facade/         # Implementa la interfaz, orquesta la lógica de negocio.
│   │   ├── ports/          # Define las interfaces (contratos) del módulo.
│   │   ├── services/       # Lógica de acceso a datos (consultas Prisma).
│   │   └── routes.ts       # Define endpoints y contiene anotaciones @openapi
│   │   └── tests/          # Pruebas unitarias y de integración.
│   ├── products/           # Ejemplo: gestión de joyas del catálogo
│   │   ├── controllers/    # Maneja Request/Response, llama al service.
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

- **Imágenes**: El nombre del archivo guardado en DB debe ser un UUID. Nunca usar el nombre original del cliente.
- **Precios**: El `calculatedPrice` siempre debe ser procesado en el `service` antes de persistir, nunca enviado directamente por el cliente.
- **Early Return**: Validar la existencia de archivos y campos obligatorios al inicio de cada función.
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
  "data": {
    "id": "uuid",
    "name": "Anillo Zafiro",
    "images": ["uuid.webp"]
  },
  "message": "Joya creada correctamente."
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

## Preguntas frecuentes

**¿Cómo accedo a las imágenes subidas?**
Usa la URL base configurada en `.env` seguida de la ruta: `${APP_URL}/uploads/products/nombre-archivo.webp`.

**¿Por qué mis imágenes pesan tan poco?**
Gracias a `Sharp`, las imágenes se procesan para pesas un ~70% menos que el original sin pérdida de calidad perceptible, optimizando el ancho de banda del servidor.

**¿Qué pasa si borro la carpeta `public/uploads`?**
Perderás todas las fotos de las joyas de forma permanente. Realiza backups periódicos de esta carpeta en Hostinger.

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

## Configuración de la base de datos con Prisma

Este proyecto utiliza Prisma como ORM para interactuar con MySQL. Prisma maneja las migraciones, el esquema de la base de datos y la generación de tipos TypeScript.

### Primeros pasos con la base de datos

Después de configurar el `.env` con `DB_URL`, ejecuta:

```bash
# 1. Generar el cliente de Prisma (necesario después de cambiar el esquema)
npm run prisma:generate

# 2. Ejecutar migraciones para crear las tablas
npm run prisma:migrate

# 3. (Opcional) Sembrar datos iniciales
npm run prisma:seed
# 4. Llena tu base de datos con datos de ejemplo y copia archivos relacionados.
npm run db:seed
```

O usa el comando combinado:

```bash
npm run db:setup
```

### Esquema de la base de datos

El esquema está definido en `prisma/schema.prisma`. Incluye modelos para categorías jerárquicas y está configurado para MySQL.

### Comandos útiles de Prisma

- `npx prisma studio`: Abre una interfaz web para explorar la base de datos
- `npx prisma db push`: Sincroniza el esquema con la base de datos (desarrollo)
- `npx prisma migrate dev`: Crea y aplica una nueva migración
- `npx prisma generate`: Regenera el cliente después de cambios en el esquema

---

## Módulo de categorías

La carpeta `src/features/categories/` contiene la implementación completa del módulo de categorías usando Prisma como ORM y MySQL como base de datos. Incluye operaciones CRUD completas con soporte para jerarquía de categorías (padre-hijo).

**Este módulo es el ejemplo de referencia para la arquitectura del proyecto.** Demuestra la implementación completa de un feature con conexión a base de datos, validaciones de negocio y documentación.

| Endpoint                       | Método   | Descripción                    |
| ------------------------------ | -------- | ------------------------------ |
| `/api/categories`              | `GET`    | Listar todas las categorías    |
| `/api/categories/:id`          | `GET`    | Obtener una categoría por ID   |
| `/api/categories/:id/children` | `GET`    | Obtener subcategorías directas |
| `/api/categories`              | `POST`   | Crear una nueva categoría      |
| `/api/categories/:id`          | `PUT`    | Actualizar una categoría       |
| `/api/categories/:id`          | `DELETE` | Eliminar una categoría         |

Este módulo demuestra la arquitectura completa del proyecto con las siguientes capas:

- **Controller**: Maneja las peticiones HTTP y delega la lógica al facade.
- **Facade**: Implementa la interfaz del `port`. Orquesta la lógica de negocio, realiza validaciones y maneja errores.
- **Port**: Define la interfaz (el contrato) que el facade debe cumplir, permitiendo la inversión de dependencias.
- **Service**: Contiene la lógica de acceso a datos, interactuando directamente con la base de datos a través de Prisma.
- **Routes**: Define los endpoints y contiene la documentación OpenAPI/Swagger.

---

## Pruebas (Testing)

El proyecto utiliza **Jest** como framework de pruebas para garantizar la calidad y el correcto funcionamiento del código. Se incluyen tanto pruebas unitarias como de integración.

### Ejecutar las pruebas

Para ejecutar toda la suite de pruebas, utiliza el siguiente comando:

```bash
npm test
```

Esto buscará todos los archivos con la extensión `.test.ts` y los ejecutará.

### Estructura y Filosofía de Pruebas

- **Pruebas Unitarias**: Se centran en componentes aislados (ej. una función en un `service` o `facade`). Utilizan `mocks` para simular dependencias (como la base de datos) y asegurar que el componente se prueba de forma aislada.
- **Pruebas de Integración**: Verifican que varios componentes funcionan juntos correctamente. Por ejemplo, simulan una petición HTTP a un endpoint y comprueban la respuesta final, recorriendo todas las capas (controller, facade, service).

Todos los nuevos `features` o correcciones de `bugs` deben ir acompañados de sus respectivas pruebas.

---

## Arquitectura de Puertos y Fachadas

El `feature` de `categories` introduce un patrón de diseño basado en **Puertos y Adaptadores (Ports and Adapters)**, utilizando una **Fachada (Facade)** como punto de entrada a la lógica de negocio. Esta arquitectura promueve un código más limpio, desacoplado y fácil de mantener.

### Puertos (`ports`)

La carpeta `src/features/categories/ports/` define los **contratos** (interfaces de TypeScript) que la lógica de negocio debe cumplir. El archivo clave es `category.ports.ts`, que contiene la interfaz `ICategoryFacade`.

```typescript
// src/features/categories/ports/category.ports.ts

export interface ICategoryFacade {
  getAllCategories(): Promise<FacadeResult<CategoryWithRelations[]>>;
  getCategoryById(id: number): Promise<FacadeResult<CategoryWithRelations>>;
  createCategory(data: CreateCategoryInput): Promise<FacadeResult<Category>>;
  // ... y otros métodos
}
```

- **¿Qué es un puerto?** Es una definición agnóstica de la tecnología. La interfaz `ICategoryFacade` define "lo que el sistema debe hacer" (el qué), pero no "cómo lo hace".
- **Beneficio**: Permite que los `controllers` dependan de esta abstracción (`ICategoryFacade`) en lugar de una implementación concreta. Esto facilita las pruebas y permite cambiar la implementación interna sin afectar a los `controllers`.

### Fachada (`facade`)

La carpeta `src/features/categories/facade/` contiene la **implementación** concreta del puerto. El archivo `category.facade.ts` implementa la interfaz `ICategoryFacade`.

- **¿Qué es una fachada?** Es una clase que actúa como punto de entrada único y simplificado a la lógica de negocio de un `feature`. Orquesta las llamadas a uno o más `services`, realiza validaciones de negocio complejas y maneja la lógica de errores.
- **Flujo de una petición**:
  1. El `Controller` recibe la petición HTTP.
  2. El `Controller` llama a un método de la `Facade` (a través de la interfaz del puerto).
  3. La `Facade` llama al `Service` para interactuar con la base de datos.
  4. La `Facade` procesa el resultado, maneja posibles errores y lo devuelve al `Controller`.

Este patrón es el preferido para todos los nuevos `features` que contengan lógica de negocio compleja.

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
| Carpetas y archivos   | `kebab-case`       | `.ts`                      |
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
