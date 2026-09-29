import type { Category } from "@/lib/domain/categories";
import type { BillingCycle, Currency } from "@/lib/domain/types";
import type { SubscriptionDraft } from "@/lib/domain/validation";

/**
 * Lê o formulário de assinatura. Não valida — quem valida é o repositório —, só converte: o valor vem
 * do `<input type="number">` já com ponto decimal, e a data do `<input type="date">` já em `YYYY-MM-DD`.
 */
export function readSubscriptionForm(
  form: FormData,
  rest: Pick<SubscriptionDraft, "status" | "source">,
): SubscriptionDraft {
  const text = (name: string) => String(form.get(name) ?? "").trim();
  return {
    vendorName: text("vendorName"),
    category: text("category") as Category,
    amount: text("amount") === "" ? Number.NaN : Number(text("amount")),
    currency: text("currency") as Currency,
    billingCycle: text("billingCycle") as BillingCycle,
    nextBillingDate: text("nextBillingDate"),
    ...rest,
  };
}
