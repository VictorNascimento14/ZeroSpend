import { useMemo, useSyncExternalStore } from "react";
import { toIsoDate } from "@/lib/domain/dates";
import type { Invitation, Role, Subscription, User } from "@/lib/domain/types";
import {
  createRepository,
  currentSession,
  STORAGE_KEY,
  type CurrentSession,
  type Database,
  type Repository,
} from "./repository";

let repository: Repository | undefined;

/** O repositório do navegador. Só existe no cliente: o servidor renderiza esqueleto. */
export function getRepository(): Repository {
  if (typeof window === "undefined") throw new Error("O repositório local só existe no navegador.");
  if (!repository) {
    const created = createRepository(window.localStorage, () => toIsoDate(new Date()));
    // Outra aba gravou (ou limpou) o armazenamento: relê.
    window.addEventListener("storage", (event) => {
      if (event.key === STORAGE_KEY || event.key === null) created.invalidate();
    });
    repository = created;
  }
  return repository;
}

const subscribe = (listener: () => void) => getRepository().subscribe(listener);
const getSnapshot = () => getRepository().getDatabase();
const getServerSnapshot = () => null;

/**
 * Os dados locais, para a tela. `null` no servidor e durante a hidratação — a tela mostra esqueleto,
 * e o HTML do servidor nunca diverge do primeiro render do cliente.
 */
export function useDatabase(): Database | null {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/** A sessão resolvida (pessoa, empresa atual, papel). `null` sem sessão — e também no servidor. */
export function useSession(): CurrentSession | null {
  const database = useDatabase();
  return useMemo(() => (database ? currentSession(database) : null), [database]);
}

export interface OrganizationData {
  session: CurrentSession;
  subscriptions: Subscription[];
  /** As chaves dos alertas que a empresa dispensou. */
  dismissedAlertKeys: Set<string>;
}

/** A empresa da sessão e o que é dela — o que as telas do app mostram. `null` sem sessão. */
export function useOrganizationData(): OrganizationData | null {
  const database = useDatabase();
  return useMemo(() => {
    const session = database ? currentSession(database) : null;
    if (!database || !session) return null;
    const organizationId = session.organization.id;
    const subscriptions = database.subscriptions.filter((s) => s.organizationId === organizationId);
    const dismissedAlertKeys = new Set(
      database.dismissals.filter((d) => d.organizationId === organizationId).map((d) => d.key),
    );
    return { session, subscriptions, dismissedAlertKeys };
  }, [database]);
}

export interface Member {
  user: Pick<User, "id" | "name" | "email">;
  role: Role;
}

/** Quem tem acesso à empresa da sessão (por nome) e os convites pendentes dela. `null` sem sessão. */
export function useMembers(): { members: Member[]; invitations: Invitation[] } | null {
  const database = useDatabase();
  return useMemo(() => {
    const session = database ? currentSession(database) : null;
    if (!database || !session) return null;
    const organizationId = session.organization.id;
    const members = database.memberships
      .filter((membership) => membership.organizationId === organizationId)
      .flatMap((membership) => {
        const user = database.users.find((candidate) => candidate.id === membership.userId);
        // Só o que a tela mostra: o hash da senha não sai do repositório.
        return user ? [{ user: { id: user.id, name: user.name, email: user.email }, role: membership.role }] : [];
      })
      .sort((a, b) => a.user.name.localeCompare(b.user.name, "pt-BR"));
    const invitations = database.invitations.filter((invitation) => invitation.organizationId === organizationId);
    return { members, invitations };
  }, [database]);
}
