import Redis from "ioredis";
import { env, isProduction } from "../config/env";

let client: Redis | null = null;

const createClient = (): Redis => {
  const redis = new Redis(env.REDIS_URL, {
    lazyConnect: true,
    maxRetriesPerRequest: null,
    showFriendlyErrorStack: !isProduction,
    tls: env.REDIS_URL.startsWith("rediss://") ? {} : undefined,
  });

  redis.on("connect", () => {
    console.info("Redis connected");
  });

  redis.on("error", (error) => {
    console.error("Redis error", error);
  });

  return redis;
};

export const getRedisClient = (): Redis => {
  if (!client) {
    client = createClient();
  }

  return client;
};

export const connectRedis = async (): Promise<void> => {
  const redis = getRedisClient();

  if (redis.status === "wait" || redis.status === "end") {
    await redis.connect();
  }
};

export const disconnectRedis = async (): Promise<void> => {
  if (!client) {
    return;
  }

  await client.quit();
  client = null;
};
