import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { obtenerExtension } from "@/server/services/extension.service";
import { Card, CardContent } from "@/components/ui/card";
import { EstadoBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { HistorialPanel } from "@/components/admin/historial-panel";
import { ReportarErrorForm } from "@/components/directorio/reportar-error-form";

export default async function ExtensionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [extension, session] = await Promise.all([obtenerExtension(id), auth()]);

  if (!extension) notFound();

  const asignaciones = extension.asignaciones;
  const principal = asignaciones[0];

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-8">
      <Link href="/" className="text-sm text-accent hover:underline">
        ← Volver a la búsqueda
      </Link>

      <Card>
        <CardContent className="flex flex-col gap-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted">Extensión</p>
              <p className="text-5xl font-bold tracking-tight text-primary">{extension.numero}</p>
            </div>
            <EstadoBadge estado={extension.estado} />
          </div>

          {asignaciones.length === 0 ? (
            <p className="text-muted">Esta extensión no tiene personas ni área asignada.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {asignaciones.some((a) => a.persona) && (
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted">Personas</p>
                  <ul className="text-lg">
                    {asignaciones
                      .filter((a) => a.persona)
                      .map((a) => (
                        <li key={a.id}>{a.persona!.nombreCompleto}</li>
                      ))}
                  </ul>
                </div>
              )}

              {principal?.area && (
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted">Área</p>
                  <p>{principal.area.nombre}</p>
                </div>
              )}

              {principal?.ubicacion && (
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted">Ubicación</p>
                  <p>
                    {principal.ubicacion.tipo} {principal.ubicacion.nombre ?? principal.ubicacion.numero ?? ""}
                    {principal.ubicacion.edificio ? ` · ${principal.ubicacion.edificio.nombre}` : ""}
                    {principal.ubicacion.edificio?.campus ? ` · ${principal.ubicacion.edificio.campus.nombre}` : ""}
                  </p>
                </div>
              )}
            </div>
          )}

          {extension.observaciones && (
            <div>
              <p className="text-xs uppercase tracking-wide text-muted">Observaciones</p>
              <p>{extension.observaciones}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <ReportarErrorForm extensionId={extension.id} />

      {session?.user && (
        <Card>
          <CardContent className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Acciones administrativas</h2>
              <Link href={`/admin/extensions/${extension.id}`}>
                <Button size="sm">Editar / asignar</Button>
              </Link>
            </div>

            <div>
              <h3 className="mb-2 text-sm font-medium text-muted">Historial de cambios</h3>
              <HistorialPanel entidad="Extension" entidadId={extension.id} />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
