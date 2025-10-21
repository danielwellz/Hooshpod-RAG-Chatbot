import { Buffer } from "node:buffer";
import { promises as fs } from "node:fs";
import path from "node:path";
import { env } from "../config/env";
import { getRedisClient } from "../db/redis";
import { getEmbeddings as embed } from "../lib/embeddings";
import { addToStore, search, VectorRecord } from "../lib/vector";
import { getCompletion as llmChat } from "../lib/openrouter";
import { Message } from "../models/Message";

const redis = getRedisClient();

let ragReady = false;
let ragPromise: Promise<void> | null = null;

export const chunkText = (text: string, size: number): string[] => {
  if (!text.trim()) {
    return [];
  }

  const normalized = text.replace(/\r\n/g, "\n");
  const paragraphs = normalized.split(/\n{2,}/).map((paragraph) => paragraph.trim());

  const chunks: string[] = [];

  paragraphs.forEach((paragraph) => {
    if (!paragraph) {
      return;
    }

    if (paragraph.length <= size) {
      chunks.push(paragraph);
      return;
    }

    let start = 0;
    while (start < paragraph.length) {
      const end = Math.min(start + size, paragraph.length);
      chunks.push(paragraph.slice(start, end));
      start = end;
    }
  });

  return chunks;
};

const loadKnowledge = async (): Promise<{ chunks: string[]; filePath: string }> => {
  const filePath = path.resolve(env.KNOWLEDGE_FILE);
  const raw = await fs.readFile(filePath, "utf-8");
  const chunks = chunkText(raw, env.CHUNK_SIZE);

  return { chunks, filePath };
};

export const initializeRAG = async (): Promise<void> => {
  if (ragReady) {
    return;
  }

  if (ragPromise) {
    return ragPromise;
  }

  ragPromise = (async () => {
    const { chunks, filePath } = await loadKnowledge();

    if (!chunks.length) {
      console.warn(`Knowledge base at ${filePath} is empty.`);
      ragReady = true;
      return;
    }

    const embeddings = await embed(chunks);

    const items: VectorRecord[] = embeddings.map((vector, index) => ({
      id: `${filePath}:${index}`,
      text: chunks[index],
      vector,
    }));

    addToStore(items);
    ragReady = true;
    console.info(`RAG initialized with ${items.length} knowledge chunks.`);
  })()
    .catch((error) => {
      ragReady = false;
      console.error("Failed to initialize RAG store", error);
      throw error;
    })
    .finally(() => {
      ragPromise = null;
    });

  return ragPromise;
};

const buildPrompt = (question: string, contexts: VectorRecord[]): string => {
  const contextText = contexts.map((item, index) => `Snippet ${index + 1}::\n${item.text}`).join("\n\n");

  return [
    "You are a helpful assistant that answers using provided knowledge snippets when possible.",
    contextText ? `Context:\n${contextText}` : "Context: (none)",
    `Question: ${question}`,
    "Answer:",
  ].join("\n\n");
};

interface AnswerPayload {
  answer: string;
  contexts: VectorRecord[];
}

const cacheKeyFor = (conversationId: string, question: string): string => {
  return `rag:answer:${conversationId}:${Buffer.from(question).toString("base64")}`;
};

export const answerQuestion = async (
  question: string,
  conversationId: string
): Promise<AnswerPayload> => {
  await initializeRAG();

  const key = cacheKeyFor(conversationId, question);

  const cached = await redis.get(key);
  if (cached) {
    const parsed = JSON.parse(cached) as AnswerPayload;
    return parsed;
  }

  const [questionVector] = await embed([question]);
  const contexts = questionVector ? search(questionVector, env.TOP_K) : [];

  const prompt = buildPrompt(question, contexts);
  const answer = await llmChat(prompt);

  const payload: AnswerPayload = { answer, contexts };

  await Promise.all([
    Message.create({
      conversationId,
      role: "user",
      content: question,
      meta: { contexts: contexts.map((item) => item.id) },
    }),
    Message.create({
      conversationId,
      role: "assistant",
      content: answer,
      meta: { contexts },
    }),
    redis.set(key, JSON.stringify(payload), "EX", env.CACHE_TTL_SECONDS),
  ]);

  return payload;
};

export const getHistory = async (
  conversationId: string,
  limit = 20
) => {
  return Message.find({ conversationId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean()
    .then((docs) => docs.reverse());
};
