"use client";

import { useRef } from "react";
import Image from "next/image";
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
    <div
      ref={containerRef}
      onClick={handleClick}
      className={cn("relative w-full select-none overflow-hidden rounded-lg border border-border", onMapClick && "cursor-crosshair")}
    >
      <Image src={mapaUrl} alt="Mapa del campus" width={1036} height={2048} className="h-auto w-full" priority />

      {edificios
        .filter((e) => e.mapaX !== null && e.mapaY !== null)
        .map((e) => (
          <button
            key={e.id}
            type="button"
            title={e.nombre}
            onClick={(ev) => {
              ev.stopPropagation();
              onPinClick?.(e);
            }}
            style={{ left: `${e.mapaX}%`, top: `${e.mapaY}%` }}
            className={cn(
              "absolute flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white shadow-md transition-transform hover:scale-110",
              "h-5 w-5 bg-accent",
              seleccionadoId === e.id && "ring-4 ring-warning",
            )}
          />
        ))}
    </div>
  );
}
