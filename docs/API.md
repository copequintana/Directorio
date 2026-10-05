# API REST

Documentación interactiva (Swagger UI) en **`/docs`**, spec en JSON en
`GET /api/docs/openapi.json`. Este documento resume lo mismo en texto.

## Sobre de respuesta (spec sección 18)

Éxito:

```json
{ "success": true, "data": { }, "message": null }
```

Error:

```json
{ "success": false, "data": null, "message": "La extensión ya existe.", "errors": [] }
```

`errors` trae el detalle de validación de Zod cuando el error es `400`.

## Autenticación y roles

Sesión vía cookie (Auth.js), `POST /api/auth/callback/credentials` con
`{ correo, password }` (usar `signIn("credentials", …)` del lado del
cliente en vez de llamar este endpoint directo). Roles, de menor a mayor
privilegio:

| Rol | Puede |
|---|---|
| `CONSULTA` | Solo lectura (búsqueda pública ya es de lectura libre, sin sesión) |
| `CAPTURISTA` | Crear/editar extensiones, personas, áreas, ubicaciones, puestos; asignar/desasignar; importar |
| `ADMINISTRADOR` | Todo lo anterior + desactivar (baja lógica) cualquier entidad |

Cada mutación indica en `/docs` el rol mínimo requerido
(`security: sessionCookie`, ver el summary del endpoint). El servidor
siempre revalida sesión y rol (`server/infrastructure/auth-guard.ts`),
independientemente del proxy que protege `/admin/**`.

## Endpoints

```
GET    /api/directorio/search?q=&campusId=&areaId=&edificioId=&ubicacionId=&estado=&page=&pageSize=

GET    /api/extensions?q=&estado=&areaId=&campusId=&edificioId=&ubicacionId=&page=&pageSize=&sortBy=&sortDir=&incluirInactivos=
GET    /api/extensions/{id}
POST   /api/extensions                       { numero, tipo?, estado?, observaciones? }
PUT    /api/extensions/{id}
DELETE /api/extensions/{id}                  (baja lógica)
GET    /api/extensions/{id}/historial
POST   /api/extensions/{id}/asignaciones     { personaId?, areaId?, ubicacionId?, tipoAsignacion?, esPrincipal? }
PUT    /api/extensions/{id}/asignaciones/{asignacionId}   corrige la asignación existente (no cambia fechaInicio)
DELETE /api/extensions/{id}/asignaciones/{asignacionId}   (finaliza, no borra)

GET    /api/personas?q=&areaId=&page=&pageSize=&incluirInactivos=
GET    /api/personas/{id}
POST   /api/personas                         { nombre, apellidoPaterno?, apellidoMaterno?, correo?, puestoId?, areaId? }
PUT    /api/personas/{id}
DELETE /api/personas/{id}
GET    /api/personas/{id}/historial

GET    /api/areas?incluirInactivos=
GET    /api/areas/{id}
POST   /api/areas                            { nombre, descripcion?, areaPadreId? }
PUT    /api/areas/{id}
DELETE /api/areas/{id}
GET    /api/areas/{id}/historial

GET    /api/puestos?incluirInactivos=
POST   /api/puestos                          { nombre, descripcion? }
PUT    /api/puestos/{id}
DELETE /api/puestos/{id}

GET    /api/campus?incluirInactivos=
POST   /api/campus                           { nombre, clave, mapaUrl? }
PUT    /api/campus/{id}
DELETE /api/campus/{id}
GET    /api/campus/{id}/historial
GET    /api/campus/{id}/mapa                 campus + sus edificios con mapaX/mapaY (público)

GET    /api/edificios?campusId=&incluirInactivos=
POST   /api/edificios                        { campusId, nombre, clave?, descripcion? }
PUT    /api/edificios/{id}
DELETE /api/edificios/{id}
GET    /api/edificios/{id}/historial
PUT    /api/edificios/{id}/posicion          { mapaX, mapaY } (0-100, % sobre Campus.mapaUrl)

GET    /api/ubicaciones?edificioId=&tipo=&incluirInactivos=
POST   /api/ubicaciones                      { edificioId?, tipo, nombre?, numero?, piso?, descripcion? }
PUT    /api/ubicaciones/{id}
DELETE /api/ubicaciones/{id}
GET    /api/ubicaciones/{id}/historial

POST   /api/importaciones                    { filas: ImportRow[] }        → vista previa (sin persistir)
POST   /api/importaciones/analizar-archivo   multipart/form-data: file     → parsea .xlsx/.csv + vista previa
POST   /api/importaciones/confirmar          { filas: ImportRow[] }        → persiste (transaccional)
GET    /api/importaciones/{id}               (id = loteId devuelto al confirmar)

POST   /api/extensions/{id}/solicitudes      { nombreSolicitante, correoSolicitante?, mensaje }  (público, sin sesión)
GET    /api/solicitudes?estado=              (PENDIENTE|APLICADA|RECHAZADA, por defecto todas)
PUT    /api/solicitudes/{id}                 { estado: APLICADA|RECHAZADA, notaAdmin? }
```

`POST /api/extensions/{id}/solicitudes` es el único endpoint de escritura sin
autenticación a propósito: es el "reportar un error" que cualquiera puede
usar desde la ficha pública de una extensión (`/extensions/{id}`). No aplica
ningún cambio por sí solo — solo queda en una bandeja (`/admin/solicitudes`)
para que un Capturista/Administrador la revise y haga el cambio real con las
herramientas normales (que sí quedan en `HistorialCambios`).

Los endpoints marcados `DELETE` **nunca borran físicamente** — desactivan
lógicamente (spec 6.5-6.6), excepto la finalización de una asignación, que
le pone `fechaFin` en vez de borrarla, para conservar el historial de a
quién estuvo asignada la extensión.

## Formato de importación (`ImportRow`, spec sección 16)

Columnas, en este orden si subes `.xlsx`/`.csv`:

```
Campus | Edificio | Area | Subarea | TipoUbicacion | Ubicacion |
PersonaNombre | PersonaApellidoPaterno | PersonaApellidoMaterno |
Puesto | Extension | Estado | Observaciones
```

`TipoUbicacion` acepta: `OFICINA`, `CUBICULO`, `AULA`, `VENTANILLA`,
`LABORATORIO`, `SITE`, `AREA`, `OTRO`. `Estado` acepta: `ACTIVA`,
`INACTIVA`, `SIN_ASIGNAR`, `MANTENIMIENTO`, `RESERVADA` (o vacío). El
análisis (`POST /api/importaciones` o `.../analizar-archivo`) marca cada
fila con:

- `EXTENSION_DUPLICADA_EN_ARCHIVO` / `CAMPO_REQUERIDO_FALTANTE` — bloquean
  la confirmación.
- `EXTENSION_YA_EXISTE` (la fila actualizará, no creará),
  `PERSONA_POSIBLEMENTE_DUPLICADA`, `UBICACION_AMBIGUA` — informativos, no
  bloquean.
