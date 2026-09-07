# Directorio Telefónico ITSON

Aplicación web para consultar y administrar las extensiones telefónicas del
Instituto Tecnológico de Sonora: búsqueda pública, panel administrativo
(extensiones, personas, áreas, ubicaciones), historial de cambios e
importación masiva desde Excel/CSV.

> El documento original (`docs/SPEC.md`) especificaba React+Vite / ASP.NET
> Core / SQL Server. Ese stack no es desplegable en Vercel + Neon, así que
> se adaptó a **Next.js + PostgreSQL (Neon) + Prisma**, manteniendo intacto
> el resto de la especificación (modelo de datos, reglas de negocio, rutas,
> API, criterios de aceptación). El razonamiento completo de esa
> sustitución está en [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **PostgreSQL** en **Neon** (serverless) vía **Prisma 7** (`@prisma/adapter-neon`)
- **Auth.js (NextAuth v5)** — sesión JWT respaldada por la tabla `Usuario`
- **Zod** para validación, **Tailwind CSS v4** para estilos
- **Vitest** + Testing Library para pruebas
- Documentación de API con **OpenAPI/Swagger** en `/docs`

## Requisitos

- Node.js 20+
- Una base de datos PostgreSQL en [Neon](https://neon.tech) (plan gratuito es suficiente)

## Puesta en marcha local

```bash
npm install
cp .env.example .env   # completa DATABASE_URL, DIRECT_URL y AUTH_SECRET
npm run db:migrate      # crea las tablas
npm run db:seed         # usuario administrador + datos iniciales (spec sección 21)
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000). El usuario administrador
inicial se imprime en la consola al correr `db:seed` — **cámbialo después de
iniciar sesión** (no hay pantalla de "cambiar contraseña" en el MVP; se
actualiza directamente en la base de datos o vía Prisma Studio: `npm run db:studio`).

Ver [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) para el paso a paso de Neon + Vercel.

## Scripts

| Script | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | `prisma generate && prisma migrate deploy && next build` — el mismo comando corre en Vercel |
| `npm run test` | Corre la suite de Vitest una vez |
| `npm run test:watch` | Vitest en modo watch |
| `npm run db:migrate` | Crea una migración a partir de `prisma/schema.prisma` (uso local) |
| `npm run db:deploy` | Aplica migraciones pendientes sin generar una nueva (uso en despliegue) |
| `npm run db:seed` | Usuario administrador + datos iniciales |
| `npm run db:studio` | Explorador visual de datos de Prisma |

## Documentación

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — arquitectura, capas, decisiones y su justificación
- [`docs/DATABASE.md`](docs/DATABASE.md) — modelo de datos, reglas de negocio, seed
- [`docs/API.md`](docs/API.md) — endpoints REST, sobre de respuesta, roles (también en `/docs` con Swagger UI)
- [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) — Neon + Vercel paso a paso
- [`docs/SPEC.md`](docs/SPEC.md) — especificación funcional original

## Estado del MVP

Cubre las secciones 1–24 y 27–29 de la especificación (búsqueda, CRUD de
extensiones/personas/áreas/ubicaciones, asignaciones múltiples/compartidas,
extensiones sin persona, historial, importación con vista previa,
autenticación por roles, Swagger). QR (25) y directorio imprimible (26) se
dejan preparados en el modelo de datos pero no implementados, tal como
permite el documento original.
