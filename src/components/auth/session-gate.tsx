"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { currentSession } from "@/lib/data/repository";
import { useDatabase } from "@/lib/data/store";

/**
 * Guarda de rota da v1: sem sessão, manda para `/entrar` (com o caminho de volta). Protege o fluxo,
 * não o dado — o dado está no navegador de qualquer jeito (ADR-001). Enquanto os dados locais não
 * chegam (servidor e hidratação), mostra a moldura da casca vazia.
 */
export function SessionGate({ children }: { children: ReactNode }) {
  const database = useDatabase();
  const router = useRouter();
  const pathname = usePathname();
  const signedIn = database !== null && currentSession(database) !== null;

  useEffect(() => {
    if (database && !signedIn) router.replace(`/entrar?para=${encodeURIComponent(pathname)}`);
  }, [database, signedIn, pathname, router]);

  return signedIn ? children : <ShellSkeleton />;
}

function ShellSkeleton() {
  return (
    <div className="flex min-h-dvh" aria-busy="true">
      <span className="sr-only">Carregando…</span>
      <div className="hidden w-64 shrink-0 border-r bg-card md:block" />
      <div className="flex flex-1 flex-col">
        <div className="h-14 border-b bg-card" />
        <div className="space-y-2 px-4 py-6 md:px-6">
          <Skeleton className="h-8 w-48 bg-accent" />
          <Skeleton className="h-5 w-80 max-w-full bg-accent" />
        </div>
      </div>
    </div>
  );
}
