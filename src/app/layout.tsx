import type { Metadata } from "next";
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
