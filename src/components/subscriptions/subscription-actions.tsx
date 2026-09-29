"use client";

import { MoreHorizontal, Pencil } from "lucide-react";
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
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ValidationError } from "@/lib/data/repository";
import { getRepository } from "@/lib/data/store";
import type { Currency, Subscription } from "@/lib/domain/types";
import type { FieldErrors, SubscriptionDraft } from "@/lib/domain/validation";
import { readSubscriptionForm } from "./subscription-form";
import { SubscriptionFields } from "./subscription-fields";

/** O menu de ações de uma linha da tabela. */
export function SubscriptionActions({
  subscription,
  defaultCurrency,
}: {
  subscription: Subscription;
  defaultCurrency: Currency;
}) {
  const [editing, setEditing] = useState(false);
  // O diálogo trabalha sobre a assinatura como estava ao abrir: se ela mudasse durante a animação de
  // saída, os campos receberiam valores iniciais novos depois de montados (o Base UI avisa).
  const [snapshot, setSnapshot] = useState(subscription);
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={<Button variant="ghost" size="icon-sm" aria-label={`Ações de ${subscription.vendorName}`} />}
        >
          <MoreHorizontal />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={() => {
              setSnapshot(subscription);
              setEditing(true);
            }}
          >
            <Pencil />
            Editar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <EditSubscriptionDialog
        subscription={snapshot}
        defaultCurrency={defaultCurrency}
        open={editing}
        onOpenChange={setEditing}
      />
    </>
  );
}

function EditSubscriptionDialog({
  subscription,
  defaultCurrency,
  open,
  onOpenChange,
}: {
  subscription: Subscription;
  defaultCurrency: Currency;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [errors, setErrors] = useState<FieldErrors<SubscriptionDraft>>({});

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const changes = readSubscriptionForm(new FormData(event.currentTarget), subscription);
    try {
      const updated = getRepository().updateSubscription(subscription.id, changes);
      onOpenChange(false);
      setErrors({});
      toast.success(`Assinatura de ${updated.vendorName} atualizada.`);
    } catch (reason) {
      if (reason instanceof ValidationError) setErrors(reason.fields as FieldErrors<SubscriptionDraft>);
      else toast.error(reason instanceof Error ? reason.message : "Não foi possível salvar.");
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) setErrors({});
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit} noValidate className="grid gap-4">
          <DialogHeader>
            <DialogTitle>Editar {subscription.vendorName}</DialogTitle>
            <DialogDescription>Valor, ciclo, próxima cobrança, status e responsável.</DialogDescription>
          </DialogHeader>
          <SubscriptionFields defaults={subscription} defaultCurrency={defaultCurrency} errors={errors} withStatus />
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>Cancelar</DialogClose>
            <Button type="submit">Salvar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
