import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./app-sidebar";
import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";
import { Loader2, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

export function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/login" />;
  }

  const style = {
    "--sidebar-width": "18rem",
    "--sidebar-width-icon": "5rem",
  } as React.CSSProperties;

  return (
    <SidebarProvider style={style}>
      <div className="flex min-h-screen w-full bg-background/50">
        <AppSidebar />
        <div className="flex flex-col flex-1 w-full max-w-full overflow-hidden">
          <header className="h-16 flex items-center justify-between px-6 border-b bg-white/50 backdrop-blur-sm z-10 sticky top-0">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="hover:bg-primary/10 hover:text-primary transition-colors" />
              <h1 className="font-display font-semibold text-lg hidden sm:block">
                Welcome back, {user.name.split(' ')[0]}
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <Button size="icon" variant="ghost" className="rounded-full relative">
                <Bell className="w-5 h-5 text-muted-foreground" />
                <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-destructive border-2 border-white"></span>
              </Button>
            </div>
          </header>
          <main className="flex-1 overflow-y-auto p-4 md:p-8">
            <div className="mx-auto max-w-6xl w-full">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
