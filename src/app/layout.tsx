import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: { default: "ZeroSpend", template: "%s · ZeroSpend" },
  description:
    "Gerenciador e auditor de assinaturas de software para pequenas e médias empresas.",
  applicationName: "ZeroSpend",
  // O Safari do iPhone transforma sequência de números em link de telefone — e aqui tudo é valor.
  formatDetection: { telephone: false },
};

// A barra do navegador no celular acompanha o header: card claro (branco) ou escuro (grey-800).
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#292831" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // O next-themes põe a classe do tema no <html> antes da hidratação.
    <html lang="pt-BR" className={inter.variable} suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <TooltipProvider>{children}</TooltipProvider>
          {/* O rótulo padrão da região de avisos, lido pelo leitor de tela, é "Notifications". */}
          <Toaster containerAriaLabel="Notificações" />
        </ThemeProvider>
      </body>
    </html>
  );
}
