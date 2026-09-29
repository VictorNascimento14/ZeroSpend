"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DEFAULT_RENEWAL_LEAD_DAYS } from "@/lib/domain/alerts";
import { CATEGORIES } from "@/lib/domain/categories";
import { BILLING_CYCLE_LABELS, formatDate, formatDaysUntil, formatMoney } from "@/lib/domain/format";
import type { Organization } from "@/lib/domain/types";
import type { SubscriptionRow } from "./rows";
import { RedundantBadge, StatusBadge } from "./status-badge";
import { SubscriptionActions } from "./subscription-actions";
import { VendorAvatar } from "./vendor-avatar";

/** O corpo da tabela de assinaturas — o mesmo no dashboard e na página de assinaturas. */
export function SubscriptionRowsTable({ rows, organization }: { rows: SubscriptionRow[]; organization: Organization }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Software</TableHead>
          <TableHead>Categoria</TableHead>
          <TableHead className="text-right">Valor/mês</TableHead>
          <TableHead>Ciclo</TableHead>
          <TableHead>Próxima cobrança</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>
            <span className="sr-only">Ações</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <SubscriptionTableRow key={row.subscription.id} row={row} organization={organization} />
        ))}
      </TableBody>
    </Table>
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
          <span>
            <span className="block font-medium">{subscription.vendorName}</span>
            {subscription.owner && (
              <span className="block text-xs text-muted-foreground">Resp.: {subscription.owner}</span>
            )}
          </span>
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
      <TableCell className="text-right">
        <SubscriptionActions subscription={subscription} defaultCurrency={organization.defaultCurrency} />
      </TableCell>
    </TableRow>
  );
}
