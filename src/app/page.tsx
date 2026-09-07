"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { FiltrosBusqueda, type FiltrosValor } from "@/components/directorio/filtros-busqueda";
import { ResultadoCard } from "@/components/directorio/resultado-card";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { buscarDirectorio } from "@/services/directorio.service";
import type { PaginatedResult, SearchResultItem } from "@/types/entities";

const FILTROS_VACIOS: FiltrosValor = {
  campusId: "",
  areaId: "",
  edificioId: "",
  ubicacionId: "",
  estado: "",
};

export default function HomePage() {
  const [q, setQ] = useState("");
  const [filtros, setFiltros] = useState<FiltrosValor>(FILTROS_VACIOS);
  const [resultado, setResultado] = useState<PaginatedResult<SearchResultItem> | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const qDebounced = useDebouncedValue(q, 300);

  useEffect(() => {
    let vigente = true;
    // Patrón estándar de "fetch on change" con bandera de carga: sin una
    // librería de data-fetching (no requerida por el proyecto), marcar el
    // inicio de la carga al comienzo del efecto es intencional.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCargando(true);
    setError(null);

    buscarDirectorio({ q: qDebounced, ...filtros, pageSize: 30 })
      .then((res) => {
        if (vigente) setResultado(res);
      })
      .catch((err) => {
        if (vigente) setError(err instanceof Error ? err.message : "Error al buscar.");
      })
      .finally(() => {
        if (vigente) setCargando(false);
      });

    return () => {
      vigente = false;
    };
  }, [qDebounced, filtros]);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8">
      <section className="flex flex-col items-center gap-4 py-6 text-center">
        <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">
          Directorio Telefónico ITSON
        </h1>
        <p className="max-w-xl text-muted">
          Busca por extensión, nombre, área, puesto o ubicación.
        </p>

        <div className="relative w-full max-w-2xl">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" />
          <Input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Ej. 5125, Calidad Académica, Deportes…"
            className="h-14 pl-10 text-base"
          />
        </div>
      </section>

      <FiltrosBusqueda valor={filtros} onChange={setFiltros} />

      {error && <p className="text-sm text-danger">{error}</p>}

      {!cargando && resultado && (
        <p className="text-sm text-muted">{resultado.total} resultado(s)</p>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {resultado?.items.map((item) => (
          <ResultadoCard key={item.extensionId} resultado={item} />
        ))}
      </div>

      {!cargando && resultado?.items.length === 0 && (
        <p className="py-10 text-center text-muted">
          No se encontraron resultados para tu búsqueda.
        </p>
      )}
    </div>
  );
}
