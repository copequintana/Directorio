// Formas tal como llegan al cliente (JSON): las fechas viajan como string
// ISO, no como Date — por eso estos tipos viven aparte de los modelos de
// Prisma en lugar de reutilizarlos directamente en componentes de cliente.

export interface Campus {
  id: string;
  nombre: string;
  clave: string;
  activo: boolean;
}

export interface Edificio {
  id: string;
  campusId: string;
  nombre: string;
  clave: string | null;
  descripcion: string | null;
  activo: boolean;
  campus?: Campus;
}

export interface Ubicacion {
  id: string;
  edificioId: string | null;
  tipo: string;
  nombre: string | null;
  numero: string | null;
  piso: string | null;
  descripcion: string | null;
  activo: boolean;
  edificio?: Edificio | null;
}

export interface Area {
  id: string;
  nombre: string;
  descripcion: string | null;
  areaPadreId: string | null;
  activo: boolean;
  subareas?: Area[];
}

export interface Puesto {
  id: string;
  nombre: string;
  descripcion: string | null;
  activo: boolean;
}

export interface Persona {
  id: string;
  nombre: string;
  apellidoPaterno: string | null;
  apellidoMaterno: string | null;
  nombreCompleto: string;
  correo: string | null;
  puestoId: string | null;
  areaId: string | null;
  activo: boolean;
  puesto?: Puesto | null;
  area?: Area | null;
}

export interface AsignacionExtension {
  id: string;
  extensionId: string;
  personaId: string | null;
  areaId: string | null;
  ubicacionId: string | null;
  tipoAsignacion: string;
  fechaInicio: string;
  fechaFin: string | null;
  esPrincipal: boolean;
  activo: boolean;
  observaciones: string | null;
  persona?: Persona | null;
  area?: Area | null;
  ubicacion?: Ubicacion | null;
}

export interface Extension {
  id: string;
  numero: string;
  tipo: string | null;
  estado: string;
  observaciones: string | null;
  activo: boolean;
  asignaciones: AsignacionExtension[];
}

export interface HistorialCambios {
  id: string;
  entidad: string;
  entidadId: string;
  accion: string;
  valoresAnteriores: unknown;
  valoresNuevos: unknown;
  usuarioId: string | null;
  fecha: string;
  usuario?: { id: string; nombre: string; correo: string } | null;
}

export interface SolicitudCambio {
  id: string;
  extensionId: string;
  nombreSolicitante: string;
  correoSolicitante: string | null;
  mensaje: string;
  estado: "PENDIENTE" | "APLICADA" | "RECHAZADA";
  notaAdmin: string | null;
  usuarioResolvioId: string | null;
  fechaResolucion: string | null;
  createdAt: string;
  extension?: { id: string; numero: string };
  usuarioResolvio?: { id: string; nombre: string } | null;
}

export interface SearchResultItem {
  extensionId: string;
  numero: string;
  estado: string;
  observaciones: string | null;
  personas: { id: string; nombreCompleto: string }[];
  area: { id: string; nombre: string } | null;
  puesto: { id: string; nombre: string } | null;
  ubicacion: { id: string; tipo: string; nombre: string | null; numero: string | null } | null;
  edificio: { id: string; nombre: string } | null;
  campus: { id: string; nombre: string } | null;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
