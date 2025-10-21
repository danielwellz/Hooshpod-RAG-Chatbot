import http from "node:http";
import app from "./app";
import { env } from "./config/env";
import { connectMongo, disconnectMongo } from "./db/mongo";
import { connectRedis, disconnectRedis } from "./db/redis";
import { initializeRAG } from "./services/chat.service";

const bootstrap = async (): Promise<void> => {
  try {
    await connectMongo();
    await connectRedis();
    await initializeRAG();

    const server = http.createServer(app);

    server.listen(env.PORT, () => {
      console.info(`Server listening on port ${env.PORT}`);
    });

    const shutdown = async () => {
      console.info("Shutting down gracefully");

      server.close(() => {
        console.info("HTTP server closed");
      });

      await Promise.all([disconnectMongo(), disconnectRedis()]);

      process.exit(0);
    };

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
  } catch (error) {
    console.error("Failed to bootstrap application", error);
    process.exit(1);
  }
};

bootstrap();
