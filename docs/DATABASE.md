# Base de datos

PostgreSQL en Neon. Esquema completo en [`prisma/schema.prisma`](../prisma/schema.prisma).
Este documento explica las decisiones que no son obvias leyendo el schema.

## Modelo

```
Campus 1───N Edificio 1───N Ubicacion
Area (self-relation: areaPadreId → subáreas)
Puesto
Persona ──(N:1 opcional)── Puesto, Area

Extension 1───N AsignacionExtension N───1 Persona (opcional)
                                    N───1 Area (opcional)
                                    N───1 Ubicacion (opcional)

Usuario 1───N HistorialCambios
Extension 1───N SolicitudCambio N───1 Usuario (opcional, quien la resolvió)
```

`AsignacionExtension` es la tabla central (spec 5.8): permite que una
extensión tenga cero, una o varias personas activas al mismo tiempo, y
conserva el historial de asignaciones vía `fechaInicio`/`fechaFin` en lugar
de sobrescribir filas.

`SolicitudCambio` no es parte del documento original: es el mecanismo para
que cualquiera (sin cuenta) reporte un dato incorrecto de una extensión
desde la ficha pública, y un Capturista/Administrador lo revise en
`/admin/solicitudes`. Es deliberadamente texto libre (`mensaje`), no un
diff estructurado — resolverla no aplica el cambio sola, solo la marca
como `APLICADA`/`RECHAZADA`; el cambio real se hace con las herramientas de
edición normales, que sí quedan en `HistorialCambios`.

## Decisiones de modelado que no son literales del documento

- **`Ubicacion.edificioId` es nullable.** Muchos registros de origen (ver
  seed) identifican un cubículo/aula pero no el edificio. La spec (sección
  22) prohíbe inferir un edificio que los datos no dan, así que el campo se
  dejó opcional en vez de forzar un valor. Por la misma razón, "Cubículo 1"
  **no** es único globalmente — dos filas con el mismo texto y sin edificio
  se tratan como espacios distintos, nunca se fusionan automáticamente.
- **`AsignacionExtension.tipoAsignacion`** (`INDIVIDUAL` / `COMPARTIDA` /
  `AREA_SERVICIO` / `SIN_PERSONA`) es el campo que pedía la spec sección 24
  para no asumir que cada nombre es una persona institucional independiente
  cuando el dato de origen solo identifica un grupo de usuarios de una
  misma extensión (p. ej. "Rosy – Elvia").
- **`esPrincipal` como "a lo sumo una por extensión"** se aplica en el
  servicio (`asignacion.service.ts`), no como constraint de base de datos:
  Postgres soporta índices únicos parciales, pero Prisma no los expresa en
  su DSL de schema sin una migración SQL manual; para el tamaño de este
  proyecto no se justificó agregarla.
- **`HistorialCambios.loteId`** agrupa todas las filas que produce una
  misma corrida de importación (`accion = IMPORTAR`), para poder resolver
  `GET /api/importaciones/{id}` sin necesitar una tabla de "lotes"
  separada que la spec no pedía.
- **IDs `cuid()`**, timestamps `createdAt`/`updatedAt`, y `activo Boolean`
  para baja lógica en todas las entidades (spec 6.5-6.6: nunca se borra
  físicamente una extensión con historial).
- **`Campus.mapaUrl` / `Edificio.mapaX` / `Edificio.mapaY`** — tampoco son
  parte del documento original: soportan el mapa interactivo del campus
  (`/mapa` público, `/admin/mapa` para posicionar). `mapaUrl` apunta a un
  asset estático en `public/campus-maps/` (el mapa se versiona con el
  repo, igual que el logo, no se sube dinámicamente). `mapaX`/`mapaY` son
  porcentaje (0-100) sobre esa imagen, no píxeles, para no desalinearse si
  se reescala.
- **`BusquedaLog`** — tampoco pedida por el documento: una fila por cada
  llamada a `/api/directorio/search`, para que `/admin` muestre si el sitio
  se está usando (búsquedas hoy/semana/total) y qué está buscando la gente.
  `texto` se guarda normalizado (trim + minúsculas) para que "Calidad" y
  "calidad" cuenten como la misma búsqueda. No guarda IP ni usuario — es
  anónimo a propósito. Registrar falla en silencio (`metricas.service.ts`):
  un error ahí nunca debe tumbar una búsqueda real.

## Reglas de negocio y dónde se aplican

| Regla (spec §6) | Dónde |
|---|---|
| Extensión única | `Extension.numero @unique` + chequeo explícito en `crearExtension`/`actualizarExtension` (para dar un mensaje de error claro en vez de dejar que falle el constraint) |
| Extensión sin persona | `AsignacionExtension.personaId` nullable |
| Extensión con varias personas | Varias filas de `AsignacionExtension` con el mismo `extensionId` |
| Nunca borrar físicamente una extensión con historial | `DELETE /api/extensions/{id}` siempre hace `activo=false`, nunca `prisma.extension.delete` |
| Toda modificación relevante queda en historial | `registrarHistorial()` (infra) se invoca dentro de la misma transacción que cada mutación |
| Persona inactiva no aparece en búsqueda por defecto | Filtros de listados/búsqueda excluyen `activo=false` salvo que se pida explícitamente `incluirInactivos=true` |
| Ubicación puede existir sin extensión | `AsignacionExtension.ubicacionId` es la única FK hacia `Ubicacion`; no hay relación obligatoria inversa |

## Seed inicial (spec sección 21)

Los ~95 registros de la sección 21 mezclan área/puesto/persona de forma
inconsistente (paréntesis en distinto orden según la fila, guiones que a
veces separan nombres de personas y a veces son parte del nombre de un
área — p. ej. "Admisiones – Promoción de Oferta Académica" no son dos
personas). Un parser genérico heurístico se equivocaría en varios casos
sin que nadie lo note en un dataset de este tamaño.

Por eso `prisma/seed-data.ts` **transcribe cada línea a mano** al formato
normalizado de importación (`ImportRow`, spec sección 16) — el mismo
formato que usa el importador real de `/admin/importar` — en lugar de
adivinarlo con un algoritmo. Reglas seguidas:

- No se inventa Campus ni Edificio: el texto de origen no los menciona, así
  que quedan sin asignar (pendiente para administración, spec 22).
- El nombre de cada persona se conserva literal en un solo campo
  (`personaNombre`), sin partirlo en apellidos — partir "Ana Lucia Félix
  Rochin" en nombre/apellido paterno/materno es ambiguo y la spec (23)
  pide no modificar silenciosamente los datos originales.
- Los grupos unidos por "–" (`Rosy – Elvia`, `David – Homero`, los seis
  nombres de "Asistentes de P. E.") generan una fila por persona sobre la
  misma extensión; el servicio de importación las reclasifica
  automáticamente como `COMPARTIDA` al detectar más de una persona activa
  en la misma extensión.
- `prisma/seed.ts` reutiliza `confirmarImportacion()` (el mismo servicio
  que usa la UI de importación) para escribir los datos — evita mantener
  dos caminos distintos para lo mismo, y dejas auditado en
  `HistorialCambios` (accion `IMPORTAR`) también el seed inicial.

El seed además crea un usuario `ADMINISTRADOR` (`admin@itson.edu.mx`) con
una contraseña inicial que se imprime en consola — cámbiala de inmediato en
producción (ver `docs/DEPLOYMENT.md`).
