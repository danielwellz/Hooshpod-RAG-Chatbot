# Hooshpod RAG Chatbot

## Overview

Hooshpod RAG Chatbot is a Node.js 18/TypeScript backend that combines retrieval-augmented generation with OpenRouter LLMs. The service ingests a local knowledge base, embeds it with either Xenova or Cohere embeddings, and serves question-answering endpoints that cache responses and persist conversation history.

## Setup

```bash
pnpm install
cp .env.example .env
pnpm dev
```

Populate `.env` with your MongoDB, Redis, and OpenRouter credentials before starting the server. The development server boots on the port specified by `PORT` and automatically initializes the knowledge base on launch.

## API Examples

### Ask a Question

```bash
curl -X POST http://localhost:3000/ask \
  -H "Content-Type: application/json" \
  -d '{
    "conversationId": "demo-convo-1",
    "question": "What does the Hooshpod platform offer?"
  }'
```

### Retrieve Conversation History

```bash
curl "http://localhost:3000/history?conversationId=demo-convo-1&limit=10"
```

## Design Notes

- **In-memory vector store**: Keeps embeddings in process for fast similarity search during interviews; simplifies setup while remaining swappable for a persistent vector DB later.
- **Redis cache**: Avoids repeated LLM calls for identical questions within a conversation, reducing latency and cost via configurable TTL.
- **Modular structure**: Separates configuration, data sources, services, and routing to keep the codebase testable and easy to extend.

## Future Improvements

- Swap the in-memory vector store for a dedicated vector database (e.g., Pinecone, Qdrant) to persist knowledge across deployments.
- Add background jobs to refresh embeddings when the knowledge file changes.
- Introduce authentication and rate limiting on API routes.
- Expand test coverage, including integration tests with mocked LLM responses.
