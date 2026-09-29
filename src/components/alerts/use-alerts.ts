"use client";

import { useOrganizationData } from "@/lib/data/store";
import { currentAlerts, type Alert } from "@/lib/domain/alerts";
import { toIsoDate } from "@/lib/domain/dates";
import type { Organization, Subscription } from "@/lib/domain/types";

export interface AlertsView {
  organization: Organization;
  /** Os alertas de agora que a empresa ainda não dispensou. */
  open: Alert[];
  /** Os alertas de agora que a empresa dispensou. */
  dismissed: Alert[];
  /** As assinaturas detectadas e ainda não confirmadas. */
  inReview: Subscription[];
}

/** O que pede atenção na empresa da sessão — o mesmo no painel, na central e no sino. */
export function useAlerts(): AlertsView | null {
  const data = useOrganizationData();
  if (!data) return null;
  const { organization } = data.session;
  const alerts = currentAlerts(data.subscriptions, organization, toIsoDate(new Date()));
  return {
    organization,
    open: alerts.filter((alert) => !data.dismissedAlertKeys.has(alert.key)),
    dismissed: alerts.filter((alert) => data.dismissedAlertKeys.has(alert.key)),
    inReview: data.subscriptions.filter((subscription) => subscription.status === "review_needed"),
  };
}
