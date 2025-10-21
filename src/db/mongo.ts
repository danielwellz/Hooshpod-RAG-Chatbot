import mongoose from "mongoose";
import { env } from "../config/env";

mongoose.set("strictQuery", true);

let connectionPromise: Promise<typeof mongoose> | null = null;

export const connectMongo = async (): Promise<typeof mongoose> => {
  if (connectionPromise) {
    return connectionPromise;
  }

  connectionPromise = mongoose.connect(env.MONGO_URI);

  mongoose.connection.on("connected", () => {
    console.info("MongoDB connected");
  });

  mongoose.connection.on("error", (error) => {
    console.error("MongoDB connection error", error);
  });

  mongoose.connection.on("disconnected", () => {
    console.warn("MongoDB disconnected");
  });

  return connectionPromise;
};

export const disconnectMongo = async (): Promise<void> => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    connectionPromise = null;
  }
};
