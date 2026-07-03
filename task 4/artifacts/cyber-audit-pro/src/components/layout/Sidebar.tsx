import { Link, useLocation } from "wouter";
import { LayoutDashboard, ShieldAlert, Terminal, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Scan History", href: "/scans", icon: ShieldAlert },
  { name: "Agent Setup", href: "/agent", icon: Terminal },
];

export function Sidebar() {
  const [location] = useLocation();

  return (
    <div className="flex h-full w-64 flex-col border-r bg-card">
      <div className="flex h-16 items-center gap-3 border-b px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <Shield className="h-5 w-5" />
        </div>
        <span className="font-bold tracking-wide text-foreground">CyberAudit Pro</span>
      </div>
      
      <div className="flex-1 overflow-auto py-6">
        <nav className="space-y-1 px-4">
          <div className="mb-4 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Overview
          </div>
          {navigation.map((item) => {
            const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
            return (
              <Link key={item.name} href={item.href}>
                <div
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors cursor-pointer",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.name}
                </div>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="border-t p-4">
        <div className="flex items-center gap-3 rounded-md bg-muted/50 p-3">
          <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
          <div className="text-xs font-medium">System Online</div>
        </div>
      </div>
    </div>
  );
}
