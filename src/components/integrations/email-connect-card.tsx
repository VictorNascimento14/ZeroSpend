"use client";

import { FileText, Search, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { VendorAvatar } from "@/components/subscriptions/vendor-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { CATEGORIES } from "@/lib/domain/categories";
import { toIsoDate } from "@/lib/domain/dates";
import { formatDate, formatMoney, plural } from "@/lib/domain/format";
import { demoInvoices, EMAIL_PROVIDERS, type EmailProvider } from "@/lib/import/email";

/**
 * A conexão com a caixa de e-mail da empresa, simulada: a v1 não tem servidor para o OAuth nem para ler
 * mensagens (ADR-001). A tela mostra o que a conexão faria e um resultado de exemplo — e não importa
 * nada, para não pôr assinatura inventada na empresa de ninguém.
 */
export function EmailConnectCard() {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <CardTitle>E-mail da empresa</CardTitle>
          <Badge variant="secondary">Demonstração</Badge>
        </div>
        <CardDescription>
          Faturas e recibos de software que chegam por e-mail. Nesta versão a conexão é simulada: nada é lido
          da sua caixa de entrada.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-3">
        {EMAIL_PROVIDERS.map((provider) => (
          <ConnectDialog key={provider.id} provider={provider} />
        ))}
      </CardContent>
    </Card>
  );
}

function ConnectDialog({ provider }: { provider: EmailProvider }) {
  const [simulated, setSimulated] = useState(false);
  const invoices = simulated ? demoInvoices(toIsoDate(new Date())) : [];

  return (
    // Volta ao começo ao abrir, não ao fechar: fechando, o conteúdo trocaria durante a animação de saída.
    <Dialog
      onOpenChange={(open) => {
        if (open) setSimulated(false);
      }}
    >
      <DialogTrigger render={<Button variant="outline" />}>
        <VendorAvatar name={provider.name} className="size-5 rounded text-[0.625rem]" />
        Conectar {provider.name}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Conectar o {provider.name}</DialogTitle>
          <DialogDescription>
            Demonstração: nesta versão não há servidor, então nada é lido do seu e-mail.
          </DialogDescription>
        </DialogHeader>
        {simulated ? (
          <div className="grid gap-3 text-sm">
            <p className="font-medium">
              {plural(invoices.length, "fatura de exemplo encontrada", "faturas de exemplo encontradas")}
            </p>
            <ul className="divide-y divide-border rounded-lg border border-border">
              {invoices.map((invoice) => (
                <li key={invoice.vendorName} className="flex items-center gap-3 p-3">
                  <VendorAvatar name={invoice.vendorName} />
                  <span className="grid min-w-0 flex-1">
                    <span className="font-medium">{invoice.vendorName}</span>
                    <span className="text-muted-foreground">
                      {CATEGORIES[invoice.category]} · {formatDate(invoice.date)}
                    </span>
                  </span>
                  <span className="tabular-nums">{formatMoney(invoice.amount, invoice.currency)}</span>
                </li>
              ))}
            </ul>
            <p className="text-muted-foreground">
              É tudo o que ficaria de cada fatura: fornecedor, valor, moeda, data e categoria. Nada foi
              importado.
            </p>
          </div>
        ) : (
          <div className="grid gap-3 text-sm">
            <p className="font-medium">O que a conexão faria</p>
            <ul className="grid gap-2">
              <li className="flex gap-2">
                <ShieldCheck className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
                <span>
                  Pediria permissão só de leitura (<code className="text-xs">{provider.scope}</code>).
                </span>
              </li>
              <li className="flex gap-2">
                <Search className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
                <span>
                  Procuraria só mensagens com &ldquo;fatura&rdquo;, &ldquo;cobrança&rdquo;, &ldquo;comprovante&rdquo;,
                  &ldquo;invoice&rdquo; ou &ldquo;receipt&rdquo;.
                </span>
              </li>
              <li className="flex gap-2">
                <FileText className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
                <span>
                  De cada fatura, guardaria só fornecedor, valor, moeda, data e categoria. O corpo do e-mail
                  nunca é guardado.
                </span>
              </li>
            </ul>
          </div>
        )}
        <DialogFooter>
          {simulated ? (
            <DialogClose render={<Button />}>Fechar</DialogClose>
          ) : (
            <>
              <DialogClose render={<Button variant="outline" />}>Cancelar</DialogClose>
              <Button onClick={() => setSimulated(true)}>Simular a conexão</Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
