export interface VectorRecord {
  id: string;
  text: string;
  vector: number[];
}

const store: VectorRecord[] = [];

const cosineSimilarity = (a: number[], b: number[]): number => {
  if (!a.length || a.length !== b.length) {
    return 0;
  }

  const dot = a.reduce((sum, value, index) => sum + value * b[index], 0);
  const normA = Math.sqrt(a.reduce((sum, value) => sum + value * value, 0));
  const normB = Math.sqrt(b.reduce((sum, value) => sum + value * value, 0));

  if (!normA || !normB) {
    return 0;
  }

  return dot / (normA * normB);
};

export const addToStore = (items: VectorRecord[]): void => {
  items.forEach((item) => {
    const existingIndex = store.findIndex((record) => record.id === item.id);

    if (existingIndex >= 0) {
      store[existingIndex] = item;
    } else {
      store.push(item);
    }
  });
};

export const search = (queryVector: number[], topK = 5): VectorRecord[] => {
  if (!queryVector.length) {
    return [];
  }

  return store
    .map((record) => ({
      record,
      score: cosineSimilarity(queryVector, record.vector),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map(({ record }) => record);
};

export const clearStore = (): void => {
  store.splice(0, store.length);
};
