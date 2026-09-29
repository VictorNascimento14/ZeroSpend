"use client";

import { Brand } from "@/components/layout/brand";
import { ErrorScreen } from "@/components/layout/error-screen";

/**
 * Erro fora de uma página — na guarda de sessão, que é quem lê o armazenamento, ou nas telas de conta.
 * Sem a casca, que é justamente o que quebrou.
 */
export default function RootError(props: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 px-4 py-10">
      <Brand />
      <ErrorScreen {...props} />
    </main>
  );
}
