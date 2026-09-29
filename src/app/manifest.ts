import type { MetadataRoute } from "next";

/** O manifesto do app: nome, cores e ícones para quem instalar ou fixar na tela inicial. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ZeroSpend",
    short_name: "ZeroSpend",
    description: "Gerenciador e auditor de assinaturas de software para pequenas e médias empresas.",
    lang: "pt-BR",
    start_url: "/dashboard",
    display: "standalone",
    // As cores do kit, em hexadecimal porque o manifesto não lê CSS: grey-50 (fundo) e cerulean (primária).
    background_color: "#f3f3f4",
    theme_color: "#0068e9",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
