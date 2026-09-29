"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { getRepository, useOrganizationData } from "@/lib/data/store";
import { formatDate, formatMoney, plural } from "@/lib/domain/format";
import type { StatementProblem } from "@/lib/import/csv";
import { isAlreadyTracked, toDraft, type StatementReading } from "@/lib/import/recognize";
import { readStatementFile } from "@/lib/import/statement-file";
import { DetectedList } from "./detected-list";
import { StatementDropzone } from "./statement-dropzone";

type Stage =
  | { step: "choose"; error?: string; pdf?: boolean }
  | {
      step: "review";
      fileName: string;
      reading: StatementReading;
      problems: StatementProblem[];
      lineCount: number;
      selected: Set<string>;
    };

/**
 * Do extrato às assinaturas: a pessoa sobe o CSV, confere o que foi reconhecido e importa. Do arquivo,
 * só ficam as assinaturas marcadas — o resto some quando a tela fecha.
 */
export function StatementImport() {
  const data = useOrganizationData();
  const router = useRouter();
  const [stage, setStage] = useState<Stage>({ step: "choose" });
  if (!data) return null;
  const { organization } = data.session;
  const subscriptions = data.subscriptions;

  async function handleFile(file: File) {
    const result = await readStatementFile(file);
    if (result.kind === "pdf") return setStage({ step: "choose", pdf: true });
    if (result.kind === "error") return setStage({ step: "choose", error: result.message });
    const { reading, problems, lineCount } = result;
    // Já cadastrada começa desmarcada: importar de novo criaria a mesma assinatura duas vezes.
    const fresh = reading.detected.filter((item) => !isAlreadyTracked(item, subscriptions));
    setStage({ step: "review", fileName: file.name, reading, problems, lineCount, selected: new Set(fresh.map((item) => item.vendor.name)) });
  }

  if (stage.step === "choose") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Extrato do cartão</CardTitle>
          <CardDescription>
            O CSV exportado no site do banco. O arquivo é lido neste navegador e não é guardado: só entram as
            assinaturas que você confirmar.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <StatementDropzone onFile={handleFile} error={stage.error} />
          {stage.pdf && (
            <div role="status" className="grid justify-items-start gap-2 rounded-lg border border-border bg-muted p-4 text-sm">
              <Badge variant="outline">Demonstração</Badge>
              <p>
                Ler a fatura em PDF depende do servidor, que chega depois desta versão. Por enquanto, exporte o
                extrato em CSV no site do banco e envie aqui.
              </p>
            </div>
          )}
          <p className="text-sm text-muted-foreground">
            Sem um extrato à mão?{" "}
            <a href="/exemplo-extrato.csv" download className="font-medium text-primary underline-offset-4 hover:underline">
              Baixe um extrato de exemplo
            </a>
            , com lançamentos fictícios, e envie aqui.
          </p>
        </CardContent>
      </Card>
    );
  }

  const { fileName, reading, problems, lineCount, selected } = stage;
  const tracked = new Set(
    reading.detected.filter((item) => isAlreadyTracked(item, subscriptions)).map((item) => item.vendor.name),
  );
  const chosen = reading.detected.filter((item) => selected.has(item.vendor.name));

  function toggle(vendorName: string, checked: boolean) {
    const next = new Set(selected);
    if (checked) next.add(vendorName);
    else next.delete(vendorName);
    setStage({ step: "review", fileName, reading, problems, lineCount, selected: next });
  }

  function handleImport() {
    try {
      const created = getRepository().addSubscriptions(organization.id, chosen.map(toDraft));
      toast.success(`${plural(created.length, "assinatura importada", "assinaturas importadas")}. Confira cada uma no dashboard.`);
      router.push("/dashboard");
    } catch (reason) {
      toast.error(reason instanceof Error ? reason.message : "Não foi possível importar.");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {reading.detected.length > 0
            ? plural(reading.detected.length, "assinatura encontrada", "assinaturas encontradas")
            : "Nenhuma assinatura encontrada"}
        </CardTitle>
        <CardDescription className="break-words">
          {plural(lineCount, "lançamento lido", "lançamentos lidos")} em {fileName}.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        {reading.detected.length > 0 ? (
          <>
            <p className="text-sm text-muted-foreground">
              Marque as que entram em {organization.name}. Elas chegam &ldquo;em revisão&rdquo;, como mensais e
              pelo valor da última cobrança: confira cada uma no dashboard.
            </p>
            <DetectedList detected={reading.detected} tracked={tracked} selected={selected} onToggle={toggle} />
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            Nenhum lançamento bateu com os softwares que o ZeroSpend conhece. Se algum dos abaixo for software,
            cadastre pela &ldquo;Nova assinatura&rdquo;, no dashboard.
          </p>
        )}
        {reading.unrecognized.length > 0 && (
          <details className="rounded-lg border border-border text-sm">
            <summary className="cursor-pointer px-4 py-3 font-medium">
              {plural(reading.unrecognized.length, "compra que não parece software", "compras que não parecem software")}
            </summary>
            <ul className="divide-y divide-border border-t border-border">
              {reading.unrecognized.map((line) => (
                <li key={line.line} className="flex justify-between gap-3 px-4 py-2">
                  <span className="min-w-0 break-words">{line.description}</span>
                  <span className="shrink-0 text-muted-foreground tabular-nums">
                    {formatDate(line.date)} · {formatMoney(Math.abs(line.amount), "BRL")}
                  </span>
                </li>
              ))}
            </ul>
          </details>
        )}
        {problems.length > 0 && (
          <details className="rounded-lg border border-border text-sm">
            <summary className="cursor-pointer px-4 py-3 font-medium">
              {plural(problems.length, "linha que não deu para ler", "linhas que não deu para ler")}
            </summary>
            <ul className="divide-y divide-border border-t border-border">
              {problems.map((problem) => (
                <li key={problem.line} className="px-4 py-2">
                  Linha {problem.line}: {problem.reason}
                </li>
              ))}
            </ul>
          </details>
        )}
        {reading.ignoredCredits > 0 && (
          <p className="text-sm text-muted-foreground">
            {plural(reading.ignoredCredits, "crédito", "créditos")} (pagamento da fatura, estorno){" "}
            {reading.ignoredCredits === 1 ? "ficou" : "ficaram"} de fora: não é compra.
          </p>
        )}
      </CardContent>
      <CardFooter className="flex flex-wrap gap-3">
        {reading.detected.length > 0 && (
          <Button onClick={handleImport} disabled={chosen.length === 0}>
            Importar {plural(chosen.length, "assinatura", "assinaturas")}
          </Button>
        )}
        <Button variant="outline" onClick={() => setStage({ step: "choose" })}>
          Escolher outro arquivo
        </Button>
      </CardFooter>
    </Card>
  );
}
