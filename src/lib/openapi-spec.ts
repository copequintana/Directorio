/**
 * Documento OpenAPI 3.0 servido en /api/docs/openapi.json y renderizado con
 * Swagger UI en /docs (spec sección 17-18, criterio de aceptación #18).
 * Se mantiene a mano en un solo archivo por simplicidad: para un API de
 * este tamaño, generar el spec desde los schemas de Zod con
 * @asteasolutions/zod-to-openapi habría significado registrar cada schema
 * dos veces sin ahorrar trabajo real.
 */
const envelope = (dataSchema: object) => ({
  type: "object",
  properties: {
    success: { type: "boolean" },
    data: dataSchema,
    message: { type: "string", nullable: true },
  },
});

const errorEnvelope = {
  type: "object",
  properties: {
    success: { type: "boolean", example: false },
    data: { nullable: true, example: null },
    message: { type: "string" },
    errors: { type: "array", items: {} },
  },
};

const idParam = {
  name: "id",
  in: "path" as const,
  required: true,
  schema: { type: "string" },
};

function crudPaths(resource: string, entidad: string, opts?: { noDelete?: boolean }) {
  const base = `/api/${resource}`;
  return {
    [base]: {
      get: {
        tags: [entidad],
        summary: `Listar ${entidad.toLowerCase()}`,
        responses: { "200": { description: "OK", content: { "application/json": { schema: envelope({ type: "array", items: {} }) } } } },
      },
      post: {
        tags: [entidad],
        summary: `Crear ${entidad.toLowerCase()}`,
        security: [{ sessionCookie: [] }],
        requestBody: { required: true, content: { "application/json": { schema: {} } } },
        responses: {
          "201": { description: "Creado", content: { "application/json": { schema: envelope({}) } } },
          "400": { description: "Datos inválidos", content: { "application/json": { schema: errorEnvelope } } },
          "401": { description: "No autenticado", content: { "application/json": { schema: errorEnvelope } } },
        },
      },
    },
    [`${base}/{id}`]: {
      parameters: [idParam],
      ...(resource === "personas" || resource === "extensions"
        ? {
            get: {
              tags: [entidad],
              summary: `Obtener ${entidad.toLowerCase()} por id`,
              responses: {
                "200": { description: "OK", content: { "application/json": { schema: envelope({}) } } },
                "404": { description: "No encontrado", content: { "application/json": { schema: errorEnvelope } } },
              },
            },
          }
        : {}),
      put: {
        tags: [entidad],
        summary: `Actualizar ${entidad.toLowerCase()}`,
        security: [{ sessionCookie: [] }],
        requestBody: { required: true, content: { "application/json": { schema: {} } } },
        responses: {
          "200": { description: "OK", content: { "application/json": { schema: envelope({}) } } },
          "404": { description: "No encontrado", content: { "application/json": { schema: errorEnvelope } } },
        },
      },
      ...(opts?.noDelete
        ? {}
        : {
            delete: {
              tags: [entidad],
              summary: `Desactivar ${entidad.toLowerCase()} (baja lógica)`,
              security: [{ sessionCookie: [] }],
              responses: {
                "200": { description: "Desactivado", content: { "application/json": { schema: envelope({}) } } },
                "404": { description: "No encontrado", content: { "application/json": { schema: errorEnvelope } } },
              },
            },
          }),
    },
    [`${base}/{id}/historial`]: {
      parameters: [idParam],
      get: {
        tags: [entidad],
        summary: `Historial de cambios de ${entidad.toLowerCase()}`,
        security: [{ sessionCookie: [] }],
        responses: { "200": { description: "OK", content: { "application/json": { schema: envelope({ type: "array", items: {} }) } } } },
      },
    },
  };
}

