"use client";

import { Building2, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { VendorAvatar } from "@/components/subscriptions/vendor-avatar";
import { getRepository, useOrganizationData } from "@/lib/data/store";
import { monthlyAmountIn } from "@/lib/domain/billing";
import { CATEGORIES } from "@/lib/domain/categories";
import { formatMoney } from "@/lib/domain/format";
import { normalizeText as normalize } from "@/lib/domain/text";
import { NAV_ITEMS } from "./navigation";

/**
 * A busca global (⌘K / Ctrl+K): páginas, assinaturas da empresa atual e as outras empresas da pessoa.
 * Escolher uma assinatura abre a lista de Assinaturas filtrada por ela.
 */
export function GlobalSearch() {
  const data = useOrganizationData();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen((current) => !current);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  if (!data) return null;
  const { organization, organizations } = data.session;
  // Só renderiza no cliente (dentro da guarda de sessão): ler o navegador aqui não diverge da hidratação.
  const shortcut = /Mac|iPhone|iPad/.test(navigator.userAgent) ? "⌘K" : "Ctrl K";

  function go(href: string) {
    setOpen(false);
    router.push(href);
  }

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setOpen(true)}
        className="hidden w-60 justify-between rounded-full font-normal text-muted-foreground sm:inline-flex"
      >
        <span className="flex items-center gap-2">
          <Search />
          Buscar…
        </span>
        <kbd className="rounded-md border bg-muted px-1.5 font-sans text-xs">{shortcut}</kbd>
      </Button>
      <Button variant="ghost" size="icon" className="sm:hidden" aria-label="Buscar" onClick={() => setOpen(true)}>
        <Search />
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen} title="Busca" description="Páginas, assinaturas e empresas.">
        <Command filter={(value, search) => (normalize(value).includes(normalize(search)) ? 1 : 0)}>
          <CommandInput placeholder="Buscar página, assinatura ou empresa" />
          <CommandList>
            <CommandEmpty>Nada encontrado.</CommandEmpty>
            <CommandGroup heading="Páginas">
              {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
                <CommandItem key={href} value={`página ${label}`} onSelect={() => go(href)}>
                  <Icon />
                  {label}
                </CommandItem>
              ))}
            </CommandGroup>
            {data.subscriptions.length > 0 && (
              <CommandGroup heading={`Assinaturas de ${organization.name}`}>
                {data.subscriptions.map((subscription) => (
                  <CommandItem
                    key={subscription.id}
                    value={`${subscription.vendorName} ${CATEGORIES[subscription.category]} ${subscription.owner ?? ""}`}
                    onSelect={() => go(`/assinaturas?busca=${encodeURIComponent(subscription.vendorName)}`)}
                  >
                    <VendorAvatar name={subscription.vendorName} className="size-6 rounded-md text-[0.625rem]" />
                    {subscription.vendorName}
                    <span className="ml-auto text-xs text-muted-foreground tabular-nums">
                      {formatMoney(monthlyAmountIn(subscription, organization), organization.defaultCurrency)}/mês
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {organizations.length > 1 && (
              <CommandGroup heading="Empresas">
                {organizations
                  .filter((candidate) => candidate.id !== organization.id)
                  .map((candidate) => (
                    <CommandItem
                      key={candidate.id}
                      value={`empresa ${candidate.name}`}
                      onSelect={() => {
                        getRepository().selectOrganization(candidate.id);
                        setOpen(false);
                        toast.success(`Você está em ${candidate.name}.`);
                      }}
                    >
                      <Building2 />
                      Trocar para {candidate.name}
                    </CommandItem>
                  ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
}
