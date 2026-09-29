"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useOrganizationData } from "@/lib/data/store";
import { toIsoDate } from "@/lib/domain/dates";
import { plural } from "@/lib/domain/format";
import { NoSubscriptionsYet } from "./no-subscriptions-yet";
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
        {rows.length > 0 && (
          <CardDescription>
            {plural(rows.length, "assinatura", "assinaturas")}, da próxima cobrança para a mais distante.
          </CardDescription>
        )}
      </CardHeader>
      <CardContent>
        {rows.length > 0 ? <SubscriptionRowsTable rows={rows} organization={organization} /> : <NoSubscriptionsYet />}
      </CardContent>
    </Card>
  );
}
