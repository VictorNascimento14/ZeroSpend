"use client";

import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ValidationError } from "@/lib/data/repository";
import { getRepository, useSession } from "@/lib/data/store";
import { CURRENCY_LABELS } from "@/lib/domain/format";
import { CURRENCIES, type Currency, type Organization } from "@/lib/domain/types";
import type { FieldErrors, OrganizationDraft } from "@/lib/domain/validation";

const CURRENCY_ITEMS = CURRENCIES.map((code) => ({ value: code, label: CURRENCY_LABELS[code] }));

/** Nome, moeda padrão e cotação da empresa atual. Quem não administra vê, mas não muda. */
export function OrganizationSettings() {
  const session = useSession();
  if (!session) return null;
  // A chave refaz o formulário ao trocar de empresa: os valores iniciais são os da nova.
  return <OrganizationForm key={session.organization.id} organization={session.organization} canEdit={session.role === "admin"} />;
}

function OrganizationForm({ organization: current, canEdit }: { organization: Organization; canEdit: boolean }) {
  // Os valores iniciais são uma cópia tirada ao montar: depois de salvar, a empresa muda, e o Base UI
  // avisa quando o valor inicial de um campo não controlado muda depois de montado.
  const [organization] = useState(current);
  const [errors, setErrors] = useState<FieldErrors<OrganizationDraft>>({});

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const text = (name: keyof OrganizationDraft) => String(form.get(name) ?? "").trim();
    try {
      getRepository().updateOrganization(organization.id, {
        name: text("name"),
        defaultCurrency: text("defaultCurrency") as Currency,
        // O `<input type="number">` já entrega o ponto decimal, qualquer que seja o idioma do navegador.
        brlPerUsd: text("brlPerUsd") === "" ? Number.NaN : Number(text("brlPerUsd")),
      });
      setErrors({});
      toast.success("Dados da empresa salvos.");
    } catch (reason) {
      if (reason instanceof ValidationError) setErrors(reason.fields as FieldErrors<OrganizationDraft>);
      else toast.error(reason instanceof Error ? reason.message : "Não foi possível salvar.");
    }
  }

  // Liga o campo à dica e ao erro para o leitor de tela; o erro pinta a borda pelo `aria-invalid`.
  const describe = (name: keyof OrganizationDraft, hint?: boolean) => ({
    "aria-invalid": Boolean(errors[name]),
    "aria-describedby": [hint && `empresa-${name}-dica`, errors[name] && `empresa-${name}-erro`].filter(Boolean).join(" ") || undefined,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Empresa</CardTitle>
        <CardDescription>O nome no seletor do topo, a moeda dos totais e a cotação que converte o dólar.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} noValidate className="grid gap-4 sm:grid-cols-2">
          <Field className="sm:col-span-2">
            <FieldLabel htmlFor="empresa-name">Nome da empresa</FieldLabel>
            <Input
              id="empresa-name"
              name="name"
              autoComplete="organization"
              defaultValue={organization.name}
              disabled={!canEdit}
              {...describe("name")}
            />
            <FieldError id="empresa-name-erro">{errors.name}</FieldError>
          </Field>
          <Field>
            <FieldLabel htmlFor="empresa-defaultCurrency">Moeda padrão</FieldLabel>
            <Select name="defaultCurrency" items={CURRENCY_ITEMS} defaultValue={organization.defaultCurrency} disabled={!canEdit}>
              <SelectTrigger id="empresa-defaultCurrency" className="w-full" {...describe("defaultCurrency", true)}>
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
            <FieldDescription id="empresa-defaultCurrency-dica">
              Usada no gasto mensal, na economia e nas assinaturas novas.
            </FieldDescription>
            <FieldError id="empresa-defaultCurrency-erro">{errors.defaultCurrency}</FieldError>
          </Field>
          <Field>
            <FieldLabel htmlFor="empresa-brlPerUsd">Cotação do dólar</FieldLabel>
            <Input
              id="empresa-brlPerUsd"
              name="brlPerUsd"
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0.01"
              defaultValue={organization.brlPerUsd}
              disabled={!canEdit}
              {...describe("brlPerUsd", true)}
            />
            <FieldDescription id="empresa-brlPerUsd-dica">
              Quantos reais vale um dólar. Converte as assinaturas em outra moeda para os totais.
            </FieldDescription>
            <FieldError id="empresa-brlPerUsd-erro">{errors.brlPerUsd}</FieldError>
          </Field>
          {canEdit ? (
            <div className="sm:col-span-2">
              <Button type="submit">Salvar</Button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground sm:col-span-2">Só quem administra a empresa altera estes dados.</p>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
