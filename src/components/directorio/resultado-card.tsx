import Link from "next/link";
import { MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { EstadoBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { SearchResultItem } from "@/types/entities";

export function ResultadoCard({ resultado }: { resultado: SearchResultItem }) {
  const titulo = resultado.area?.nombre ?? resultado.personas[0]?.nombreCompleto ?? "Extensión";

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardContent className="flex flex-col gap-2">
        <Link href={`/extensions/${resultado.extensionId}`} className="flex flex-col gap-2">
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-semibold text-foreground">{titulo}</h3>
            <EstadoBadge estado={resultado.estado} />
          </div>

          {resultado.personas.length > 0 && (
            <ul className="text-sm text-muted">
              {resultado.personas.map((persona) => (
                <li key={persona.id}>{persona.nombreCompleto}</li>
              ))}
            </ul>
          )}

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
            {resultado.puesto && <span>{resultado.puesto.nombre}</span>}
            {resultado.ubicacion && (
              <span>
                {resultado.ubicacion.tipo === "OTRO" ? "" : resultado.ubicacion.tipo + " "}
                {resultado.ubicacion.nombre ?? resultado.ubicacion.numero ?? ""}
              </span>
            )}
            {resultado.edificio && <span>{resultado.edificio.nombre}</span>}
          </div>

          <div className="mt-1 text-2xl font-bold tracking-tight text-primary">
            {resultado.numero}
          </div>
        </Link>

        {resultado.edificio && (
          <Link href={`/mapa?edificioId=${resultado.edificio.id}`} className="self-start">
            <Button variant="outline" size="sm">
              <MapPin className="h-4 w-4" />
              Ver en el mapa
            </Button>
          </Link>
        )}
      </CardContent>
    </Card>
  );
}
