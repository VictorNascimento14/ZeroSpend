import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

// O tom do ícone, em classes literais: informação (404) ou alerta (erro).
const TONES = {
  info: "bg-cerulean-tint-50 text-cerulean-shade-100 dark:bg-cerulean-shade-300/40 dark:text-cerulean-tint-200",
  warning: "bg-warning-tint-50 text-warning-shade-300 dark:bg-warning-shade-300/40 dark:text-warning-tint-200",
} as const;

/** O miolo das telas de sistema (404 e erro): ícone, título, a explicação e as saídas. */
export function StatusScreen({
  icon: Icon,
  tone = "info",
  title,
  description,
  actions,
}: {
  icon: LucideIcon;
  tone?: keyof typeof TONES;
  title: string;
  description: string;
  actions: ReactNode;
}) {
  return (
    <div className="flex max-w-md flex-col items-center gap-4 text-center">
      <span className={cn("grid size-12 place-items-center rounded-full", TONES[tone])}>
        <Icon className="size-6" aria-hidden />
      </span>
      <h1 className="text-2xl">{title}</h1>
      <p className="text-muted-foreground">{description}</p>
      <div className="flex flex-wrap justify-center gap-3">{actions}</div>
    </div>
  );
}
