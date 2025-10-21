import axios from "axios";
import { env } from "../config/env";

const client = axios.create({
  baseURL: "https://openrouter.ai/api/v1",
  headers: {
    Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
    "Content-Type": "application/json",
  },
});

export const getCompletion = async (prompt: string): Promise<string> => {
  const response = await client.post("/chat/completions", {
    model: env.OPENROUTER_MODEL,
    messages: [{ role: "user", content: prompt }],
    temperature: 0.2,
  });

  const message = response.data?.choices?.[0]?.message?.content;

  if (!message) {
    throw new Error("OpenRouter response missing message content");
  }

  return message;
};
