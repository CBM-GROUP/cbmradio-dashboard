"use client";

import { useRef, useState } from "react";
import AuthGuard from "./auth-guard";
import DashboardHeader from "./dashboard-header";
import DashboardSidebar from "./dashboard-sidebar";
import MobileDashboardNavigation from "./mobile-dashboard-navigation";
import { DashboardThemeProvider } from "./theme-provider";

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <DashboardThemeProvider>
      <AuthGuard>
        {(user) => <AuthenticatedShell user={user}>{children}</AuthenticatedShell>}
      </AuthGuard>
    </DashboardThemeProvider>
  );
}

function AuthenticatedShell({
  user,
  children,
}: {
  user: import("../../lib/backend-auth").AdminUser;
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const menuTriggerRef = useRef<HTMLButtonElement>(null);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-950 font-sans text-slate-100">
      {/* Desktop Sidebar */}
      <aside className="hidden w-64 shrink-0 overflow-y-auto border-r border-slate-800 md:block">
        <DashboardSidebar />
      </aside>

      {/* Mobile Navigation Drawer */}
      <MobileDashboardNavigation
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        triggerRef={menuTriggerRef}
      />

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <DashboardHeader
          user={user}
          navigationOpen={mobileOpen}
          onOpenNavigation={() => setMobileOpen(true)}
          menuTriggerRef={menuTriggerRef}
        />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
