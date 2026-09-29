import type { ReactNode } from "react";

/** O topo de cada página: o título (H4 do kit), a frase que diz para que ela serve e as ações. */
export function PageHeader({ title, description, actions }: { title: string; description: string; actions?: ReactNode }) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div className="space-y-1">
        <h1 className="text-2xl">{title}</h1>
        <p className="text-muted-foreground">{description}</p>
      </div>
      {actions}
    </header>
  );
}
