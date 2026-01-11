import { DataAPIClient } from '@datastax/astra-db-ts';
const client = new DataAPIClient(process.env.ASTRA_DB_APPLICATION_TOKEN!);
const db = client.db(process.env.ASTRA_DB_API_ENDPOINT!, { namespace: process.env.ASTRA_DB_NAMESPACE });

export async function getCollection() {
  const collection = await db.collection(process.env.ASTRA_DB_COLLECTION!);
  return collection;
}

export async function createCollection() {
  try {
    await db.createCollection(process.env.ASTRA_DB_COLLECTION!, {
      vector: {
        dimension: 768, // nomic-embed-text dimensions
        metric: 'cosine'
      }
    });
    console.log('Collection created successfully');
  } catch (error) {
    console.log('Collection might already exist', error);
  }
}