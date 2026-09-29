import { Skeleton } from "@/components/ui/skeleton";

/** Enquanto a página nova chega, a casca fica e o conteúdo mostra o formato: título, descrição e cards. */
export default function AppLoading() {
  return (
    <div className="space-y-6" aria-busy="true">
      <span className="sr-only">Carregando…</span>
      <div className="space-y-2">
        <Skeleton className="h-8 w-48 bg-accent" />
        <Skeleton className="h-5 w-80 max-w-full bg-accent" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-32 rounded-xl bg-accent" />
        ))}
      </div>
      <Skeleton className="h-64 rounded-xl bg-accent" />
    </div>
  );
}
