"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { useFamily } from "@/lib/hooks/useFamily";
import { createClient } from "@/lib/supabase/client";
import { NavSearch } from "@/components/ui/NavSearch";

interface Props {
  rightSlot?: React.ReactNode;
}

const NAV_ITEMS = [
  { label: "Home",     href: "/home" },
  { label: "Tree",     href: "/tree" },
  { label: "Timeline", href: "/timeline" },
  { label: "Activity", href: "/activity" },
] as const;

export function AppNav({ rightSlot }: Props) {
  const pathname = usePathname();
  const router   = useRouter();
  const { family, member } = useFamily();
  const supabase = createClient();

  const userInitials = (member?.display_name ?? "F")
    .split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();

  const activeHref = NAV_ITEMS.find(({ href }) => {
    if (href === "/tree")     return pathname.startsWith("/tree") || pathname.startsWith("/person");
    if (href === "/activity") return pathname.startsWith("/activity") || pathname.startsWith("/memory");
    return pathname === href;
  })?.href;

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-20 bg-[--surface] border-b border-[--rule]">
      <div className="px-4 sm:px-6 h-14 flex items-center justify-between gap-4">

        <div className="flex items-center gap-5 min-w-0">
          <Link href="/home"
            className="font-display italic text-[19px] tracking-[-0.01em] text-[--ink] hover:text-[--accent] transition-colors flex-shrink-0 truncate max-w-[180px]">
            {family?.name ?? "Folio"}
          </Link>
          <nav className="hidden md:flex items-center gap-0.5 text-[14px]">
            {NAV_ITEMS.map(({ label, href }) => (
              <Link key={href} href={href}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  activeHref === href
                    ? "bg-[--surface-alt] text-[--ink] font-medium"
                    : "text-[--ink-soft] hover:text-[--ink] hover:bg-[--surface-alt]"
                }`}>
                {label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          {rightSlot}
          <NavSearch />
          <button
            onClick={handleSignOut}
            className="p-2 text-[--ink-mute] hover:text-[--ink] rounded-lg hover:bg-[--surface-alt] transition-colors"
            title="Sign out">
            <LogOut className="w-4 h-4" />
          </button>
          <Link href="/settings"
            className="w-8 h-8 rounded-full bg-[--accent-soft] text-[--accent] font-display text-[13px] flex items-center justify-center border border-[--rule] hover:border-[--gold] transition-colors flex-shrink-0 ml-1"
            title="Settings">
            {userInitials}
          </Link>
        </div>

      </div>
    </header>
  );
}
