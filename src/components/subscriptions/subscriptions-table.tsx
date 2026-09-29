"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useOrganizationData } from "@/lib/data/store";
import { toIsoDate } from "@/lib/domain/dates";
import { plural } from "@/lib/domain/format";
import { buildRows } from "./rows";
import { SubscriptionRowsTable } from "./subscription-rows-table";

/** A tabela principal do dashboard: todas as assinaturas da empresa da sessão. */
export function SubscriptionsTable() {
  const data = useOrganizationData();
  if (!data) return null;
  const { organization } = data.session;
  const rows = buildRows(data.subscriptions, organization, toIsoDate(new Date()));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Assinaturas</CardTitle>
        <CardDescription>
          {rows.length > 0
            ? `${plural(rows.length, "assinatura", "assinaturas")}, da próxima cobrança para a mais distante.`
            : "Nenhuma assinatura cadastrada nesta empresa. Use \u201cNova assinatura\u201d para cadastrar a primeira."}
        </CardDescription>
      </CardHeader>
      {rows.length > 0 && (
        <CardContent>
          <SubscriptionRowsTable rows={rows} organization={organization} />
        </CardContent>
      )}
    </Card>
  );
}
