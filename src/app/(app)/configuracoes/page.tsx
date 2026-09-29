import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { AlertSettings } from "@/components/settings/alert-settings";
import { OrganizationSettings } from "@/components/settings/organization-settings";

export const metadata: Metadata = { title: "Configurações" };

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Configurações" description="Empresa, moeda, alertas e membros." />
      <div className="grid max-w-3xl gap-6">
        <OrganizationSettings />
        <AlertSettings />
      </div>
    </div>
  );
}
