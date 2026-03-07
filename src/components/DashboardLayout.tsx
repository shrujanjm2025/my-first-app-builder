import { ReactNode, useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Wallet, PiggyBank, Target, CreditCard, Shield,
  Settings, LogOut, Menu, ChevronLeft, Building2, Landmark,
  Moon, Sun, BarChart3, Clock
} from "lucide-react";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/budgets", label: "Budget Manager", icon: Wallet },
  { to: "/loans", label: "Loans & Debt", icon: CreditCard },
  { to: "/insurance", label: "Insurance", icon: Shield },
  { to: "/credit-score", label: "Credit Score", icon: BarChart3 },
  { to: "/goals", label: "Goals", icon: Target },
  { to: "/retirement", label: "Retirement", icon: Clock },
  { to: "/deposits", label: "FD & RD", icon: Landmark },
  { to: "/bank-accounts", label: "Bank Accounts", icon: Building2 },
  { to: "/settings", label: "Settings", icon: Settings },
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { signOut, user } = useAuth();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dark, setDark] = useState(() => {
    if (typeof window !== "undefined") {
      return document.documentElement.classList.contains("dark") || localStorage.getItem("theme") === "dark";
    }
    return false;
  });

  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [dark]);

  return (
    <div className="flex min-h-screen bg-background">
      {mobileOpen && (
        <div className="fixed inset-0 bg-foreground/20 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      <aside className={cn(
        "fixed lg:sticky top-0 left-0 z-50 h-screen flex flex-col bg-card border-r border-border transition-all duration-300",
        collapsed ? "w-[72px]" : "w-[228px]",
        mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className={cn("flex items-center gap-2.5 p-4 border-b border-border", collapsed && "justify-center px-2")}>
          <div className="w-8 h-8 gradient-primary rounded-[9px] flex items-center justify-center flex-shrink-0">
            <Wallet className="h-4 w-4 text-primary-foreground" />
          </div>
          {!collapsed && <span className="font-heading text-[17px] font-extrabold tracking-tight">WealthOS</span>}
        </div>

        <nav className="flex-1 p-2.5 space-y-0.5 overflow-y-auto">
          {navItems.map(({ to, label, icon: Icon }) => {
            const active = location.pathname === to;
            return (
              <Link key={to} to={to} onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                  collapsed && "justify-center px-2"
                )}>
                <Icon className="h-4 w-4 flex-shrink-0" />
                {!collapsed && label}
              </Link>
            );
          })}
        </nav>

        <div className="p-2.5 border-t border-border space-y-1">
          {!collapsed && (
            <div className="px-3 py-2.5 rounded-xl bg-secondary mb-2">
              <div className="text-xs font-semibold truncate">{user?.email?.split("@")[0] || "User"}</div>
              <div className="text-[11px] text-muted-foreground">Free Plan</div>
            </div>
          )}
          <button onClick={() => setDark(!dark)}
            className={cn("flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] text-muted-foreground hover:bg-secondary w-full transition-colors", collapsed && "justify-center")}>
            {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            {!collapsed && (dark ? "Light Mode" : "Dark Mode")}
          </button>
          <button onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] text-muted-foreground hover:bg-secondary w-full transition-colors">
            <ChevronLeft className={cn("h-4 w-4 transition-transform", collapsed && "rotate-180")} />
            {!collapsed && "Collapse"}
          </button>
          <button onClick={signOut}
            className={cn("flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] text-destructive hover:bg-destructive/10 w-full transition-colors", collapsed && "justify-center")}>
            <LogOut className="h-4 w-4" />
            {!collapsed && "Sign Out"}
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 bg-card/80 backdrop-blur-md border-b border-border px-4 lg:px-6 h-14 flex items-center gap-4 lg:hidden">
          <button className="p-2 rounded-lg hover:bg-secondary" onClick={() => setMobileOpen(true)}>
            <Menu className="h-5 w-5" />
          </button>
        </header>
        <div className="flex-1 p-5 lg:p-8 max-w-[1100px] mx-auto w-full">
          {children}
        </div>
      </main>
    </div>
  );
}
