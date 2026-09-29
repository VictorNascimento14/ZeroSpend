import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Os testes rodam no fuso do Brasil: em UTC (o do CI), `new Date("2026-10-05")` cai no dia certo e o
// bug de data que volta um dia nunca apareceria. Os processos dos testes herdam esta variável.
process.env.TZ = "America/Sao_Paulo";

export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  test: { include: ["src/**/*.test.ts"] },
});
