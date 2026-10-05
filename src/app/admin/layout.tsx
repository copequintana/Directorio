import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";

const NAV = [
  { href: "/admin", label: "Panel" },
  { href: "/admin/extensions", label: "Extensiones" },
  { href: "/admin/personas", label: "Personas" },
  { href: "/admin/areas", label: "Áreas" },
  { href: "/admin/ubicaciones", label: "Ubicaciones" },
  { href: "/admin/mapa", label: "Mapa" },
  { href: "/admin/importar", label: "Importar" },
  { href: "/admin/solicitudes", label: "Solicitudes" },
  { href: "/docs", label: "API (Swagger)" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/admin");

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 md:flex-row">
      <aside className="flex shrink-0 flex-row gap-1 overflow-x-auto md:w-48 md:flex-col">
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-muted-bg"
          >
            {item.label}
          </Link>
        ))}
      </aside>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
