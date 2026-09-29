"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useOrganizationData } from "@/lib/data/store";
import { DEFAULT_RENEWAL_LEAD_DAYS } from "@/lib/domain/alerts";
import { CATEGORIES } from "@/lib/domain/categories";
import { toIsoDate } from "@/lib/domain/dates";
import { BILLING_CYCLE_LABELS, formatDate, formatDaysUntil, formatMoney, plural } from "@/lib/domain/format";
import type { Organization } from "@/lib/domain/types";
import { buildRows, type SubscriptionRow } from "./rows";
import { RedundantBadge, StatusBadge } from "./status-badge";
import { VendorAvatar } from "./vendor-avatar";

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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Software</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead className="text-right">Valor/mês</TableHead>
                <TableHead>Ciclo</TableHead>
                <TableHead>Próxima cobrança</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <SubscriptionTableRow key={row.subscription.id} row={row} organization={organization} />
              ))}
            </TableBody>
          </Table>
        </CardContent>
      )}
    </Card>
  );
}

function SubscriptionTableRow({ row, organization }: { row: SubscriptionRow; organization: Organization }) {
  const { subscription, monthlyAmount, chargeDate, daysUntil, redundant } = row;
  const showOriginal = subscription.billingCycle === "annually" || subscription.currency !== organization.defaultCurrency;
  return (
    <TableRow>
      <TableCell>
        <span className="flex items-center gap-3">
          <VendorAvatar name={subscription.vendorName} />
          <span className="font-medium">{subscription.vendorName}</span>
        </span>
      </TableCell>
      <TableCell>{CATEGORIES[subscription.category]}</TableCell>
      <TableCell className="text-right tabular-nums">
        {formatMoney(monthlyAmount, organization.defaultCurrency)}
        {showOriginal && (
          <span className="block text-xs text-muted-foreground">
            {formatMoney(subscription.amount, subscription.currency)}{" "}
            {subscription.billingCycle === "annually" ? "por ano" : "por mês"}
          </span>
        )}
      </TableCell>
      <TableCell>{BILLING_CYCLE_LABELS[subscription.billingCycle]}</TableCell>
      <TableCell className="tabular-nums">
        {chargeDate ? (
          <>
            {formatDate(chargeDate)}
            {daysUntil !== null && daysUntil <= DEFAULT_RENEWAL_LEAD_DAYS && (
              <span className="block text-xs text-warning-shade-300 dark:text-warning-tint-200">
                {formatDaysUntil(daysUntil)}
              </span>
            )}
          </>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </TableCell>
      <TableCell>
        <span className="flex flex-wrap gap-1">
          <StatusBadge status={subscription.status} />
          {redundant && <RedundantBadge />}
        </span>
      </TableCell>
    </TableRow>
  );
}
