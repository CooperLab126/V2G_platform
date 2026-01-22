import { Outlet } from "react-router-dom";
import { BottomNav } from "./BottomNav";
import { DesktopSidebar } from "./DesktopSidebar";

export function AppLayout() {
  return (
    <div className="min-h-screen bg-background">
      <DesktopSidebar />
      <main className="pb-24 lg:pb-0 lg:pl-64">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
