"use client";

import { Check, MoreHorizontal, Pencil, Trash2, X } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  DropdownMenuSeparator,
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
  const [deleting, setDeleting] = useState(false);
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={<Button variant="ghost" size="icon-sm" aria-label={`Ações de ${subscription.vendorName}`} />}
        >
          <MoreHorizontal />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {subscription.status === "review_needed" && (
            <>
              <DropdownMenuItem onClick={() => confirmDetection(subscription)}>
                <Check />
                Confirmar
              </DropdownMenuItem>
              <DropdownMenuItem variant="destructive" onClick={() => discardDetection(subscription)}>
                <X />
                Descartar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}
          <DropdownMenuItem
            onClick={() => {
              setSnapshot(subscription);
              setEditing(true);
            }}
          >
            <Pencil />
            Editar
          </DropdownMenuItem>
          {/* Em revisão, "Descartar" já é o excluir: a detecção estava errada. */}
          {subscription.status !== "review_needed" && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={() => setDeleting(true)}>
                <Trash2 />
                Excluir
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      <DeleteSubscriptionDialog subscription={subscription} open={deleting} onOpenChange={setDeleting} />
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

/** Confirma a exclusão e, depois, oferece "Desfazer" no aviso: a assinatura volta com o mesmo id. */
function DeleteSubscriptionDialog({
  subscription,
  open,
  onOpenChange,
}: {
  subscription: Subscription;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  function confirm() {
    const repository = getRepository();
    const removed = repository.removeSubscription(subscription.id);
    onOpenChange(false);
    toast.success(`Assinatura de ${removed.vendorName} excluída.`, {
      action: {
        label: "Desfazer",
        onClick: () => {
          try {
            repository.restoreSubscription(removed);
            toast.success(`Assinatura de ${removed.vendorName} de volta.`);
          } catch (reason) {
            toast.error(reason instanceof Error ? reason.message : "Não foi possível desfazer.");
          }
        },
      },
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir a assinatura de {subscription.vendorName}?</AlertDialogTitle>
          <AlertDialogDescription>
            Ela sai da tabela, do gasto mensal e dos alertas. Logo depois, dá para desfazer.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={confirm}>
            Excluir
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/** "Confirmar": quem revisa diz que a detecção é uma assinatura de verdade — ela vira ativa. */
export function confirmDetection(subscription: Subscription) {
  getRepository().updateSubscription(subscription.id, { status: "active" });
  toast.success(`Assinatura de ${subscription.vendorName} confirmada.`);
}

/** "Descartar": a detecção estava errada (compra avulsa, por exemplo) — sai da lista, com desfazer. */
export function discardDetection(subscription: Subscription) {
  const repository = getRepository();
  const removed = repository.removeSubscription(subscription.id);
  toast.success(`Detecção de ${removed.vendorName} descartada.`, {
    action: { label: "Desfazer", onClick: () => repository.restoreSubscription(removed) },
  });
}
