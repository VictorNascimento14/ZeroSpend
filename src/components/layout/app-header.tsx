"use client";

import { Menu } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Brand } from "./brand";
import { NavLinks } from "./nav-links";
import { ThemeToggle } from "./theme-toggle";

export function AppHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-2 border-b bg-card px-4 md:px-6">
      <Sheet open={menuOpen} onOpenChange={(open) => setMenuOpen(open)}>
        <SheetTrigger render={<Button variant="ghost" size="icon" className="md:hidden" aria-label="Abrir o menu" />}>
          <Menu />
        </SheetTrigger>
        <SheetContent side="left" className="w-72">
          <SheetHeader>
            <SheetTitle>
              <Brand />
            </SheetTitle>
          </SheetHeader>
          <div className="px-3">
            <NavLinks onNavigate={() => setMenuOpen(false)} />
          </div>
        </SheetContent>
      </Sheet>
      <div className="ml-auto flex items-center gap-1">
        <ThemeToggle />
      </div>
    </header>
  );
}
