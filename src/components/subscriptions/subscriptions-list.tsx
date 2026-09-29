"use client";

import { Search } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useOrganizationData } from "@/lib/data/store";
import { CATEGORIES, CATEGORY_IDS, type Category } from "@/lib/domain/categories";
import { toIsoDate } from "@/lib/domain/dates";
import { plural } from "@/lib/domain/format";
import { buildRows, filterRows, sortRows, type RowFilters, type SortKey, type StatusFilter } from "./rows";
import { SubscriptionRowsTable } from "./subscription-rows-table";

const STATUS_ITEMS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "Todos os status" },
  { value: "active", label: "Ativas" },
  { value: "review_needed", label: "Em revisão" },
  { value: "cancelled", label: "Canceladas" },
  { value: "redundant", label: "Ferramentas redundantes" },
];
const CATEGORY_ITEMS: { value: Category | "all"; label: string }[] = [
  { value: "all", label: "Todas as categorias" },
  ...CATEGORY_IDS.map((id) => ({ value: id, label: CATEGORIES[id] })),
];
const SORT_ITEMS: { value: SortKey; label: string }[] = [
  { value: "nextCharge", label: "Próxima cobrança" },
  { value: "monthlyAmount", label: "Maior valor por mês" },
  { value: "name", label: "Nome (A–Z)" },
];
const NO_FILTERS: RowFilters = { query: "", status: "all", category: "all" };

/** A lista completa de assinaturas, com busca, filtros e ordenação. */
export function SubscriptionsList() {
  const data = useOrganizationData();
  const [filters, setFilters] = useState<RowFilters>(NO_FILTERS);
  const [sort, setSort] = useState<SortKey>("nextCharge");
  if (!data) return null;

  const { organization } = data.session;
  const all = buildRows(data.subscriptions, organization, toIsoDate(new Date()));
  const rows = sortRows(filterRows(all, filters), sort);
  const filtering = filters.query.trim() !== "" || filters.status !== "all" || filters.category !== "all";
  const total = plural(all.length, "assinatura", "assinaturas");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Lista completa</CardTitle>
        <CardDescription>{filtering ? `${rows.length} de ${total}` : total}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div role="search" className="flex flex-wrap gap-2">
          <div className="relative w-full sm:w-80">
            <Input
              value={filters.query}
              onChange={(event) => setFilters({ ...filters, query: event.target.value })}
              placeholder="Software, categoria ou responsável"
              aria-label="Buscar assinaturas"
              inputMode="search"
              enterKeyHint="search"
              className="rounded-full pr-9"
            />
            <Search
              className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
          </div>
          <FilterSelect
            label="Filtrar por status"
            items={STATUS_ITEMS}
            value={filters.status}
            onChange={(status) => setFilters({ ...filters, status })}
          />
          <FilterSelect
            label="Filtrar por categoria"
            items={CATEGORY_ITEMS}
            value={filters.category}
            onChange={(category) => setFilters({ ...filters, category })}
          />
          <FilterSelect label="Ordenar por" items={SORT_ITEMS} value={sort} onChange={setSort} />
        </div>
        {rows.length > 0 ? (
          <SubscriptionRowsTable rows={rows} organization={organization} />
        ) : filtering ? (
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            Nenhuma assinatura com esses filtros.
            <Button variant="outline" size="sm" onClick={() => setFilters(NO_FILTERS)}>
              Limpar filtros
            </Button>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Nenhuma assinatura cadastrada nesta empresa. Use &ldquo;Nova assinatura&rdquo; para cadastrar a primeira.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function FilterSelect<T extends string>({
  label,
  items,
  value,
  onChange,
}: {
  label: string;
  items: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <Select items={items} value={value} onValueChange={(next) => onChange(next as T)}>
      <SelectTrigger aria-label={label} className="w-full sm:w-auto sm:min-w-44">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {items.map((item) => (
          <SelectItem key={item.value} value={item.value}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
