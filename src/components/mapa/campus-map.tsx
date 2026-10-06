"use client";

import { useRef } from "react";
import Image from "next/image";
import { MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Edificio } from "@/types/entities";

export interface CampusMapProps {
  mapaUrl: string;
  edificios: Edificio[];
  seleccionadoId?: string | null;
  onPinClick?: (edificio: Edificio) => void;
  /** Modo admin: clic en el mapa coloca/mueve el pin del edificio seleccionado. */
  onMapClick?: (porcentajeX: number, porcentajeY: number) => void;
}

export function CampusMap({
  mapaUrl,
  edificios,
  seleccionadoId,
  onPinClick,
  onMapClick,
}: CampusMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  function handleClick(e: React.MouseEvent<HTMLDivElement>) {
    if (!onMapClick || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    onMapClick(Math.min(100, Math.max(0, x)), Math.min(100, Math.max(0, y)));
  }

  return (
    // El mapa es muy vertical (retrato) — sin tope de alto ocupa varias
    // pantallas y lo que aparece al elegir un edificio queda fuera de vista.
    // Se limita la altura visible y se deja scroll propio dentro del
    // recuadro; las coordenadas de los pines se calculan igual porque siguen
    // siendo % del mismo contenedor, el scroll no las afecta.
    <div className="max-h-[60vh] overflow-y-auto rounded-lg border border-border">
      <div
        ref={containerRef}
        onClick={handleClick}
        className={cn("relative w-full select-none", onMapClick && "cursor-crosshair")}
      >
        <Image src={mapaUrl} alt="Mapa del campus" width={1036} height={2048} className="h-auto w-full" priority />

        {edificios
          .filter((e) => e.mapaX !== null && e.mapaY !== null)
          .map((e) => {
            const seleccionado = seleccionadoId === e.id;
            return (
              // -translate-y-full ancla la PUNTA del pin (no el centro) al
              // punto exacto, como en Google Maps.
              <div
                key={e.id}
                style={{ left: `${e.mapaX}%`, top: `${e.mapaY}%` }}
                className={cn(
                  "absolute flex -translate-x-1/2 -translate-y-full flex-col items-center",
                  seleccionado && "z-10",
                )}
              >
                {seleccionado && (
                  <span className="mb-1 whitespace-nowrap rounded-full bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground shadow-lg">
                    {e.nombre}
                  </span>
                )}
                <button
                  type="button"
                  title={e.nombre}
                  onClick={(ev) => {
                    ev.stopPropagation();
                    onPinClick?.(e);
                  }}
                  className="transition-transform hover:scale-110"
                >
                  <MapPin
                    className={cn(
                      "text-white drop-shadow-lg",
                      seleccionado ? "h-11 w-11 animate-bounce fill-danger" : "h-7 w-7 fill-accent",
                    )}
                    strokeWidth={1.5}
                  />
                </button>
              </div>
            );
          })}
      </div>
    </div>
  );
}
