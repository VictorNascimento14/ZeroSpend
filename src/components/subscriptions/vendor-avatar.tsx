import { cn } from "@/lib/utils";

// Nenhum logotipo de terceiro: o fornecedor aparece como monograma numa cor do kit.
// ponytail: a cor sai do nome (estável); o catálogo de fornecedores (ordem 27) dá a cor dos conhecidos.
const TONES = [
  "bg-cerulean-tint-50 text-cerulean-shade-100 dark:bg-cerulean-shade-300/40 dark:text-cerulean-tint-200",
  "bg-raspberry-tint-50 text-raspberry-shade-100 dark:bg-raspberry-shade-300/40 dark:text-raspberry-tint-200",
  "bg-plum-tint-50 text-plum-shade-100 dark:bg-plum-shade-300/40 dark:text-plum-tint-200",
  "bg-success-tint-50 text-success-shade-200 dark:bg-success-shade-300/40 dark:text-success-tint-200",
  "bg-warning-tint-50 text-warning-shade-300 dark:bg-warning-shade-300/40 dark:text-warning-tint-200",
] as const;

export function VendorAvatar({ name, className }: { name: string; className?: string }) {
  let hash = 0;
  for (const char of name) hash = (hash * 31 + char.codePointAt(0)!) >>> 0;
  return (
    <span
      aria-hidden
      className={cn(
        "grid size-8 shrink-0 place-items-center rounded-lg text-xs font-semibold",
        TONES[hash % TONES.length],
        className,
      )}
    >
      {monogram(name)}
    </span>
  );
}

/** "Google Workspace" → "GW"; "Slack" → "SL". */
function monogram(name: string): string {
  const words = name.trim().split(/\s+/);
  const letters = words.length > 1 ? words[0][0] + words[1][0] : words[0].slice(0, 2);
  return letters.toUpperCase();
}
