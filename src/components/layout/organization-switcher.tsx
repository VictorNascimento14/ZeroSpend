"use client";

import { Building2, ChevronsUpDown, Plus } from "lucide-react";
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
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ValidationError } from "@/lib/data/repository";
import { getRepository, useSession } from "@/lib/data/store";

/** O seletor de empresa do header: quem cuida de várias (o BPO financeiro) troca por aqui. */
export function OrganizationSwitcher() {
  const session = useSession();
  const [creating, setCreating] = useState(false);
  if (!session) return null;
  const { organization, organizations } = session;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="ghost" className="min-w-0 max-w-64 justify-start px-2" />}>
          <Building2 className="shrink-0" />
          <span className="sr-only">Empresa:</span>
          <span className="truncate">{organization.name}</span>
          <ChevronsUpDown className="shrink-0 text-muted-foreground" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64">
          <DropdownMenuGroup>
            <DropdownMenuLabel>Empresas</DropdownMenuLabel>
            <DropdownMenuRadioGroup
              value={organization.id}
              onValueChange={(id) => getRepository().selectOrganization(String(id))}
            >
              {organizations.map((candidate) => (
                <DropdownMenuRadioItem key={candidate.id} value={candidate.id} closeOnClick>
                  <span className="truncate">{candidate.name}</span>
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setCreating(true)}>
            <Plus />
            Nova empresa
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <NewOrganizationDialog open={creating} onOpenChange={setCreating} />
    </>
  );
}

function NewOrganizationDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const created = getRepository().addOrganization(String(new FormData(event.currentTarget).get("name") ?? ""));
      onOpenChange(false);
      setError(null);
      toast.success(`Você está em ${created.name}.`);
    } catch (reason) {
      if (reason instanceof ValidationError) setError((reason.fields as { name?: string }).name ?? null);
      else setError(reason instanceof Error ? reason.message : "Não foi possível criar a empresa.");
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) setError(null);
      }}
    >
      <DialogContent>
        <form onSubmit={handleSubmit} noValidate className="grid gap-4">
          <DialogHeader>
            <DialogTitle>Nova empresa</DialogTitle>
            <DialogDescription>Você entra nela com acesso de administração. Os valores começam em real.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            <Label htmlFor="nova-empresa">Nome da empresa</Label>
            <Input
              id="nova-empresa"
              name="name"
              autoComplete="organization"
              aria-invalid={Boolean(error)}
              aria-describedby={error ? "nova-empresa-erro" : undefined}
            />
            {error && (
              <p id="nova-empresa-erro" className="text-sm text-destructive">
                {error}
              </p>
            )}
          </div>
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>Cancelar</DialogClose>
            <Button type="submit">Criar empresa</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
