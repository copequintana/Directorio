# Arquitectura

## 1. Por qué se cambió el stack

`docs/SPEC.md` (sección 2) pedía React+Vite / ASP.NET Core / SQL Server /
Entity Framework Core. El requisito del proyecto es publicarlo en **Vercel**
con base de datos en **Neon**, y esa combinación no es viable ahí:

- Vercel no tiene un runtime nativo para ASP.NET Core (sí para Node.js,
  Python, Go, Ruby y Edge Functions en JS/TS).
- Neon es PostgreSQL serverless, no SQL Server.

La spec misma (sección 31) pide no cambiar tecnologías principales sin
justificarlo y reutilizar lo que ya exista en el repo — el repo estaba
vacío, así que la decisión fue: cambiar **solo** lo que Vercel+Neon obligan
a cambiar (lenguaje/runtime de backend, motor de base de datos, ORM) y
preservar todo lo demás que la spec sí pudo especificar con independencia
del stack: el modelo de datos (sección 5), las reglas de negocio (sección
6), las rutas de frontend (9-16), el inventario de endpoints REST (17), el
sobre de respuesta (18) y los criterios de aceptación (28).

Se evaluaron dos formas de lograrlo:

1. **Vite (SPA) + API Node/Express separada**, respetando literalmente las
   carpetas `/frontend` `/backend` de la sección 32.
2. **Next.js full-stack** (App Router): UI y API en un solo proyecto.

Se eligió **Next.js** porque es el stack con el que Vercel tiene cero
fricción de despliegue (Vercel es el mismo equipo que mantiene Next.js), y
porque las carpetas `/frontend`/`/backend` de la sección 32 son un detalle
de organización de directorios, no un requisito funcional — la sección 3
("arquitectura desacoplada") se preserva en espíritu separando claramente
capas dentro del proyecto (ver §2), aunque físicamente vivan en un solo
repo/proceso.

| Pieza de la spec original | Reemplazo | Por qué |
|---|---|---|
| React + Vite | Next.js (App Router) + React | Despliegue nativo en Vercel, sigue siendo React |
| ASP.NET Core / .NET 8 | Route Handlers de Next.js (Node.js runtime) | Vercel no ejecuta .NET; Node sí, con cero configuración |
| SQL Server | PostgreSQL en Neon | Es la base de datos que pide el usuario |
| Entity Framework Core | Prisma 7 (`@prisma/adapter-neon`) | Migraciones + cliente tipado, el equivalente más directo a EF Core en el ecosistema Node; el adapter de Neon es el recomendado para runtimes serverless |
| JWT / Usuario propio | Auth.js (NextAuth v5), estrategia JWT, Credentials provider sobre la tabla `Usuario` | Mismo modelo de datos que pedía la spec (5.9); deja listo el hueco para añadir SSO institucional después (OIDC/SAML) sin tocar el resto |
| FluentValidation | Zod | Validación de esquema en TS, usable tanto en el servidor como en formularios de cliente |
| Swagger/OpenAPI | Documento OpenAPI 3.0 servido en `/api/docs/openapi.json`, renderizado con `swagger-ui-react` en `/docs` | Mismo resultado (criterio de aceptación #18) |

Todo lo demás — entidades, relaciones, reglas de negocio, endpoints, roles,
formato de importación, criterios de aceptación — es literalmente lo que
pedía `docs/SPEC.md`.

## 2. Capas dentro de Next.js

La spec original pedía capas `API / Application / Domain / Infrastructure`
(sección 3). Next.js colapsa "API" en archivos de ruta, pero el resto del
código sigue organizado en las mismas capas:

```
src/
  app/                        ← Presentación + "API" (controladores delgados)
    (rutas públicas: /, /extensions/[id], /login)
    admin/                    (panel administrativo, protegido)
    api/**/route.ts           (un controlador por endpoint: parsea, llama al
                               servicio, envuelve la respuesta — sin lógica
                               de negocio aquí)

  server/
    domain/                   ← Domain: schemas de Zod + tipos, sin
                               dependencias de Prisma/Next — se pueden
                               importar desde componentes de cliente sin
                               arrastrar código de servidor
    services/                 ← Application: reglas de negocio, orquesta
                               Prisma + historial dentro de transacciones
    infrastructure/           ← Infrastructure transversal: registrar
                               historial, guard de autenticación/rol,
                               errores de servicio

  lib/
    db/prisma.ts               ← Infrastructure: singleton de PrismaClient
                               con el adapter de Neon
    api-response.ts            (sobre estándar + manejo de errores de rutas)
    api-request.ts             (parseo de query/body con Zod)
    api-client.ts               ← usado por componentes de cliente para
                               llamar a la propia API con el mismo sobre

  components/, hooks/, services/, types/   ← exactamente la separación de
                               frontend que pedía la spec sección 3
                               (services/ aquí son los clientes HTTP hacia
                               la propia API, no los servicios de dominio)

prisma/
  schema.prisma, migrations/, seed.ts, seed-data.ts
```

Regla seguida en todo el código: **una ruta nunca llama a Prisma
directamente** — siempre pasa por un servicio en `server/services`, y todo
servicio que muta datos escribe su entrada de `HistorialCambios` a través de
`server/infrastructure/historial.ts` (spec 5.10 / 6.7), dentro de la misma
transacción que el cambio que la origina.

## 3. Autenticación y runtime Node vs. Edge

Next.js ejecuta el *proxy* (antes "middleware", `src/proxy.ts`) en un
runtime ligero que no soporta módulos nativos de Node (`node:path`,
`node:url`, que Prisma sí usa). Por eso la configuración de Auth.js está
partida en dos:

- `src/auth.config.ts` — config "edge-safe": callbacks de `jwt`/`session`
  únicamente, sin providers. La usa `src/proxy.ts` solo para verificar si
  existe una sesión válida.
- `src/auth.ts` — la config completa, agregando el `Credentials` provider
  (que sí necesita Prisma + bcrypt). La usan las rutas API y los Server
  Components, que corren en runtime Node.

Sin este split, cualquier import de `@/auth` en el proxy arrastra Prisma a
un runtime que no lo soporta.

## 4. Búsqueda

`GET /api/directorio/search` (spec sección 7) se resolvió con **una sola
consulta de Prisma** con filtros `OR` sobre las relaciones de `Extension`
(persona, área, puesto vía persona, ubicación, edificio, campus,
observaciones) — ver `src/server/services/search.service.ts`. Es
suficiente para el volumen de un directorio institucional (cientos o pocos
miles de extensiones). Si el volumen crece de forma relevante, la ruta de
mejora es: agregar una columna `tsvector` generada + índice GIN en
`extensiones`/`personas`, o instalar `pg_trgm` en Neon y mover esta función
a `$queryRaw`, sin cambiar el contrato del endpoint.

## 5. Importación

`src/lib/import-parsing.ts` convierte un `.xlsx`/`.csv` subido al formato
normalizado de la spec (sección 16) usando `exceljs` (xlsx) y `papaparse`
(csv) — ambos corren en el servidor (Node.js runtime de la función), no en
el navegador. El flujo analizar → vista previa → confirmar se resolvió sin
un sistema de colas/jobs (que la spec no pide y las funciones serverless de
Vercel no facilitan mantener vivo entre pasos): el análisis es síncrono
dentro de la misma request, y las filas ya estructuradas viajan de vuelta
al cliente para que el paso de confirmación las reenvíe sin tener que subir
el archivo otra vez. Ver `docs/DATABASE.md` para las reglas de
deduplicación/ambigüedad.
