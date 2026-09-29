import type { ReactNode } from "react";
import { Brand } from "@/components/layout/brand";

/** Telas de conta (entrar, criar conta): fora da casca, centradas sobre o fundo. */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 px-4 py-10">
      <Brand />
      {children}
    </main>
  );
}
