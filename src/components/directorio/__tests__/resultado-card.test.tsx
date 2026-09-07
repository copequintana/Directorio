import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ResultadoCard } from "@/components/directorio/resultado-card";
import type { SearchResultItem } from "@/types/entities";

const RESULTADO: SearchResultItem = {
  extensionId: "ext-1",
  numero: "5125",
  estado: "ACTIVA",
  observaciones: null,
  personas: [{ id: "p1", nombreCompleto: "Dulce Guadalupe Corral Leyva" }],
  area: { id: "a1", nombre: "Calidad Académica" },
  puesto: null,
  ubicacion: null,
  edificio: null,
  campus: null,
};

describe("ResultadoCard", () => {
  it("muestra número, persona, área y estado (spec sección 8)", () => {
    render(<ResultadoCard resultado={RESULTADO} />);

    expect(screen.getByText("5125")).toBeInTheDocument();
    expect(screen.getByText("Dulce Guadalupe Corral Leyva")).toBeInTheDocument();
    expect(screen.getByText("Calidad Académica")).toBeInTheDocument();
    expect(screen.getByText("Activa")).toBeInTheDocument();
  });

  it("enlaza a la ficha de detalle de la extensión", () => {
    render(<ResultadoCard resultado={RESULTADO} />);
    expect(screen.getByRole("link")).toHaveAttribute("href", "/extensions/ext-1");
  });
});
