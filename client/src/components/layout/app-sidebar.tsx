import { Link, useLocation } from "wouter";
import { 
  Activity, 
  Calendar, 
  Users, 
  FileText, 
  LayoutDashboard, 
  LogOut,
  HeartPulse,
  Clock
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/use-auth";
import { ThemeToggle } from "@/components/theme-toggle";
import { AvatarUpload } from "@/components/avatar-upload";
import { NotificationsPopover } from "@/components/notifications-popover";
import { MessageSquare } from "lucide-react";

export function AppSidebar() {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();

  if (!user) return null;

  const isStudent = user.role === "student";

  const studentItems = [
    { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
    { title: "Appointments", url: "/dashboard/appointments", icon: Calendar },
    { title: "Medical History", url: "/dashboard/records", icon: Activity },
    { title: "Messages", url: "/dashboard/messages", icon: MessageSquare },
  ];

  const doctorItems = [
    { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
    { title: "Appointments", url: "/dashboard/appointments", icon: Calendar },
    { title: "Availability", url: "/dashboard/availability", icon: Clock },
    { title: "Patients", url: "/dashboard/patients", icon: Users },
    { title: "Medical Notes", url: "/dashboard/records", icon: FileText },
    { title: "Messages", url: "/dashboard/messages", icon: MessageSquare },
  ];

  const items = isStudent ? studentItems : doctorItems;

  const handleLogout = async () => {
    await logout();
    setLocation("/");
  };

  return (
    <Sidebar variant="inset">
      <SidebarContent>
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-lg shadow-primary/20 overflow-hidden">
             <img src="/logo.png" alt="Vasool Raja Logo" className="w-full h-full object-cover" />
          </div>
          <div>
            <h2 className="font-display font-bold text-lg leading-tight">Vasool Raja Hospital</h2>
            <p className="text-xs text-muted-foreground font-medium">Portal</p>
          </div>
        </div>

        <SidebarGroup>
          <SidebarGroupLabel className="px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Menu
          </SidebarGroupLabel>
          <SidebarGroupContent className="px-3 mt-2">
            <SidebarMenu>
              {items.map((item) => {
                const isActive = location === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton 
                      asChild 
                      isActive={isActive}
                      tooltip={item.title}
                      className={`rounded-xl h-11 mb-1 transition-all ${isActive ? 'bg-primary text-white shadow-md shadow-primary/20' : 'hover:bg-primary/5 text-foreground'}`}
                    >
                      <Link href={item.url} className="flex items-center gap-3 px-3">
                        <item.icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-muted-foreground'}`} />
                        <span className="font-medium">{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t">
        <div className="flex items-center gap-3 px-2 py-3 mb-2 rounded-xl bg-secondary/50">
          <AvatarUpload />
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-semibold truncate">{user.name}</p>
            <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
          </div>
          <NotificationsPopover />
          <ThemeToggle />
        </div>
        <button 
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 h-10 rounded-xl text-sm font-semibold text-destructive hover:bg-destructive/10 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </SidebarFooter>
    </Sidebar>
  );
}
