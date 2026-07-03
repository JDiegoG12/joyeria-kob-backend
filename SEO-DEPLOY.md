# SEO-DEPLOY — Guía de despliegue del pre-render

Guía de referencia para desplegar y operar el **pre-render estático** que resuelve
los errores de indexación de Google Search Console (páginas con redirección,
descubiertas sin indexar, alternate con canonical).

---

# 🚀 Quick start

> Los detalles de cada paso están más abajo. Antes de empezar, confirma que el
> `.env` **del servidor** tiene `DB_URL` (BD de prod), `FRONTEND_PUBLIC_URL=https://www.joyeriakob.com`
> y `API_PUBLIC_URL=https://api.joyeriakob.com` (NO valores localhost). Ver
> [Variables de entorno](#variables-de-entorno-en-el-env-del-backend).

```bash
# ── 1. BACKEND: pull + build + reiniciar ────────────────────────────────
cd /home/u708472935/domains/api.joyeriakob.com
git pull
npm ci
npm run build                      # genera dist/src/.../prerender.cli.js
mkdir -p logs                      # carpeta de logs del cron (una sola vez)
# reiniciar la app Node desde hPanel (Node.js app → Restart)

# ── 2. FRONTEND: deploy habitual por Git de hPanel ──────────────────────
#     (trae el .htaccess sin 302 + robots.txt → sitemap www)

# ── 3. Generar el pre-render por primera vez ────────────────────────────
cd /home/u708472935/domains/api.joyeriakob.com && npm run prerender

# ── 4. CRON en hPanel → Cron Jobs ───────────────────────────────────────
#     Frecuencia: 0 */6 * * *
#     Comando:
#     cd /home/u708472935/domains/api.joyeriakob.com && npm run prerender >> /home/u708472935/domains/api.joyeriakob.com/logs/prerender.log 2>&1

# ── 5. Verificar ────────────────────────────────────────────────────────
ls -l /home/u708472935/domains/joyeriakob.com/public_html/prerender/producto/ | head
curl -sI https://www.joyeriakob.com/catalogo                 # HTTP 200, sin 301/302
curl -s  https://www.joyeriakob.com/catalogo | grep -iE '<title>|rel="canonical"'
curl -sI https://www.joyeriakob.com/sitemap.xml              # 200, application/xml
curl -sI http://joyeriakob.com/catalogo | grep -i location   # un solo 301 → https://www...
```

## ‼️ RECORDATORIO PERMANENTE — lo más fácil de olvidar

> **Tras CADA redeploy de código del frontend, corre UNA vez:**
> ```bash
> cd /home/u708472935/domains/api.joyeriakob.com && npm run prerender
> ```
> **Por qué:** los `.html` pre-renderizados incrustan los nombres **con hash** de
> los assets de Vite; al reconstruir el front esos hashes cambian y los `.html`
> viejos apuntan a JS/CSS inexistente → **sitio roto para los usuarios** hasta
> regenerar.
>
> ✅ **Publicar productos NO requiere este paso** — el cron (cada 6 h) lo cubre
> solo. El paso manual es SOLO cuando cambias código del frontend.

---

## Cómo funciona (resumen)

El sitio es una SPA (React + Vite) servida por Apache/LiteSpeed en Hostinger. Los
crawlers no ejecutan bien el JS, así que el **backend genera un HTML estático por
cada ruta pública** (home, catálogo, las 4 de `/informacion/*`, y una por
producto) y los **escribe directamente en el `public_html` del frontend**,
aprovechando que backend y frontend comparten filesystem (mismo usuario Linux).

- Frontend público: `/home/u708472935/domains/joyeriakob.com/public_html`
- Backend Node: `/home/u708472935/domains/api.joyeriakob.com/`

Apache sirve esos `.html` en la **misma URL con 200** (sin redirect). Si un `.html`
aún no existe (producto recién publicado), la petición cae al `index.html` de la
SPA (fallback). Un **cron** regenera todo cada 6 h, así que publicar productos
desde la app **no requiere ninguna intervención manual**.

Reglas relevantes:
- `.htaccess` del frontend: 301 no-www→www (primero) + servido estático de
  `/prerender/*.html` con `RewriteCond -f` + fallback SPA.
- `robots.txt`: `Sitemap: https://www.joyeriakob.com/sitemap.xml` (mismo host).

El generador vive en `src/features/render/prerender/` y reutiliza la lógica de
render existente (`render.service`, `render.view`, `html.util`, `sitemap`).

---

## Variables de entorno (en el `.env` del backend)

⚠️ **El cron NO hereda las variables que hPanel inyecta al proceso Node del
panel.** Por eso `prerender.cli.ts` hace `import 'dotenv/config'` y **todas** deben
estar en el archivo `.env` del backend
(`/home/u708472935/domains/api.joyeriakob.com/.env`).

| Variable | Obligatoria | Default en código | Para qué la usa el pre-render |
|---|---|---|---|
| `DB_URL` | **Sí** | — | Conexión Prisma (leer productos, categorías, precios). Sin ella, falla. |
| `FRONTEND_PUBLIC_DIR` | Recomendada | `/home/u708472935/domains/joyeriakob.com/public_html` | Dónde escribir los `.html` y el `sitemap.xml`. El default ya es la ruta de prod; se recomienda fijarla explícita. |
| `FRONTEND_PUBLIC_URL` | Recomendada | `https://www.joyeriakob.com` | Base de las URLs canónicas / `og:url` / enlaces del sitemap. |
| `API_PUBLIC_URL` | Recomendada | `https://api.joyeriakob.com` | Base de las URLs de imágenes (`og:image`, `<img>`). |

> El resto de variables del `.env` (JWT, Resend, etc.) no las usa el generador.

---

## Secuencia de deploy completa (ordenada)

Ejecutar en este orden. El objetivo es que los `.html` existan (con los hashes de
Vite correctos) **cuando** el `.htaccess` deja de hacer el 302, para no dejar
ventana de degradación SEO.

### 1. Desplegar el BACKEND y compilar
```bash
cd /home/u708472935/domains/api.joyeriakob.com
git pull
npm ci                 # o npm install si cambió package.json
npm run build          # IMPRESCINDIBLE: genera dist/src/.../prerender.cli.js
# reiniciar la app Node desde hPanel (o el método habitual)
```

### 2. Desplegar el FRONTEND
```bash
# Deploy habitual por Git de hPanel del repo joyeria-kob-frontend.
# Incluye el nuevo .htaccess (sin 302) + robots.txt (Sitemap → www).
```

### 3. Generar el pre-render por primera vez (manual)
```bash
cd /home/u708472935/domains/api.joyeriakob.com && npm run prerender
```
Esto crea `public_html/prerender/**/*.html` y `public_html/sitemap.xml` contra el
`index.html` recién desplegado (hashes correctos).

### 4. Configurar el CRON en hPanel
hPanel → **Cron Jobs** → añadir:
- **Frecuencia:** cada 6 horas → `0 */6 * * *`
- **Comando:**
  ```bash
  cd /home/u708472935/domains/api.joyeriakob.com && npm run prerender >> /home/u708472935/domains/api.joyeriakob.com/logs/prerender.log 2>&1
  ```
  Alternativa sin `npm` (usa el mismo binario `node` que la app del panel):
  ```bash
  cd /home/u708472935/domains/api.joyeriakob.com && node dist/src/features/render/prerender/prerender.cli.js >> /home/u708472935/domains/api.joyeriakob.com/logs/prerender.log 2>&1
  ```

### 5. Verificar (ver sección "Verificación")

---

## Paso manual tras CADA redeploy del FRONTEND ⚠️

**Después de cada deploy de código del frontend, corre una vez:**
```bash
cd /home/u708472935/domains/api.joyeriakob.com && npm run prerender
```

### ¿Por qué es necesario este paso?

Los `.html` pre-renderizados **incrustan los nombres con hash de los assets de
Vite** (`/assets/index-XXXXXXXX.js`, `.css`), copiados del `index.html` en el
momento de generarlos. Cuando redespliegas el frontend (cambio de código →
`vite build` → **hashes nuevos**), los `.html` viejos apuntan a assets que ya no
existen → **JS roto para los usuarios** hasta la próxima regeneración.

Regenerar tras el deploy actualiza los `.html` con los hashes nuevos y cierra esa
ventana. (El cron de 6 h lo arreglaría solo, pero deja una ventana larga; por eso
se hace manual e inmediato.)

**Importante — esto SOLO aplica al redeploy de código del frontend.** Cuando los
dueños **publican productos** desde la app, el frontend no cambia, los hashes son
los mismos, y el cron regenera sin problema. **La operación normal de la joyería
no requiere ninguna acción manual.**

> Opcional a futuro: como comparten filesystem, el backend podría vigilar
> `public_html/index.html` con `fs.watch` y auto-regenerar al detectar un deploy
> del front. No implementado; hoy el paso es manual.

---

## Verificación (post-generación)

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

# 7. Log del cron (tras la primera corrida programada)
tail -n 20 /home/u708472935/domains/api.joyeriakob.com/logs/prerender.log
```

Salida esperada del log en cada corrida:
```
[prerender] 2026-07-03T12:00:01.234Z · 6 páginas + N productos en 1.2s
```

---

## Troubleshooting

- **`curl /catalogo` devuelve el index.html genérico (título "Joyería KOB"):** el
  `.html` no existe aún → corre `npm run prerender`. Si persiste, revisa que
  `FRONTEND_PUBLIC_DIR` apunte al `public_html` correcto.
- **El cron no genera nada / log con error de conexión:** falta `DB_URL` (u otra
  var) en el `.env` del backend, o el `.cli.js` no existe (falta `npm run build`).
- **`No se pudo leer el shell del frontend`:** `FRONTEND_PUBLIC_DIR` mal apuntado
  o el frontend no está desplegado (`index.html` ausente).
- **JS roto para usuarios tras un deploy del frontend:** olvidaste el paso manual
  de regeneración (assets-stale). Corre `npm run prerender`.
- **Un producto retirado sigue accesible:** el cron purga su `.html` en la
  siguiente corrida; para forzarlo, `npm run prerender`.
