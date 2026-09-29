import { knownVendorByName, type VendorTone } from "@/lib/import/vendors";
import { cn } from "@/lib/utils";

// Nenhum logotipo de terceiro: o fornecedor aparece como monograma numa cor do kit — a do catálogo,
// quando ele é conhecido; senão, uma cor estável tirada do nome.
const TONES: Record<VendorTone, string> = {
  cerulean: "bg-cerulean-tint-50 text-cerulean-shade-100 dark:bg-cerulean-shade-300/40 dark:text-cerulean-tint-200",
  raspberry: "bg-raspberry-tint-50 text-raspberry-shade-100 dark:bg-raspberry-shade-300/40 dark:text-raspberry-tint-200",
  plum: "bg-plum-tint-50 text-plum-shade-100 dark:bg-plum-shade-300/40 dark:text-plum-tint-200",
  success: "bg-success-tint-50 text-success-shade-200 dark:bg-success-shade-300/40 dark:text-success-tint-200",
  warning: "bg-warning-tint-50 text-warning-shade-300 dark:bg-warning-shade-300/40 dark:text-warning-tint-200",
};
const TONE_ORDER = Object.keys(TONES) as VendorTone[];

function toneFor(name: string): VendorTone {
  const known = knownVendorByName(name);
  if (known) return known.tone;
  let hash = 0;
  for (const char of name) hash = (hash * 31 + char.codePointAt(0)!) >>> 0;
  return TONE_ORDER[hash % TONE_ORDER.length];
}

export function VendorAvatar({ name, className }: { name: string; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "grid size-8 shrink-0 place-items-center rounded-lg text-xs font-semibold",
        TONES[toneFor(name)],
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
