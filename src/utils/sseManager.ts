import express from "express";

export interface SseClient {
  res: express.Response;
  userId: number | null;
  role: string | null;
}

// Single source of truth for all SSE clients
const sseClients: SseClient[] = [];

/**
 * Register a new SSE client. Call this from the /api/notifications/stream endpoint.
 */
export function registerSseClient(req: express.Request, res: express.Response): void {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });

  const userId = req.query.userId ? Number(req.query.userId) : null;
  const role = req.query.role ? String(req.query.role) : null;

  const client: SseClient = { res, userId, role };
  sseClients.push(client);

  res.write("data: connected\n\n");

  // Heartbeat every 30s to keep connection alive
  const heartbeat = setInterval(() => {
    res.write(":\n\n");
  }, 30000);

  req.on("close", () => {
    clearInterval(heartbeat);
    const idx = sseClients.indexOf(client);
    if (idx !== -1) {
      sseClients.splice(idx, 1);
    }
  });
}

/**
 * Broadcast a notification to matching SSE clients.
 * Matches by userId and/or targetRole.
 */
export function broadcastNotification(notification: {
  userId?: number | null;
  targetRole?: string | null;
  [key: string]: any;
}): void {
  for (const client of sseClients) {
    let matches = false;
    if (notification.userId && client.userId && notification.userId === client.userId) {
      matches = true;
    }
    if (notification.targetRole && client.role && notification.targetRole === client.role) {
      matches = true;
    }
    if (matches) {
      try {
        client.res.write(`data: ${JSON.stringify(notification)}\n\n`);
      } catch (err) {
        console.error("Failed to send SSE notification to client", err);
      }
    }
  }
}

/**
 * Get the current count of connected SSE clients (for health check/monitoring).
 */
export function getSseClientCount(): number {
  return sseClients.length;
}
