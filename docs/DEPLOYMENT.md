# Despliegue: Neon + Vercel

## 1. Crear la base de datos en Neon

1. Crea un proyecto en [console.neon.tech](https://console.neon.tech) (o
   desde la integración de Neon dentro del propio dashboard de Vercel —
   Storage → Connect Database → Neon — que hace este paso y el siguiente
   automáticamente).
2. En el dashboard del proyecto de Neon, toma dos cadenas de conexión:
   - **Pooled** (host con `-pooler` en el nombre, o el connection string
     que Neon marca como "Pooled connection") → `DATABASE_URL`.
   - **Direct** (sin `-pooler`) → `DIRECT_URL`.

   Se necesitan las dos porque el pooler de Neon corre en modo transacción
   (pgbouncer) y no soporta los advisory locks que usa `prisma migrate`;
   las migraciones deben ir por la conexión directa, mientras que la app en
   producción sí debe usar la conexión con pool (evita agotar el límite de
   conexiones de Postgres en un entorno serverless donde cada invocación
   puede abrir una conexión nueva).

## 2. Variables de entorno

Copia `.env.example` a `.env` para desarrollo local, y define las mismas
variables en el proyecto de Vercel (**Settings → Environment Variables**,
para *Production* y *Preview*):

| Variable | Valor |
|---|---|
| `DATABASE_URL` | Conexión *pooled* de Neon |
| `DIRECT_URL` | Conexión *directa* de Neon |
| `AUTH_SECRET` | `npx auth secret` (o `openssl rand -base64 32`) |
| `AUTH_URL` | En Vercel se puede omitir (se infiere); en local: `http://localhost:3000` |

Si usaste la integración nativa Neon↔Vercel, `DATABASE_URL`/`DIRECT_URL` (o
sus equivalentes con otro nombre — revisa qué variables crea la
integración) ya quedan configuradas automáticamente; solo falta
`AUTH_SECRET`.

## 3. Primer despliegue

1. Sube el repo a GitHub/GitLab y en Vercel elige **Add New → Project**,
   importa el repo. Vercel detecta Next.js automáticamente — no hace falta
   tocar el *Build Command* (`npm run build`, que ya incluye
   `prisma generate && prisma migrate deploy && next build`).
2. Antes del primer deploy, corre las migraciones y el seed **una vez**
   desde tu máquina apuntando a la base de Neon (con `DATABASE_URL`/
   `DIRECT_URL` de producción en tu `.env` local, temporalmente):

   ```bash
   npm run db:migrate -- --name init   # o: npm run db:deploy si ya tienes migraciones commiteadas
   npm run db:seed
   ```

   (`prisma migrate deploy`, que corre el build de Vercel, solo *aplica*
   migraciones existentes — la primera migración hay que generarla con
   `db:migrate` desde un entorno con acceso interactivo, es decir tu
   máquina, no el build de Vercel.)
3. Despliega. Cada deploy subsecuente vuelve a correr `prisma migrate
   deploy` automáticamente como parte de `npm run build`, así que nuevas
   migraciones commiteadas se aplican solas.

## 4. Después del despliegue

- Inicia sesión con el usuario `admin@itson.edu.mx` y la contraseña que
  imprimió `db:seed`, y cámbiala (por ahora, directamente en la base de
  datos con `npm run db:studio` — regenera el hash con bcrypt antes de
  guardarlo, o vuelve a correr el seed con `SEED_ADMIN_PASSWORD` definido).
- Revisa `/admin/ubicaciones` y `/admin/areas`: el seed no asigna Campus ni
  Edificio a ninguna ubicación (los datos de origen no los identificaban —
  ver `docs/DATABASE.md`), así que probablemente quieras crear el campus
  real y reasignar edificios desde ahí.
- `/docs` sirve la documentación interactiva de la API en producción tal
  cual — no requiere configuración adicional.

## 5. Notas de la integración Prisma + Neon

- El cliente de Prisma en tiempo de ejecución usa
  `@prisma/adapter-neon` + `@neondatabase/serverless` (ver
  `src/lib/db/prisma.ts`), que habla el protocolo HTTP/WebSocket de Neon en
  vez de mantener conexiones TCP persistentes — es el driver recomendado
  por Neon para funciones serverless como las de Vercel.
- `prisma7.config.ts` usa `DIRECT_URL` (no `DATABASE_URL`) para las
  operaciones del CLI (`migrate`, `studio`, `db seed`) — ver el comentario
  en ese archivo.
