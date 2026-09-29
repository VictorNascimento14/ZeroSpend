"use client";

import type { ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CATEGORIES, CATEGORY_IDS } from "@/lib/domain/categories";
import { BILLING_CYCLE_LABELS, STATUS_LABELS } from "@/lib/domain/format";
import { BILLING_CYCLES, CURRENCIES, SUBSCRIPTION_STATUSES, type Currency } from "@/lib/domain/types";
import { OWNER_MAX } from "@/lib/domain/validation";
import type { FieldErrors, SubscriptionDraft } from "@/lib/domain/validation";
import { cn } from "@/lib/utils";

const CATEGORY_ITEMS = CATEGORY_IDS.map((id) => ({ value: id, label: CATEGORIES[id] }));
const CURRENCY_ITEMS = CURRENCIES.map((code) => ({ value: code, label: code === "BRL" ? "Real (R$)" : "Dólar (US$)" }));
const CYCLE_ITEMS = BILLING_CYCLES.map((cycle) => ({ value: cycle, label: BILLING_CYCLE_LABELS[cycle] }));
const STATUS_ITEMS = SUBSCRIPTION_STATUSES.map((status) => ({ value: status, label: STATUS_LABELS[status] }));

type Errors = FieldErrors<SubscriptionDraft>;

/** Os campos de uma assinatura — os mesmos no cadastro e na edição (que mostra também o status). */
export function SubscriptionFields({
  defaults,
  defaultCurrency,
  errors,
  withStatus = false,
}: {
  defaults?: Partial<SubscriptionDraft>;
  defaultCurrency: Currency;
  errors: Errors;
  withStatus?: boolean;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field name="vendorName" label="Software" errors={errors} className="sm:col-span-2">
        <Input
          id="vendorName"
          name="vendorName"
          defaultValue={defaults?.vendorName}
          placeholder="Ex.: Slack"
          autoComplete="off"
          {...invalid("vendorName", errors)}
        />
      </Field>
      <Field name="category" label="Categoria" errors={errors}>
        <Select name="category" items={CATEGORY_ITEMS} defaultValue={defaults?.category ?? null}>
          <SelectTrigger id="category" className="w-full" {...invalid("category", errors)}>
            <SelectValue placeholder="Escolha a categoria" />
          </SelectTrigger>
          <SelectContent>
            {CATEGORY_ITEMS.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <Field name="amount" label="Valor" hint="De uma cobrança: no plano anual, o valor do ano." errors={errors}>
        <Input
          id="amount"
          name="amount"
          type="number"
          inputMode="decimal"
          step="0.01"
          min="0.01"
          defaultValue={defaults?.amount}
          {...invalid("amount", errors, "amount-dica")}
        />
      </Field>
      <Field name="currency" label="Moeda" errors={errors}>
        <Select name="currency" items={CURRENCY_ITEMS} defaultValue={defaults?.currency ?? defaultCurrency}>
          <SelectTrigger id="currency" className="w-full" {...invalid("currency", errors)}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CURRENCY_ITEMS.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <Field name="billingCycle" label="Ciclo" errors={errors}>
        <Select name="billingCycle" items={CYCLE_ITEMS} defaultValue={defaults?.billingCycle ?? "monthly"}>
          <SelectTrigger id="billingCycle" className="w-full" {...invalid("billingCycle", errors)}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CYCLE_ITEMS.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <Field name="nextBillingDate" label="Próxima cobrança" errors={errors} className={withStatus ? undefined : "sm:col-span-2"}>
        <Input
          id="nextBillingDate"
          name="nextBillingDate"
          type="date"
          defaultValue={defaults?.nextBillingDate}
          {...invalid("nextBillingDate", errors)}
        />
      </Field>
      {withStatus && (
        <Field name="status" label="Status" errors={errors}>
          <Select name="status" items={STATUS_ITEMS} defaultValue={defaults?.status ?? "active"}>
            <SelectTrigger id="status" className="w-full" {...invalid("status", errors)}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_ITEMS.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      )}
      <Field name="owner" label="Responsável" hint="Opcional. Quem responde por esta ferramenta na empresa." errors={errors} className="sm:col-span-2">
        <Input
          id="owner"
          name="owner"
          defaultValue={defaults?.owner}
          maxLength={OWNER_MAX}
          autoComplete="off"
          {...invalid("owner", errors, "owner-dica")}
        />
      </Field>
    </div>
  );
}

function Field({
  name,
  label,
  hint,
  errors,
  className,
  children,
}: {
  name: keyof SubscriptionDraft;
  label: string;
  hint?: string;
  errors: Errors;
  className?: string;
  children: ReactNode;
}) {
  const error = errors[name];
  return (
    <div className={cn("grid content-start gap-2", className)}>
      <Label htmlFor={name}>{label}</Label>
      {children}
      {hint && !error && (
        <p id={`${name}-dica`} className="text-xs text-muted-foreground">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${name}-erro`} className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

/** Liga o campo ao erro (e à dica) para o leitor de tela, e pinta o erro pelo `aria-invalid`. */
function invalid(name: keyof SubscriptionDraft, errors: Errors, hintId?: string) {
  const error = errors[name];
  const describedBy = error ? `${name}-erro` : hintId;
  return { "aria-invalid": Boolean(error), "aria-describedby": describedBy };
}
