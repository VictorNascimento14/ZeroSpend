"use client";

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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ValidationError } from "@/lib/data/repository";
import { getRepository, useMembers, useSession, type Member } from "@/lib/data/store";
import { formatDate, initials, ROLE_LABELS } from "@/lib/domain/format";
import { ROLES, type Role } from "@/lib/domain/types";
import type { FieldErrors, InviteDraft } from "@/lib/domain/validation";

const ROLE_ITEMS = ROLES.map((role) => ({ value: role, label: ROLE_LABELS[role] }));

/**
 * Quem tem acesso à empresa, os convites pendentes e o convite novo. Nesta versão nada é enviado por
 * e-mail, e a tela diz o que o convite faz de verdade: vale quando a pessoa cria a conta neste navegador.
 */
export function MembersSettings() {
  const session = useSession();
  const data = useMembers();
  if (!session || !data) return null;
  const { organization, role, user: me } = session;
  const canEdit = role === "admin";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Membros</CardTitle>
        <CardDescription>Quem tem acesso a {organization.name} e os convites que ainda não viraram conta.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6">
        <ul className="divide-y divide-border rounded-lg border">
          {data.members.map((member) => (
            <li key={member.user.id} className="flex flex-wrap items-center gap-3 p-3">
              <Avatar className="size-8">
                <AvatarFallback>{initials(member.user.name)}</AvatarFallback>
              </Avatar>
              <span className="grid min-w-0 flex-1 basis-48">
                <span className="flex flex-wrap items-center gap-2 text-sm font-medium">
                  {member.user.name}
                  {member.user.id === me.id && <Badge variant="outline">Você</Badge>}
                </span>
                <span className="truncate text-sm text-muted-foreground">{member.user.email}</span>
              </span>
              <Badge variant="secondary">{ROLE_LABELS[member.role]}</Badge>
              {canEdit && member.user.id !== me.id && <RemoveMemberButton organizationId={organization.id} member={member} />}
            </li>
          ))}
        </ul>
        {data.invitations.length > 0 && (
          <section aria-labelledby="convites-pendentes" className="grid gap-2">
            <h3 id="convites-pendentes" className="text-sm font-medium">
              Convites pendentes
            </h3>
            <ul className="divide-y divide-border rounded-lg border">
              {data.invitations.map((invitation) => (
                <li key={invitation.id} className="flex flex-wrap items-center gap-3 p-3">
                  <span className="grid min-w-0 flex-1 basis-48">
                    <span className="truncate text-sm font-medium">{invitation.email}</span>
                    <span className="text-sm text-muted-foreground">
                      {ROLE_LABELS[invitation.role]} · convite de {formatDate(invitation.invitedAt)}
                    </span>
                  </span>
                  {canEdit && (
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label={`Cancelar o convite de ${invitation.email}`}
                      onClick={() => {
                        getRepository().revokeInvitation(invitation.id);
                        toast.success("Convite cancelado.");
                      }}
                    >
                      Cancelar convite
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}
        {canEdit ? (
          <InviteForm key={organization.id} organizationId={organization.id} />
        ) : (
          <p className="text-sm text-muted-foreground">Só quem administra a empresa convida e remove pessoas.</p>
        )}
      </CardContent>
    </Card>
  );
}

function InviteForm({ organizationId }: { organizationId: string }) {
  const [errors, setErrors] = useState<FieldErrors<InviteDraft>>({});

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    try {
      const result = getRepository().inviteMember(organizationId, {
        email: String(form.get("email") ?? ""),
        role: String(form.get("role") ?? "") as Role,
      });
      setErrors({});
      formElement.reset();
      toast.success(
        result.kind === "added"
          ? `${result.user.name} já tinha conta neste navegador e agora faz parte da empresa.`
          : `Convite criado para ${result.invitation.email}.`,
      );
    } catch (reason) {
      if (reason instanceof ValidationError) setErrors(reason.fields as FieldErrors<InviteDraft>);
      else toast.error(reason instanceof Error ? reason.message : "Não foi possível convidar.");
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_12rem_auto] sm:items-start">
      <Field>
        <FieldLabel htmlFor="convite-email">E-mail da pessoa</FieldLabel>
        <Input
          id="convite-email"
          name="email"
          type="email"
          autoComplete="off"
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? "convite-email-erro" : "convite-dica"}
        />
        <FieldError id="convite-email-erro">{errors.email}</FieldError>
      </Field>
      <Field>
        <FieldLabel htmlFor="convite-role">Papel</FieldLabel>
        <Select name="role" items={ROLE_ITEMS} defaultValue="member">
          <SelectTrigger id="convite-role" className="w-full" aria-invalid={Boolean(errors.role)}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ROLE_ITEMS.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FieldError>{errors.role}</FieldError>
      </Field>
      {/* Alinha o botão com os campos, descontando a altura do rótulo. */}
      <Button type="submit" className="sm:mt-[1.625rem]">
        Convidar
      </Button>
      <FieldDescription id="convite-dica" className="sm:col-span-3">
        Nesta versão o convite não é enviado por e-mail. Quem criar conta com este e-mail, neste navegador,
        entra na empresa; quem já tem conta aqui entra na hora.
      </FieldDescription>
    </form>
  );
}

function RemoveMemberButton({ organizationId, member }: { organizationId: string; member: Member }) {
  function confirm() {
    try {
      getRepository().removeMember(organizationId, member.user.id);
      toast.success(`Acesso de ${member.user.name} removido.`);
    } catch (reason) {
      toast.error(reason instanceof Error ? reason.message : "Não foi possível remover.");
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger render={<Button variant="ghost" size="sm" aria-label={`Remover o acesso de ${member.user.name}`} />}>
        Remover
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remover o acesso de {member.user.name}?</AlertDialogTitle>
          <AlertDialogDescription>
            A conta continua existindo, mas deixa de ver esta empresa. Para voltar, é preciso um convite novo.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={confirm}>
            Remover
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