export const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "Directorio Telefónico ITSON — API",
    version: "1.0.0",
    description:
      "API REST del Directorio Telefónico ITSON. Todas las respuestas usan el sobre estándar " +
      "{ success, data, message } / { success:false, data:null, message, errors } (spec sección 18).",
  },
  servers: [{ url: "/", description: "Origen actual" }],
  components: {
    securitySchemes: {
      sessionCookie: {
        type: "apiKey",
        in: "cookie",
        name: "authjs.session-token",
        description: "Sesión iniciada vía POST /api/auth/callback/credentials (Auth.js).",
      },
    },
  },
  tags: [
    { name: "Directorio", description: "Búsqueda pública" },
    { name: "Extensiones" },
    { name: "Asignaciones" },
    { name: "Personas" },
    { name: "Áreas" },
    { name: "Puestos" },
    { name: "Campus" },
    { name: "Edificios" },
    { name: "Ubicaciones" },
    { name: "Importación" },
  ],
  paths: {
    "/api/directorio/search": {
      get: {
        tags: ["Directorio"],
        summary: "Búsqueda libre en el directorio (spec sección 7)",
        parameters: [
          { name: "q", in: "query", schema: { type: "string" }, description: "Texto libre: número, nombre, área, puesto, ubicación, edificio, campus u observaciones." },
          { name: "campusId", in: "query", schema: { type: "string" } },
          { name: "areaId", in: "query", schema: { type: "string" } },
          { name: "edificioId", in: "query", schema: { type: "string" } },
          { name: "ubicacionId", in: "query", schema: { type: "string" } },
          { name: "estado", in: "query", schema: { type: "string", enum: ["ACTIVA", "INACTIVA", "SIN_ASIGNAR", "MANTENIMIENTO", "RESERVADA"] } },
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "pageSize", in: "query", schema: { type: "integer", default: 20 } },
        ],
        responses: {
          "200": {
            description: "Resultados paginados",
            content: { "application/json": { schema: envelope({ type: "object", properties: { items: { type: "array", items: {} }, total: { type: "integer" } } }) } },
          },
        },
      },
    },
    ...crudPaths("extensions", "Extensiones"),
    "/api/extensions/{id}/asignaciones": {
      parameters: [idParam],
      post: {
        tags: ["Asignaciones"],
        summary: "Asignar una persona, área/servicio o dejar sin persona (spec 5.8)",
        security: [{ sessionCookie: [] }],
        requestBody: { required: true, content: { "application/json": { schema: {} } } },
        responses: { "201": { description: "Creada", content: { "application/json": { schema: envelope({}) } } } },
      },
    },
    "/api/extensions/{id}/asignaciones/{asignacionId}": {
      parameters: [idParam, { name: "asignacionId", in: "path" as const, required: true, schema: { type: "string" } }],
      delete: {
        tags: ["Asignaciones"],
        summary: "Finalizar una asignación (fechaFin) sin borrar el historial",
        security: [{ sessionCookie: [] }],
        responses: { "200": { description: "OK", content: { "application/json": { schema: envelope({}) } } } },
      },
    },
    ...crudPaths("personas", "Personas"),
    ...crudPaths("areas", "Áreas"),
    ...crudPaths("puestos", "Puestos"),
    ...crudPaths("campus", "Campus", { noDelete: false }),
    ...crudPaths("edificios", "Edificios"),
    ...crudPaths("ubicaciones", "Ubicaciones"),
    "/api/importaciones": {
      post: {
        tags: ["Importación"],
        summary: "Analizar filas ya normalizadas sin persistir (vista previa)",
        security: [{ sessionCookie: [] }],
        requestBody: { required: true, content: { "application/json": { schema: { type: "object", properties: { filas: { type: "array", items: {} } } } } } },
        responses: { "200": { description: "Vista previa", content: { "application/json": { schema: envelope({}) } } } },
      },
    },
    "/api/importaciones/analizar-archivo": {
      post: {
        tags: ["Importación"],
        summary: "Subir un archivo .xlsx/.csv y obtener la vista previa (spec sección 15)",
        security: [{ sessionCookie: [] }],
        requestBody: { required: true, content: { "multipart/form-data": { schema: { type: "object", properties: { file: { type: "string", format: "binary" } } } } } },
        responses: { "200": { description: "Vista previa", content: { "application/json": { schema: envelope({}) } } } },
      },
    },
    "/api/importaciones/confirmar": {
      post: {
        tags: ["Importación"],
        summary: "Confirmar e importar las filas aprobadas (transaccional)",
        security: [{ sessionCookie: [] }],
        requestBody: { required: true, content: { "application/json": { schema: { type: "object", properties: { filas: { type: "array", items: {} } } } } } },
        responses: { "201": { description: "Importado", content: { "application/json": { schema: envelope({}) } } } },
      },
    },
    "/api/importaciones/{id}": {
      parameters: [idParam],
      get: {
        tags: ["Importación"],
        summary: "Consultar el resultado de un lote de importación por loteId",
        security: [{ sessionCookie: [] }],
        responses: { "200": { description: "OK", content: { "application/json": { schema: envelope({}) } } } },
      },
    },
  },
};
