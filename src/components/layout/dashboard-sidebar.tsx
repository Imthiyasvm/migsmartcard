"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  LayoutDashboard,
  User,
  QrCode,
  BarChart3,
  Users,
  CreditCard,
  ShoppingBag,
  Settings,
  LogOut,
  Nfc,
  Building2,
  Mail,
  Shield,
  ChevronLeft,
  Menu,
  Eye,
  IdCard,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { UserAvatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";

const userNav = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/profile", label: "My Card", icon: User },
  { href: "/dashboard/preview", label: "Card Preview", icon: Eye },
  { href: "/dashboard/qr", label: "QR & NFC", icon: QrCode },
  { href: "/dashboard/business-card", label: "Print Card", icon: IdCard },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/dashboard/leads", label: "Leads", icon: Users },
  { href: "/dashboard/email-signature", label: "Email Signature", icon: Mail },
  { href: "/dashboard/shop", label: "Order Cards", icon: ShoppingBag },
  { href: "/dashboard/billing", label: "Billing", icon: CreditCard },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

const companyNav = [
  { href: "/dashboard/team", label: "Team", icon: Building2 },
];

const adminNav = [
  { href: "/admin", label: "Admin Home", icon: Shield },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/nfc", label: "NFC Cards", icon: Nfc },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { href: "/admin/analytics", label: "Platform Stats", icon: BarChart3 },
];

export function DashboardSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const isAdmin = session?.user?.role === "admin";
  const isCompany =
    session?.user?.role === "company_admin" ||
    session?.user?.plan === "business" ||
    session?.user?.plan === "enterprise";

  const NavItem = ({
    href,
    label,
    icon: Icon,
  }: {
    href: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }) => {
    const active =
      pathname === href || (href !== "/dashboard" && href !== "/admin" && pathname.startsWith(href));
    return (
      <Link
        href={href}
        onClick={() => setMobileOpen(false)}
        className={cn(
          "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
          active
            ? "bg-brand-50 text-brand-700 dark:bg-brand-950/50 dark:text-brand-300"
            : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800",
          collapsed && "justify-center px-2"
        )}
        title={collapsed ? label : undefined}
      >
        <Icon className={cn("h-5 w-5 shrink-0", active && "text-brand-600")} />
        {!collapsed && <span>{label}</span>}
      </Link>
    );
  };

  const sidebar = (
    <aside
      className={cn(
        "flex h-full flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950",
        collapsed ? "w-[72px]" : "w-64"
      )}
    >
      <div className="flex h-16 items-center justify-between border-b border-slate-200 px-4 dark:border-slate-800">
        {!collapsed ? <Logo href="/dashboard" /> : <Logo showText={false} href="/dashboard" />}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 lg:block"
        >
          <ChevronLeft
            className={cn("h-4 w-4 transition-transform", collapsed && "rotate-180")}
          />
        </button>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {!collapsed && (
          <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Menu
          </p>
        )}
        {userNav.map((item) => (
          <NavItem key={item.href} {...item} />
        ))}

        {isCompany && (
          <>
            {!collapsed && (
              <p className="mb-2 mt-4 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Team
              </p>
            )}
            {companyNav.map((item) => (
              <NavItem key={item.href} {...item} />
            ))}
          </>
        )}

        {isAdmin && (
          <>
            {!collapsed && (
              <p className="mb-2 mt-4 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Admin
              </p>
            )}
            {adminNav.map((item) => (
              <NavItem key={item.href} {...item} />
            ))}
          </>
        )}
      </nav>

      <div className="border-t border-slate-200 p-3 dark:border-slate-800">
        {session?.user && (
          <div
            className={cn(
              "mb-2 flex items-center gap-3 rounded-xl bg-slate-50 p-3 dark:bg-slate-900",
              collapsed && "justify-center p-2"
            )}
          >
            <UserAvatar
              name={session.user.name}
              src={session.user.image}
              className="h-9 w-9"
            />
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{session.user.name}</p>
                <Badge variant="default" className="mt-0.5 capitalize">
                  {session.user.plan}
                </Badge>
              </div>
            )}
          </div>
        )}
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className={cn(
            "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30",
            collapsed && "justify-center"
          )}
        >
          <LogOut className="h-5 w-5" />
          {!collapsed && "Sign out"}
        </button>
      </div>
    </aside>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed left-4 top-4 z-40 rounded-xl border border-slate-200 bg-white p-2 shadow-soft lg:hidden dark:border-slate-700 dark:bg-slate-900"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-64">{sidebar}</div>
        </div>
      )}

      {/* Desktop */}
      <div className="hidden lg:block">{sidebar}</div>
    </>
  );
}
