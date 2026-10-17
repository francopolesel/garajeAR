import { Server } from "socket.io";
import { getSessionUser } from "./auth.js";
import { prisma } from "./prisma.js";

export function attachSocket(httpServer: any) {
  const io = new Server(httpServer, { cors: { origin: process.env.WEB_ORIGIN || "http://localhost:5173", credentials: true } });

  io.use(async (socket, next) => {
    try {
      const cookieHeader = socket.handshake.headers.cookie || "";
      const sidMatch = cookieHeader.match(/sid=([^;]+)/);
      const raw = sidMatch ? decodeURIComponent(sidMatch[1]) : undefined;
      const user = await getSessionUser(raw);
      if (!user) return next(new Error("unauthorized"));
      (socket as any).userId = user.id;
      next();
    } catch (e) { next(e as Error); }
  });

  io.on("connection", (socket) => {
    const userId = (socket as any).userId as string;
    socket.join(`user:${userId}`);

    socket.on("conversation:join", async (conversationId: string) => {
      const member = await prisma.conversationMember.findUnique({ where: { conversationId_userId: { conversationId, userId } } });
      if (member) socket.join(`conv:${conversationId}`);
    });

    socket.on("typing:start", async (conversationId: string) => {
      const member = await prisma.conversationMember.findUnique({ where: { conversationId_userId: { conversationId, userId } } });
      if (member) socket.to(`conv:${conversationId}`).emit("typing:start", { conversationId, userId });
    });

    socket.on("typing:stop", async (conversationId: string) => {
      const member = await prisma.conversationMember.findUnique({ where: { conversationId_userId: { conversationId, userId } } });
      if (member) socket.to(`conv:${conversationId}`).emit("typing:stop", { conversationId, userId });
    });

    socket.on("disconnect", () => {
      // presence could be tracked here; minimal
    });
  });

  return io;
}
