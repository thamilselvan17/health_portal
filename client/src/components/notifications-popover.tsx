import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Bell, Check } from "lucide-react";
import { format } from "date-fns";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/hooks/use-auth";
import type { Notification } from "@shared/schema";

export function NotificationsPopover() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
    enabled: !!user,
  });

  const markReadMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("PUT", `/api/notifications/${id}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative text-muted-foreground hover:text-foreground transition-colors"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-background border-red-500 animate-pulse" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 rounded-2xl shadow-xl" align="start">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold text-lg">Notifications</h3>
          {unreadCount > 0 && (
            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
              {unreadCount} new
            </span>
          )}
        </div>
        
        <ScrollArea className="h-[300px]">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground flex items-center justify-center flex-col h-full">
              <Bell className="w-8 h-8 mb-2 opacity-20" />
              <p className="text-sm">No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {notifications.slice().reverse().map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 flex gap-3 transition-colors ${
                    !notification.read ? "bg-primary/5" : ""
                  }`}
                >
                  <div className="flex-1 space-y-1">
                    <p className={`text-sm ${!notification.read ? "font-medium" : "text-muted-foreground"}`}>
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(notification.timestamp), "MMM d, h:mm a")}
                    </p>
                  </div>
                  {!notification.read && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-primary shrink-0"
                      onClick={() => markReadMutation.mutate(notification.id)}
                      title="Mark as read"
                    >
                      <Check className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
