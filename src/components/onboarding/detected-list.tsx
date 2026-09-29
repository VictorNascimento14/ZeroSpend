"use client";

import { VendorAvatar } from "@/components/subscriptions/vendor-avatar";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { CATEGORIES } from "@/lib/domain/categories";
import { formatDate, formatMoney, plural } from "@/lib/domain/format";
import type { DetectedSubscription } from "@/lib/import/recognize";

/** As assinaturas que o extrato mostrou, cada uma com a caixa que decide se ela entra. */
export function DetectedList({
  detected,
  tracked,
  selected,
  onToggle,
}: {
  detected: DetectedSubscription[];
  tracked: Set<string>;
  selected: Set<string>;
  onToggle: (vendorName: string, checked: boolean) => void;
}) {
  return (
    <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border">
      {detected.map(({ vendor, amount, charges, lastChargeDate }) => (
        <li key={vendor.name}>
          <label className="flex cursor-pointer items-start gap-3 p-3 hover:bg-muted">
            <Checkbox
              className="mt-2"
              checked={selected.has(vendor.name)}
              onCheckedChange={(checked) => onToggle(vendor.name, checked)}
            />
            <VendorAvatar name={vendor.name} />
            <span className="grid min-w-0 flex-1 gap-0.5">
              <span className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{vendor.name}</span>
                  {tracked.has(vendor.name) && <Badge variant="secondary">Já cadastrada</Badge>}
                </span>
                <span className="tabular-nums">{formatMoney(amount, "BRL")}</span>
              </span>
              <span className="text-sm text-muted-foreground">
                {CATEGORIES[vendor.category]} · {plural(charges, "cobrança", "cobranças")}, a última em{" "}
                {formatDate(lastChargeDate)}
              </span>
            </span>
          </label>
        </li>
      ))}
    </ul>
  );
}
