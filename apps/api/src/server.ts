import { createApp } from "./app.js";
import { env } from "./lib/env.js";
import { logger } from "./lib/logger.js";
import { prisma } from "./lib/prisma.js";
import { attachSocket } from "./lib/socket.js";

const app = createApp();
const port = 4000;

const server = app.listen(port, () => {
  logger.info({ port }, "API listening");
});

const io = attachSocket(server);

// expose io for routes via global
(global as any).__io = io;

process.on("SIGTERM", async () => {
  logger.info("SIGTERM received, shutting down");
  await prisma.$disconnect();
  server.close(() => process.exit(0));
});
process.on("SIGINT", async () => {
  logger.info("SIGINT received, shutting down");
  await prisma.$disconnect();
  server.close(() => process.exit(0));
});
