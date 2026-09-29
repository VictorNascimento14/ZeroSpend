import { SearchX } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Brand } from "@/components/layout/brand";
import { StatusScreen } from "@/components/layout/status-screen";
import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = { title: "Página não encontrada" };

/** Endereço que não existe. Fora da casca: vale com ou sem sessão, e o dashboard pede entrar se preciso. */
export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 px-4 py-10">
      <Brand />
      <StatusScreen
        icon={SearchX}
        title="Página não encontrada"
        description="O endereço não existe ou mudou de lugar."
        actions={
          <Link href="/dashboard" className={buttonVariants()}>
            Ir para o dashboard
          </Link>
        }
      />
    </main>
  );
}
