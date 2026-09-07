"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";

export function SiteHeader() {
  const { data: session, status } = useSession();

  return (
    <header className="border-b border-border bg-primary text-primary-foreground">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="flex flex-col leading-tight">
          <span className="text-xs uppercase tracking-wide text-white/70">ITSON</span>
          <span className="text-lg font-semibold">Directorio Telefónico</span>
        </Link>

        <nav className="flex items-center gap-3 text-sm">
          <Link href="/" className="hover:underline">
            Buscar
          </Link>
          {status === "authenticated" ? (
            <>
              <Link href="/admin" className="hover:underline">
                Panel administrativo
              </Link>
              <span className="hidden text-white/70 sm:inline">{session.user?.name}</span>
              <Button variant="outline" size="sm" className="border-white/40 bg-transparent text-white hover:bg-white/10" onClick={() => signOut({ callbackUrl: "/" })}>
                Salir
              </Button>
            </>
          ) : (
            <Link href="/login">
              <Button variant="outline" size="sm" className="border-white/40 bg-transparent text-white hover:bg-white/10">
                Iniciar sesión
              </Button>
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
