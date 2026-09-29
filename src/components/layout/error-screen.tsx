"use client";

import { TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { StatusScreen } from "./status-screen";

/**
 * O que aparece quando uma tela quebra. O caso que a v1 conhece de nome é o armazenamento: sem ele
 * (janela anônima de alguns navegadores, site bloqueado, cota cheia), não há onde guardar os dados.
 */
export function ErrorScreen({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const storage = storageProblem(error);
  return (
    <StatusScreen
      icon={TriangleAlert}
      tone="warning"
      title={storage ? "O navegador não deixou guardar os dados" : "Algo deu errado nesta tela"}
      description={
        storage === "blocked"
          ? "Nesta versão, o ZeroSpend guarda os dados só neste navegador. Libere o armazenamento do site (ou saia da janela anônima) e tente de novo."
          : storage === "full"
            ? "O armazenamento deste navegador para o site está cheio. Libere espaço nos dados do site e tente de novo."
            : "Tente de novo. Se o erro continuar, recarregue a página."
      }
      actions={
        <>
          <Button onClick={() => retry()}>Tentar de novo</Button>
          {/* O contornado tem o fundo da página: sobre ela, só o fundo do card o destaca. */}
          <Link href="/dashboard" className={cn(buttonVariants({ variant: "outline" }), "bg-card")}>
            Ir para o dashboard
          </Link>
        </>
      }
    />
  );
}

/** O navegador recusa o `localStorage` com `SecurityError` (bloqueado) ou `QuotaExceededError` (cheio). */
function storageProblem(error: Error): "blocked" | "full" | null {
  if (error.name === "SecurityError") return "blocked";
  if (error.name === "QuotaExceededError") return "full";
  return null;
}
