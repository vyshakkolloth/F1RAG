import { NextResponse } from 'next/server';
import { searchDocuments } from '@/lib/rag';
import { generateResponse } from '@/lib/ollama';

export async function POST(req: Request) {
  try {
    const { query, limit = 5 } = await req.json();
    
    if (!query) {
      return NextResponse.json(
        { error: 'Missing query parameter' },
        { status: 400 }
      );
    }
    
    const documents = await searchDocuments(query, limit);
    const context = documents.map(doc => doc.text).join('\n\n');
    const answer = await generateResponse(query, context);
    
    return NextResponse.json({
      answer,
      sources: documents.map(doc => ({
        text: doc.text,
        similarity: doc.$similarity,
        metadata: doc.metadata
      }))
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to process search' },
      { status: 500 }
    );
  }
}