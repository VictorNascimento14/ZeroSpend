import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ZeroSpend",
  description:
    "Gerenciador e auditor de assinaturas de software para pequenas e médias empresas.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
