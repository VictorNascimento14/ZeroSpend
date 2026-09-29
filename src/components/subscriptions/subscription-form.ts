import type { Category } from "@/lib/domain/categories";
import type { BillingCycle, Currency, SubscriptionStatus } from "@/lib/domain/types";
import type { SubscriptionDraft } from "@/lib/domain/validation";

/**
 * Lê o formulário de assinatura. Não valida — quem valida é o repositório —, só converte: o valor vem
 * do `<input type="number">` já com ponto decimal, e a data do `<input type="date">` já em `YYYY-MM-DD`.
 * O status vem do formulário quando ele tem o campo (edição); senão, do `rest` (cadastro).
 */
export function readSubscriptionForm(
  form: FormData,
  rest: Pick<SubscriptionDraft, "status" | "source">,
): SubscriptionDraft {
  const text = (name: string) => String(form.get(name) ?? "").trim();
  const status = form.has("status") ? (text("status") as SubscriptionStatus) : rest.status;
  return {
    vendorName: text("vendorName"),
    category: text("category") as Category,
    amount: text("amount") === "" ? Number.NaN : Number(text("amount")),
    currency: text("currency") as Currency,
    billingCycle: text("billingCycle") as BillingCycle,
    nextBillingDate: text("nextBillingDate"),
    source: rest.source,
    status,
    owner: text("owner"),
  };
}
