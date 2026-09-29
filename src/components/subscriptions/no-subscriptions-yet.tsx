import { FileUp } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

/** A empresa sem nenhuma assinatura: o caminho mais curto até a primeira é o extrato do cartão. */
export function NoSubscriptionsYet() {
  return (
    <div className="flex flex-wrap items-center gap-3 text-sm">
      <p className="text-muted-foreground">
        Nenhuma assinatura cadastrada nesta empresa. Importe do extrato do cartão ou use &ldquo;Nova
        assinatura&rdquo;.
      </p>
      <Link href="/onboarding" className={buttonVariants({ variant: "outline", size: "sm" })}>
        <FileUp data-icon="inline-start" aria-hidden />
        Importar do extrato
      </Link>
    </div>
  );
}
