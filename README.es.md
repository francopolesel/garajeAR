# GarajeAR

GarajeAR es una plataforma full-stack de gestión de vehículos y garage. Ayuda a personas y familias a registrar vehículos, mantenimiento, combustible y carga eléctrica, gastos, inspecciones, documentos, recordatorios y análisis financieros en múltiples monedas.

## Funcionalidades

- Garage multi-vehículo (autos, motos, SUV, pickups, vans, camiones, otros)
- Historial de mantenimiento con gastos vinculados
- Cargas de combustible y carga eléctrica con métricas de consumo
- Gestión de gastos con soporte multi-moneda
- Inspecciones técnicas (VTV/RTO/ITV/genéricas) con recordatorios y gastos
- Bóveda de documentos con subida/descarga segura
- Recordatorios por fecha y odómetro con centro de notificaciones
- Reportes y gráficos (gastos, categorías, vehículos, mantenimiento, energía)
- Snapshots históricos de tipo de cambio (ARS/USD, extensible)
- Análisis ajustado por inflación usando índices IPC
- Fotos de perfil de vehículos
- Inicio de sesión con Google (opcional) + correo/contraseña
- Español e inglés con formato regional
- Exportación CSV/JSON y eliminación de cuenta
- Tema claro/oscuro/sistema

## Stack tecnológico

- Frontend: React 18, TypeScript, Vite, Tailwind CSS, React Router, TanStack Query, React Hook Form + Zod, Recharts, i18next
- Backend: Node.js, TypeScript, Express, Prisma, PostgreSQL, Zod, Pino, Helmet, Multer
- Infra: Docker Compose, PostgreSQL, nginx

## Requisitos

- Node.js 20+
- PostgreSQL 16+
- npm

## Instalación

```bash
# 1. instalar dependencias
npm install

# 2. configurar entorno
cp .env.example apps/api/.env
# editar apps/api/.env (DATABASE_URL, SESSION_SECRET, etc.)

# 3. generar cliente prisma
npm run db:generate -w apps/api

# 4. aplicar migraciones
npm run db:migrate -w apps/api

# 5. cargar datos demo (opcional)
npm run db:seed -w apps/api
```

## Ejecución (desarrollo)

```bash
# terminal 1
npm run dev -w apps/api

# terminal 2
npm run dev -w apps/web
```

- Web: http://localhost:5173
- API: http://localhost:4000
- Salud: http://localhost:4000/health

## Credenciales demo (solo desarrollo)

- Correo: `demo@garajear.local`
- Contraseña: `Demo1234!`

No habilitar credenciales demo en producción.

## Tests

```bash
npm run test        # api + web
npm run typecheck   # tsc para shared/api/web
npm run lint        # eslint
npm run build       # build de producción
```

## Docker

```bash
docker compose up --build
```

Servicios: PostgreSQL (con healthcheck), API, web (nginx SPA que proxea /api a la api).

## Variables de entorno

Ver `.env.example`. Variables principales:

- `NODE_ENV` — development | production
- `DATABASE_URL` — cadena de conexión PostgreSQL
- `SESSION_SECRET` — cadena aleatoria larga
- `WEB_ORIGIN` — origen del frontend (CORS)
- `UPLOAD_DIR` — directorio de archivos
- `MAX_UPLOAD_SIZE` — bytes
- `SMTP_HOST/PORT/USER/PASSWORD`, `EMAIL_FROM` — email opcional
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL` — Google Sign-In opcional

## Configuración de Google Sign-In

1. Crear credenciales OAuth 2.0 en Google Cloud Console.
2. URI de redirección autorizada: `http://localhost:4000/api/v1/auth/google/callback` (dev) o tu callback de producción.
3. Configurar las variables de entorno. Si no se configuran, la app funciona solo con correo/contraseña y `/auth/google` devuelve 501.

## Multi-moneda e inflación

- Cada registro financiero conserva su monto y moneda original.
- Los snapshots históricos de tipo de cambio se guardan (manual o vía proveedor) con fecha de cotización, tipo de tasa, proveedor e indicador de override manual.
- Para transacciones en fin de semana/feriado se usa la última cotización válida en o antes de la fecha (política documentada).
- El ajuste por inflación usa índices IPC mensuales publicados (cargados por usuario/admin por país/serie/mes). `ajustado = nominal × índiceReferencia / índiceTransacción`.
- No se fabrican tasas ni datos de IPC; las conversiones no disponibles se informan, no se sustituyen silenciosamente.

## Internacionalización

Se soportan español e inglés de forma completa. La preferencia de idioma se persiste por usuario y se restaura entre sesiones. Todo el texto visible pasa por recursos i18n.

## Estructura del proyecto

```
apps/
  api/        Express + Prisma + PostgreSQL
  web/        React + Vite
packages/
  shared/     Tipos/constantes compartidos
docker-compose.yml
.env.example
README.md
README.es.md
```

## Licencia

MIT
