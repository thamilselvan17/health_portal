import { createContext, useContext, useEffect, useRef, useState, ReactNode } from "react";
import { useAuth } from "./use-auth";
import { useToast } from "./use-toast";
import { queryClient } from "@/lib/queryClient";

type WebSocketContextType = {
  socket: WebSocket | null;
  isConnected: boolean;
  sendMessage: (payload: any) => void;
};

const WebSocketContext = createContext<WebSocketContextType | null>(null);

export function WebSocketProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!user) {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      return;
    }

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}`;
    
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      setSocket(ws);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "notification") {
          toast({
            title: "New Notification",
            description: data.payload.message,
          });
          queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
        } else if (data.type === "message") {
          // If we are on the messages page, invalidate that specific chat query.
          // For now, invalidate all messages and show a quick toast if not on the messages page.
          queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
          queryClient.invalidateQueries({ queryKey: [`/api/messages/${data.payload.senderId}`] });
          toast({
            title: "New Message",
            description: "You have received a new message.",
          });
        }
      } catch (err) {
        console.error("Failed to parse WS message", err);
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      setSocket(null);
    };

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [user, toast]);

  const sendMessage = (payload: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(payload));
    }
  };

  return (
    <WebSocketContext.Provider value={{ socket, isConnected, sendMessage }}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocket() {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error("useWebSocket must be used within a WebSocketProvider");
  }
  return context;
}
