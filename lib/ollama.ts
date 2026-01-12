import ollama from 'ollama';

export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await ollama.embeddings({
    model: 'nomic-embed-text',
    prompt: text
  });
  return response.embedding;
}

export async function generateResponse(prompt: string, context: string): Promise<string> {
  const response = await ollama.chat({
    model: 'llama3.2',
    messages: [{
      role: 'user',
      content: ` you are a helpful f1 information assistant .  which five information based on the context provided: ${context}\n\nQuestion: ${prompt}\n\nAnswer based on the context provided:`
    }]
  });
  return response.message.content;
}