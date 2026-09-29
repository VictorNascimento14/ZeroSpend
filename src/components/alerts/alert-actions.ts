import { toast } from "sonner";
import { getRepository } from "@/lib/data/store";
import type { Alert } from "@/lib/domain/alerts";

/** Dispensa o alerta para a empresa, com "Desfazer" no aviso — um clique errado não custa nada. */
export function dismissWithUndo(organizationId: string, alert: Alert) {
  const repository = getRepository();
  repository.dismissAlert(organizationId, alert.key);
  toast.success("Alerta dispensado.", {
    action: { label: "Desfazer", onClick: () => repository.restoreAlert(organizationId, alert.key) },
  });
}
