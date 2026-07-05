# SEO-DEPLOY — Guía de despliegue del pre-render

Guía de referencia para desplegar y operar el **pre-render estático** que resuelve
los errores de indexación de Google Search Console (páginas con redirección,
descubiertas sin indexar, alternate con canonical).

La regeneración periódica la hace un **timer interno en la app Node** (el cron de
sistema está **deshabilitado** en el plan de Hostinger). Ver
[Regeneración automática](#regeneración-automática-timer-interno).

---

# 🚀 Quick start

> Antes de empezar, confirma que el `.env` del backend
> (`/home/u708472935/domains/api.joyeriakob.com/public_html/.builds/config/.env`)
> tiene `DB_URL` (BD de prod), `FRONTEND_PUBLIC_URL=https://www.joyeriakob.com` y
> `API_PUBLIC_URL=https://api.joyeriakob.com` (NO valores localhost). Ver
> [Variables de entorno](#variables-de-entorno).

```bash
# ── 1. BACKEND: deploy + build + REINICIAR ──────────────────────────────
#     Deploy habitual (git + build) y reinicia la app Node desde hPanel.
#     Al reiniciar, el TIMER INTERNO regenera el pre-render automáticamente
#     (on-boot) y luego cada 6h. No hay cron que configurar.

# ── 2. FRONTEND: deploy habitual por Git de hPanel ──────────────────────
#     (trae el .htaccess sin 302 + robots.txt → sitemap www)

# ── 3. Regenerar con los hashes nuevos de Vite (MANUAL, tras deploy front) ──
cd /home/u708472935/domains/api.joyeriakob.com/nodejs && \
  /opt/alt/alt-nodejs20/root/usr/bin/node \
  --env-file=/home/u708472935/domains/api.joyeriakob.com/public_html/.builds/config/.env \
  dist/src/features/render/prerender/prerender.cli.js

# ── 4. Verificar ────────────────────────────────────────────────────────
ls -l /home/u708472935/domains/joyeriakob.com/public_html/prerender/producto/ | head
curl -sI https://www.joyeriakob.com/catalogo                 # HTTP 200, sin 301/302
curl -s  https://www.joyeriakob.com/catalogo | grep -iE '<title>|rel="canonical"'
curl -sI https://www.joyeriakob.com/sitemap.xml              # 200, application/xml
curl -sI http://joyeriakob.com/catalogo | grep -i location   # un solo 301 → https://www...
```

## ‼️ RECORDATORIO PERMANENTE — lo más fácil de olvidar

> **Tras CADA redeploy de código del frontend, corre UNA vez el comando manual**
> (paso 3 del Quick start):
> ```bash
> cd /home/u708472935/domains/api.joyeriakob.com/nodejs && \
>   /opt/alt/alt-nodejs20/root/usr/bin/node \
>   --env-file=/home/u708472935/domains/api.joyeriakob.com/public_html/.builds/config/.env \
>   dist/src/features/render/prerender/prerender.cli.js
> ```
> **Por qué:** los `.html` pre-renderizados incrustan los nombres **con hash** de
> los assets de Vite; al reconstruir el front esos hashes cambian y los `.html`
> viejos apuntan a JS/CSS inexistente → **sitio roto para los usuarios** hasta
> regenerar. El timer interno lo arreglaría en la próxima corrida (≤6h), pero deja
> una ventana larga; por eso se hace manual e inmediato tras el deploy del front.
>
> ✅ **Publicar productos NO requiere este paso** — el timer interno (cada 6 h) lo
> cubre solo. El paso manual es SOLO cuando cambias código del frontend.

---

## Cómo funciona (resumen)

El sitio es una SPA (React + Vite) servida por Apache/LiteSpeed en Hostinger. Los
crawlers no ejecutan bien el JS, así que el **backend genera un HTML estático por
cada ruta pública** (home, catálogo, las 4 de `/informacion/*`, y una por
producto) y los **escribe directamente en el `public_html` del frontend**,
aprovechando que backend y frontend comparten filesystem (mismo usuario Linux).

- Frontend público: `/home/u708472935/domains/joyeriakob.com/public_html`
- Backend Node (app): `/home/u708472935/domains/api.joyeriakob.com/nodejs`
- `.env` del backend: `/home/u708472935/domains/api.joyeriakob.com/public_html/.builds/config/.env`

Apache sirve esos `.html` en la **misma URL con 200** (sin redirect). Si un `.html`
aún no existe (producto recién publicado), la petición cae al `index.html` de la
SPA (fallback). Un **timer interno** (ver abajo) regenera todo cada 6 h, así que
publicar productos desde la app **no requiere ninguna intervención manual**.

Reglas relevantes:
- `.htaccess` del frontend: 301 no-www→www (primero) + servido estático de
  `/prerender/*.html` con `RewriteCond -f` + fallback SPA.
- `robots.txt`: `Sitemap: https://www.joyeriakob.com/sitemap.xml` (mismo host).

El generador vive en `src/features/render/prerender/` y reutiliza la lógica de
render existente (`render.service`, `render.view`, `html.util`, `sitemap`). La
función `runPrerender()` (en `prerender.generator.ts`) es el punto de entrada
compartido por el CLI y el timer.

---

## Regeneración automática (timer interno)

Como el cron de sistema está deshabilitado en el plan, la propia app Node
(proceso persistente, siempre activo) regenera el pre-render:

- **Al arrancar** la app (on-boot), y luego **cada `PRERENDER_INTERVAL_HOURS`**
  (default 6) con `setInterval`. Ver `src/features/render/prerender/prerender.scheduler.ts`,
  arrancado desde `src/index.ts` tras `app.listen`.
- Corre **dentro** de la app, así que ya dispone de las env que Hostinger inyecta
  (DB_URL, etc.) — **no** necesita `dotenv` ni `--env-file`.
- **Robusto:** cada corrida va en try/catch; un fallo (p. ej. BD caída) se loguea
  y **no** tumba el servidor ni detiene el timer. Un flag `isRunning` evita
  solapamientos si una corrida tarda más que el intervalo. El timer usa `unref()`.

**Logs del timer:** salen por el stdout/stderr de la app → **logs de la app Node
en hPanel** (no hay archivo de cron separado). Busca líneas `[prerender] ...`:
```
[prerender] scheduler activo: cada 6h (on-boot=true)
[prerender] 2026-07-03T12:00:01.234Z · 6 páginas + N productos en 1.2s
```

**Interruptores (env, para apagarlo sin redeploy):**

| Variable | Default | Efecto |
|---|---|---|
| `PRERENDER_INTERVAL_HOURS` | `6` | Horas entre regeneraciones. |
| `PRERENDER_ON_BOOT` | `true` | `false` → no regenerar al arrancar. |
| `PRERENDER_TIMER_ENABLED` | `true` | `false` → desactiva el intervalo periódico. |

---

## Variables de entorno

El **timer interno** hereda las variables que Hostinger inyecta al proceso Node,
así que no necesita nada especial. El **CLI manual por SSH** se ejecuta FUERA de
la app y por eso se corre con `--env-file=<ruta al .env>` (ver el comando del
paso 3). Todas deben existir en el `.env` del backend:
`/home/u708472935/domains/api.joyeriakob.com/public_html/.builds/config/.env`

| Variable | Obligatoria | Default en código | Para qué |
|---|---|---|---|
| `DB_URL` | **Sí** | — | Conexión Prisma (productos, categorías, precios). ⚠️ Se llama `DB_URL`, **no** `DATABASE_URL`. |
| `FRONTEND_PUBLIC_DIR` | Recomendada | `/home/u708472935/domains/joyeriakob.com/public_html` | Dónde escribir los `.html` y el `sitemap.xml`. |
| `FRONTEND_PUBLIC_URL` | Recomendada | `https://www.joyeriakob.com` | Base de URLs canónicas / `og:url` / enlaces del sitemap. |
| `API_PUBLIC_URL` | Recomendada | `https://api.joyeriakob.com` | Base de URLs de imágenes (`og:image`, `<img>`). |
| `PRERENDER_INTERVAL_HOURS` / `PRERENDER_ON_BOOT` / `PRERENDER_TIMER_ENABLED` | No | `6` / `true` / `true` | Control del timer interno (ver arriba). |

---

## Secuencia de deploy completa (ordenada)

El objetivo es que los `.html` existan (con los hashes de Vite correctos) sin
dejar ventana de degradación SEO. El fallback SPA cubre cualquier hueco sin
romper nada para los usuarios (solo meta genérica temporal para bots).

### 1. Desplegar el BACKEND y reiniciar
Deploy habitual (git + build) del repo `joyeria-kob-backend`, luego **reinicia la
app Node** desde hPanel (Node.js app → Restart). El build debe generar
`dist/src/features/render/prerender/prerender.cli.js`.

Al reiniciar, el **timer interno regenera el pre-render on-boot** contra el
frontend actualmente desplegado.

### 2. Desplegar el FRONTEND
Deploy habitual por Git de hPanel del repo `joyeria-kob-frontend`. Incluye el
nuevo `.htaccess` (sin 302) + `robots.txt` (Sitemap → www).

### 3. Regenerar con los hashes nuevos (MANUAL)
Como el deploy del front pudo cambiar los hashes de Vite, regenera para que los
`.html` los tomen (comando validado):
```bash
cd /home/u708472935/domains/api.joyeriakob.com/nodejs && \
  /opt/alt/alt-nodejs20/root/usr/bin/node \
  --env-file=/home/u708472935/domains/api.joyeriakob.com/public_html/.builds/config/.env \
  dist/src/features/render/prerender/prerender.cli.js
```
Crea/actualiza `public_html/prerender/**/*.html` y `public_html/sitemap.xml`.

### 4. Verificar (ver sección "Verificación")

> No hay paso de cron: la regeneración periódica la hace el timer interno de la
> app (paso 1).

---

## Verificación

```bash
# 1. Existen los .html generados
ls -l /home/u708472935/domains/joyeriakob.com/public_html/prerender/
ls -l /home/u708472935/domains/joyeriakob.com/public_html/prerender/producto/ | head

# 2. Permisos legibles por Apache (deben ser -rw-r--r--, 0644)
stat -c '%a %n' /home/u708472935/domains/joyeriakob.com/public_html/prerender/catalogo.html

# 3. La ruta pública sirve el pre-render con 200 (sin redirect) y SEO real
curl -s https://www.joyeriakob.com/catalogo | grep -iE '<title>|rel="canonical"'
curl -sI https://www.joyeriakob.com/catalogo        # HTTP/2 200 (no 301/302)

# 4. Un producto concreto (usa un slug real del catálogo)
curl -s https://www.joyeriakob.com/producto/<slug-real> | grep -iE '<title>|canonical|application/ld'

# 5. Sitemap servido desde el mismo host, 200 y XML
curl -sI https://www.joyeriakob.com/sitemap.xml      # Content-Type: application/xml

# 6. Canonicalización 301 (un solo salto a https://www)
curl -sI http://joyeriakob.com/catalogo | grep -i location

# 7. Log del timer: en los logs de la app Node de hPanel, busca "[prerender]"
```

Salida esperada del log del pre-render en cada corrida:
```
[prerender] 2026-07-03T12:00:01.234Z · 6 páginas + N productos en 1.2s
```

---

## Troubleshooting

- **`curl /catalogo` devuelve el index.html genérico (título "Joyería KOB"):** el
  `.html` no existe aún → corre el comando manual del paso 3, o reinicia la app
  (regenera on-boot). Si persiste, revisa `FRONTEND_PUBLIC_DIR`.
- **El timer no genera nada / log con error de conexión:** falta `DB_URL` (u otra
  var) en el `.env`, o el `.cli.js` no existe (falta el build). Revisa los logs
  de la app Node en hPanel (`[prerender] ... ERROR ...`).
- **El CLI manual falla con error de conexión a BD:** falta el `--env-file` o
  apunta a un `.env` incorrecto (el CLI, al correr fuera de la app, no hereda las
  env de Hostinger).
- **`No se pudo leer el shell del frontend`:** `FRONTEND_PUBLIC_DIR` mal apuntado
  o el frontend no está desplegado (`index.html` ausente).
- **JS roto para usuarios tras un deploy del frontend:** olvidaste el paso manual
  de regeneración (assets-stale). Corre el comando del paso 3.
- **Un producto retirado sigue accesible:** el timer purga su `.html` en la
  siguiente corrida (≤6h); para forzarlo, corre el comando manual.
- **Apagar el pre-render sin redeploy:** pon `PRERENDER_TIMER_ENABLED=false` (y/o
  `PRERENDER_ON_BOOT=false`) en el `.env` y reinicia la app.
