"use client";

import { CircleAlert, FileUp } from "lucide-react";
import { useId, useState, type DragEvent } from "react";
import { cn } from "@/lib/utils";

/**
 * O card de upload do kit: a área tracejada aceita arrastar e soltar e é o rótulo do campo de arquivo.
 * Clicar em qualquer ponto dela, ou focar pelo teclado e apertar Enter, abre o seletor do sistema.
 */
export function StatementDropzone({ onFile, error }: { onFile: (file: File) => void; error?: string }) {
  const id = useId();
  const [dragging, setDragging] = useState(false);

  function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer.files[0];
    if (file) onFile(file);
  }

  return (
    <div className="grid gap-2">
      <label
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={(event) => {
          // Passar por cima de um filho também dispara o dragleave: só conta sair da área.
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragging(false);
        }}
        onDrop={handleDrop}
        className={cn(
          "flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed border-input px-6 py-10 text-center transition-colors hover:bg-muted has-focus-visible:border-ring has-focus-visible:ring-3 has-focus-visible:ring-ring/50",
          error && "border-destructive",
          dragging && "border-primary bg-cerulean-tint-50 dark:bg-cerulean-shade-300/20",
        )}
      >
        <span className="grid size-12 place-items-center rounded-full bg-cerulean-tint-50 text-cerulean-shade-100 dark:bg-cerulean-shade-300/40 dark:text-cerulean-tint-200">
          <FileUp className="size-6" aria-hidden />
        </span>
        <span id={`${id}-rotulo`} className="font-medium">
          Arraste o extrato aqui ou <span className="text-primary underline underline-offset-4">escolha o arquivo</span>
        </span>
        <span id={`${id}-dica`} className="text-sm text-muted-foreground">
          CSV com as colunas Data, Descrição e Valor, de até 2 MB.
        </span>
        <input
          type="file"
          accept=".csv,text/csv,.pdf,application/pdf"
          className="sr-only"
          aria-labelledby={`${id}-rotulo`}
          aria-describedby={[`${id}-dica`, error && `${id}-erro`].filter(Boolean).join(" ")}
          aria-invalid={Boolean(error)}
          onChange={(event) => {
            const file = event.target.files?.[0];
            // Limpa o campo: escolher o mesmo arquivo de novo precisa disparar o change outra vez.
            event.target.value = "";
            if (file) onFile(file);
          }}
        />
      </label>
      {error && (
        <p id={`${id}-erro`} role="alert" className="flex items-start gap-2 text-sm text-destructive">
          <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
          {error}
        </p>
      )}
    </div>
  );
}
