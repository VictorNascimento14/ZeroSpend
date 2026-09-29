import Link from "next/link";
import { Brand } from "./brand";
import { NavLinks } from "./nav-links";

/** A sidebar do desktop. No celular ela some, e a mesma navegação abre pelo menu do header. */
export function AppSidebar() {
  return (
    <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col gap-6 border-r bg-card px-3 py-4 md:flex">
      <Link
        href="/dashboard"
        className="rounded-lg px-3 outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <Brand />
      </Link>
      <NavLinks />
    </aside>
  );
}
