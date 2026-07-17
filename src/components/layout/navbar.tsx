"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";
import {
  Menu,
  X,
  Moon,
  Sun,
  LayoutDashboard,
  LogOut,
  User,
  CreditCard,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme-provider";
import { UserAvatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/#features", label: "Features" },
  { href: "/#pricing", label: "Pricing" },
  { href: "/#how-it-works", label: "How it Works" },
  { href: "/shop", label: "Shop Cards" },
  { href: "/#demos", label: "Demo Profiles" },
];

export function Navbar() {
  const { data: session } = useSession();
  const { theme, toggleTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const [userMenu, setUserMenu] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/60 bg-white/80 backdrop-blur-xl dark:border-[#1a1a1a]/60 dark:bg-[#0a0a0a]/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Logo />

        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-[#1a1a1a] dark:hover:text-white"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-[#1a1a1a]"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </button>

          {session?.user ? (
            <div className="relative">
              <button
                onClick={() => setUserMenu(!userMenu)}
                className="flex items-center gap-2 rounded-xl p-1.5 hover:bg-slate-100 dark:hover:bg-[#1a1a1a]"
              >
                <UserAvatar
                  name={session.user.name}
                  src={session.user.image}
                  className="h-8 w-8"
                />
                <span className="hidden text-sm font-medium sm:block">
                  {session.user.name?.split(" ")[0]}
                </span>
              </button>
              {userMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setUserMenu(false)}
                  />
                  <div className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-card dark:border-[#1a1a1a] dark:bg-[#141414]">
                    <div className="border-b border-slate-100 px-4 py-3 dark:border-[#1a1a1a]">
                      <p className="text-sm font-semibold">{session.user.name}</p>
                      <p className="text-xs text-slate-500">
                        {session.user.email}
                      </p>
                    </div>
                    <Link
                      href="/dashboard"
                      className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-slate-50 dark:hover:bg-[#1a1a1a]"
                      onClick={() => setUserMenu(false)}
                    >
                      <LayoutDashboard className="h-4 w-4" /> Dashboard
                    </Link>
                    <Link
                      href="/dashboard/profile"
                      className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-slate-50 dark:hover:bg-[#1a1a1a]"
                      onClick={() => setUserMenu(false)}
                    >
                      <User className="h-4 w-4" /> Edit Profile
                    </Link>
                    <Link
                      href="/dashboard/billing"
                      className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-slate-50 dark:hover:bg-[#1a1a1a]"
                      onClick={() => setUserMenu(false)}
                    >
                      <CreditCard className="h-4 w-4" /> Billing
                    </Link>
                    {session.user.role === "admin" && (
                      <Link
                        href="/admin"
                        className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-slate-50 dark:hover:bg-[#1a1a1a]"
                        onClick={() => setUserMenu(false)}
                      >
                        <LayoutDashboard className="h-4 w-4" /> Admin Panel
                      </Link>
                    )}
                    <button
                      onClick={() => signOut({ callbackUrl: "/" })}
                      className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                    >
                      <LogOut className="h-4 w-4" /> Sign out
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/login">Log in</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/register">Get Started</Link>
              </Button>
            </div>
          )}

          <button
            className="rounded-lg p-2 md:hidden"
            onClick={() => setOpen(!open)}
            aria-label="Menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        className={cn(
          "border-t border-slate-200 bg-white dark:border-[#1a1a1a] dark:bg-[#0a0a0a] md:hidden",
          open ? "block" : "hidden"
        )}
      >
        <div className="space-y-1 px-4 py-4">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="block rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-[#1a1a1a]"
              onClick={() => setOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          {!session && (
            <div className="flex flex-col gap-2 pt-3">
              <Button variant="outline" asChild>
                <Link href="/login">Log in</Link>
              </Button>
              <Button asChild>
                <Link href="/register">Get Started Free</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
