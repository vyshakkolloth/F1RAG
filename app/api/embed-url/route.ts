import { NextResponse } from 'next/server';
import { fetchWikipediaPage, chunkText } from '@/lib/wikipedia';
import { addDocument } from '@/lib/rag';

export async function POST(req: Request) {
  try {
    const { url } = await req.json();
    
    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }
    
    const sections = await fetchWikipediaPage(url);
    let totalChunks = 0;
    
    for (const section of sections) {
      const chunks = chunkText(section.content, 800);
      
      for (let i = 0; i < chunks.length; i++) {
        const chunkId = `wiki-${Date.now()}-${section.title.toLowerCase().replace(/\s+/g, '-')}-${i}`;
        
        await addDocument({
          id: chunkId,
          text: chunks[i],
          metadata: {
            source: 'Wikipedia',
            url,
            section: section.title,
            chunkIndex: i,
            totalChunks: chunks.length,
            addedAt: new Date().toISOString()
          }
        });
        
        totalChunks++;
      }
    }
    
    return NextResponse.json({
      success: true,
      sectionsProcessed: sections.length,
      chunksCreated: totalChunks
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to embed Wikipedia page' },
      { status: 500 }
    );
  }
}
```

## Step 6: Run the Embedding

### Option A: Using the Script (Recommended)

```bash
# Make sure Ollama is running
ollama serve

# In another terminal
npm run embed-f1
```

### Option B: Using the API

```typescript
const response = await fetch('/api/embed-url', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    url: 'https://en.wikipedia.org/wiki/Formula_One'
  })
});

const result = await response.json();
console.log(result);
// { success: true, sectionsProcessed: 15, chunksCreated: 42 }
```

## Step 7: Test Your RAG System

Create a simple test query:

```typescript
const response = await fetch('/api/search', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: 'What is Formula One?',
    limit: 3
  })
});

const { answer, sources } = await response.json();
console.log('Answer:', answer);
console.log('Sources:', sources);