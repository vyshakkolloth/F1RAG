import { generateEmbedding } from './ollama';
import { getCollection } from './astradb';

export interface Document {
  id: string;
  text: string;
  metadata?: Record<string, any>;
}

export async function addDocument(doc: Document) {
  const collection = await getCollection();
  const embedding = await generateEmbedding(doc.text);
  
  await collection.insertOne({
    _id: doc.id,
    text: doc.text,
    metadata: doc.metadata || {},
    $vector: embedding
  });
  
  return { success: true, id: doc.id };
}

export async function searchDocuments(query: string, limit: number = 5) {
  const collection = await getCollection();
  const queryEmbedding = await generateEmbedding(query);
  
  const results = await collection.find(
    {},
    {
      sort: { $vector: queryEmbedding },
      limit: limit,
      includeSimilarity: true
    }
  ).toArray();
  
  return results;
}