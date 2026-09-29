"use client";

import { ErrorScreen } from "@/components/layout/error-screen";

/** Erro numa página do app: a casca continua, e o erro ocupa só o conteúdo. */
export default function AppError(props: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <div className="grid place-items-center py-16">
      <ErrorScreen {...props} />
    </div>
  );
}
