/**
 * Para onde voltar depois de entrar. Só caminho interno: "/assinaturas" passa; "//site.com",
 * "/\site.com" e "https://…" não — senão o `?para=` vira redirecionamento aberto para fora do app.
 * `/entrar` também não: voltaria para a própria tela, em laço.
 */
export function safeRedirectPath(path: string | string[] | undefined, fallback = "/dashboard"): string {
  if (typeof path !== "string" || !path.startsWith("/")) return fallback;
  if (path.startsWith("//") || path.startsWith("/\\") || path.startsWith("/entrar")) return fallback;
  return path;
}
