import { WebSocketServer, WebSocket } from "ws";
import type { Server } from "http";
import type { Request } from "express";
import session from "express-session";

interface ExtendedWebSocket extends WebSocket {
  userId?: string;
  role?: string;
  isAlive: boolean;
}

export function setupWebSocket(server: Server, sessionMiddleware: any) {
  const wss = new WebSocketServer({ noServer: true });

  server.on("upgrade", (request: Request, socket, head) => {
    sessionMiddleware(request, {} as any, () => {
      if (!request.session || !request.session.userId) {
        socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
        socket.destroy();
        return;
      }

      wss.handleUpgrade(request, socket, head, (ws) => {
        const extWs = ws as ExtendedWebSocket;
        extWs.userId = request.session.userId;
        extWs.role = request.session.role;
        wss.emit("connection", extWs, request);
      });
    });
  });

  wss.on("connection", (ws: ExtendedWebSocket, req) => {
    ws.isAlive = true;
    ws.on("pong", () => { ws.isAlive = true; });

    ws.on("message", (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        // For now, clients might just listen. But if they send something, log it.
        console.log(`Received message from user ${ws.userId}:`, message);
      } catch (err) {
        console.error("Error parsing WS message:", err);
      }
    });

    ws.on("close", () => {
      // Clean up connection
    });

    ws.on("error", (error) => {
      console.error(`WebSocket error for user ${ws.userId || "unknown"}:`, error);
    });
  });

  wss.on("error", (error) => {
    console.error("WebSocket server error:", error);
  });

  const interval = setInterval(() => {
    wss.clients.forEach((client) => {
      const extClient = client as ExtendedWebSocket;
      if (extClient.isAlive === false) return extClient.terminate();
      extClient.isAlive = false;
      extClient.ping();
    });
  }, 30000);

  wss.on("close", () => {
    clearInterval(interval);
  });

  return {
    broadcastToUser: (userId: string, event: string, data: any) => {
      wss.clients.forEach((client) => {
        const extClient = client as ExtendedWebSocket;
        if (extClient.readyState === WebSocket.OPEN && extClient.userId === userId) {
          extClient.send(JSON.stringify({ type: event, payload: data }));
        }
      });
    },
    broadcastToRole: (role: string, event: string, data: any) => {
      wss.clients.forEach((client) => {
        const extClient = client as ExtendedWebSocket;
        if (extClient.readyState === WebSocket.OPEN && extClient.role === role) {
          extClient.send(JSON.stringify({ type: event, payload: data }));
        }
      });
    }
  };
}
