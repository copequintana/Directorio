"use client";

import Image from "next/image";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";

export function SiteHeader() {
  const { data: session, status } = useSession();

  return (
    <header className="border-b border-border bg-card">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="flex items-center gap-2.5">
          <Image src="/logo-icon.png" alt="" width={40} height={40} className="h-10 w-10" priority />
          <span className="flex flex-col leading-tight">
            <span className="text-xs uppercase tracking-wide text-muted">ITSON</span>
            <span className="text-lg font-semibold text-primary">Directorio Telefónico</span>
          </span>
        </Link>

        <nav className="flex items-center gap-3 text-sm">
          <Link href="/" className="text-foreground hover:text-accent">
            Buscar
          </Link>
          {status === "authenticated" ? (
            <>
              <Link href="/admin" className="text-foreground hover:text-accent">
                Panel administrativo
              </Link>
              <span className="hidden text-muted sm:inline">{session.user?.name}</span>
              <Button variant="outline" size="sm" onClick={() => signOut({ callbackUrl: "/" })}>
                Salir
              </Button>
            </>
          ) : (
            <Link href="/login">
              <Button variant="outline" size="sm">
                Iniciar sesión
              </Button>
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
