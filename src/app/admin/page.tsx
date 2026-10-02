import Link from "next/link";
import { obtenerIndicadoresDashboard } from "@/server/services/dashboard.service";
import { obtenerCambiosRecientes } from "@/server/services/historial.service";
import { Card, CardContent } from "@/components/ui/card";

const ACCION_LABEL: Record<string, string> = {
  CREAR: "Creación",
  ACTUALIZAR: "Actualización",
  DESACTIVAR: "Desactivación",
  ASIGNAR: "Asignación",
  DESASIGNAR: "Fin de asignación",
  IMPORTAR: "Importación",
};

export default async function AdminDashboardPage() {
  const [indicadores, cambios] = await Promise.all([
    obtenerIndicadoresDashboard(),
    obtenerCambiosRecientes(15),
  ]);

  const tarjetas = [
    { label: "Total de extensiones", valor: indicadores.totalExtensiones },
    { label: "Extensiones activas", valor: indicadores.extensionesActivas },
    { label: "Extensiones sin asignar", valor: indicadores.extensionesSinAsignar },
    { label: "Extensiones inactivas", valor: indicadores.extensionesInactivas },
    { label: "Total de personas", valor: indicadores.totalPersonas },
    { label: "Total de áreas", valor: indicadores.totalAreas },
  ];

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Panel administrativo</h1>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {tarjetas.map((t) => (
          <Card key={t.label}>
            <CardContent>
              <p className="text-xs text-muted">{t.label}</p>
              <p className="text-3xl font-bold text-primary">{t.valor}</p>
            </CardContent>
          </Card>
        ))}

        <Link href="/admin/solicitudes">
          <Card className={indicadores.solicitudesPendientes > 0 ? "border-warning" : undefined}>
            <CardContent>
              <p className="text-xs text-muted">Solicitudes pendientes</p>
              <p className="text-3xl font-bold text-primary">{indicadores.solicitudesPendientes}</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      <Card>
        <CardContent>
          <h2 className="mb-3 font-semibold">Cambios recientes</h2>
          {cambios.length === 0 ? (
            <p className="text-sm text-muted">Sin actividad registrada todavía.</p>
          ) : (
            <ul className="flex flex-col divide-y divide-border">
              {cambios.map((c) => (
                <li key={c.id} className="flex items-center justify-between py-2 text-sm">
                  <span>
                    <strong>{ACCION_LABEL[c.accion] ?? c.accion}</strong> · {c.entidad}
                  </span>
                  <span className="text-muted">
                    {c.usuario?.nombre ?? "Sistema"} · {new Date(c.fecha).toLocaleString("es-MX")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
