"use client";

import { Plus } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ValidationError } from "@/lib/data/repository";
import { getRepository, useOrganizationData } from "@/lib/data/store";
import type { FieldErrors, SubscriptionDraft } from "@/lib/domain/validation";
import { readSubscriptionForm } from "./subscription-form";
import { SubscriptionFields } from "./subscription-fields";

/** "Nova assinatura": cadastro manual, que já nasce ativa (quem cadastra confirma). */
export function NewSubscriptionButton() {
  const data = useOrganizationData();
  const [open, setOpen] = useState(false);
  const [errors, setErrors] = useState<FieldErrors<SubscriptionDraft>>({});
  if (!data) return null;
  const { organization } = data.session;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const draft = readSubscriptionForm(new FormData(event.currentTarget), { status: "active", source: "manual" });
    try {
      const created = getRepository().addSubscription(organization.id, draft);
      setOpen(false);
      setErrors({});
      toast.success(`Assinatura de ${created.vendorName} cadastrada.`);
    } catch (reason) {
      if (reason instanceof ValidationError) setErrors(reason.fields as FieldErrors<SubscriptionDraft>);
      else toast.error(reason instanceof Error ? reason.message : "Não foi possível cadastrar.");
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setErrors({});
      }}
    >
      <DialogTrigger render={<Button />}>
        <Plus data-icon="inline-start" />
        Nova assinatura
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit} noValidate className="grid gap-4">
          <DialogHeader>
            <DialogTitle>Nova assinatura</DialogTitle>
            <DialogDescription>Um software que {organization.name} paga e que não veio do extrato.</DialogDescription>
          </DialogHeader>
          <SubscriptionFields defaultCurrency={organization.defaultCurrency} errors={errors} />
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>Cancelar</DialogClose>
            <Button type="submit">Cadastrar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
