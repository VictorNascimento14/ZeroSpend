"use client";

import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ValidationError } from "@/lib/data/repository";
import { getRepository, useSession } from "@/lib/data/store";
import { DEFAULT_RENEWAL_LEAD_DAYS, RENEWAL_LEAD_OPTIONS, type AlertSettings } from "@/lib/domain/alerts";
import type { Organization } from "@/lib/domain/types";
import type { FieldErrors } from "@/lib/domain/validation";

const LEAD_ITEMS = RENEWAL_LEAD_OPTIONS.map((days) => ({
  value: String(days),
  label: `${days} dias antes${days === DEFAULT_RENEWAL_LEAD_DAYS ? " (padrão)" : ""}`,
}));

const CHANNELS = [
  { name: "email", label: "E-mail", description: "Para quem administra a empresa." },
  { name: "whatsapp", label: "WhatsApp", description: "O número não é pedido nesta versão, que não envia nada." },
] as const;

/**
 * Antecedência e canais de alerta da empresa atual. A antecedência vale já, no app inteiro; os canais
 * ficam guardados, e a tela diz que nada é enviado nesta versão.
 */
export function AlertSettings() {
  const session = useSession();
  if (!session) return null;
  // A chave refaz o formulário ao trocar de empresa: os valores iniciais são os da nova.
  return <AlertSettingsForm key={session.organization.id} organization={session.organization} canEdit={session.role === "admin"} />;
}

function AlertSettingsForm({ organization: current, canEdit }: { organization: Organization; canEdit: boolean }) {
  // Cópia tirada ao montar: o valor inicial de campo não controlado não muda depois de salvar.
  const [organization] = useState(current);
  const [errors, setErrors] = useState<FieldErrors<AlertSettings>>({});

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      getRepository().updateAlertSettings(organization.id, {
        renewalLeadDays: Number(form.get("renewalLeadDays")),
        // O Switch do Base UI manda "on" no formulário quando está ligado, e nada quando não está.
        alertChannels: { email: form.get("email") === "on", whatsapp: form.get("whatsapp") === "on" },
      });
      setErrors({});
      toast.success("Preferências de alerta salvas.");
    } catch (reason) {
      if (reason instanceof ValidationError) setErrors(reason.fields as FieldErrors<AlertSettings>);
      else toast.error(reason instanceof Error ? reason.message : "Não foi possível salvar.");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Alertas</CardTitle>
        <CardDescription>Quando uma renovação vira alerta e por onde a empresa quer ser avisada.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} noValidate className="grid gap-6">
          <Field>
            <FieldLabel htmlFor="alertas-renewalLeadDays">Antecedência</FieldLabel>
            <Select
              name="renewalLeadDays"
              items={LEAD_ITEMS}
              defaultValue={String(organization.renewalLeadDays)}
              disabled={!canEdit}
            >
              <SelectTrigger
                id="alertas-renewalLeadDays"
                className="w-full sm:w-64"
                aria-invalid={Boolean(errors.renewalLeadDays)}
                aria-describedby="alertas-renewalLeadDays-dica"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LEAD_ITEMS.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldDescription id="alertas-renewalLeadDays-dica">
              Quantos dias antes da cobrança a renovação aparece no sino, na central de alertas e no dashboard.
            </FieldDescription>
            <FieldError>{errors.renewalLeadDays}</FieldError>
          </Field>
          <FieldSet>
            <FieldLegend variant="label">Canais</FieldLegend>
            <FieldDescription>
              Nesta versão nada é enviado: os alertas aparecem só no app. A escolha fica guardada para quando o
              envio existir.
            </FieldDescription>
            {CHANNELS.map((channel) => (
              <Field key={channel.name} orientation="horizontal">
                <Switch
                  id={`alertas-${channel.name}`}
                  name={channel.name}
                  defaultChecked={organization.alertChannels[channel.name]}
                  disabled={!canEdit}
                  aria-describedby={`alertas-${channel.name}-dica`}
                />
                <FieldContent>
                  <FieldLabel htmlFor={`alertas-${channel.name}`}>{channel.label}</FieldLabel>
                  <FieldDescription id={`alertas-${channel.name}-dica`}>{channel.description}</FieldDescription>
                </FieldContent>
              </Field>
            ))}
            <FieldError>{errors.alertChannels}</FieldError>
          </FieldSet>
          {canEdit ? (
            <div>
              <Button type="submit">Salvar</Button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Só quem administra a empresa altera estes dados.</p>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
