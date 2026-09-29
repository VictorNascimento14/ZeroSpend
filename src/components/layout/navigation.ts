import { Bell, CreditCard, LayoutDashboard, Plug, Settings, type LucideIcon } from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

/** As áreas da sidebar, na ordem do briefing. A mesma lista serve o menu do celular. */
export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/assinaturas", label: "Assinaturas", icon: CreditCard },
  { href: "/integracoes", label: "Extratos e integrações", icon: Plug },
  { href: "/alertas", label: "Alertas", icon: Bell },
  { href: "/configuracoes", label: "Configurações", icon: Settings },
];
