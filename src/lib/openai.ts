'use client';

// Generate embeddings for a text by calling our server-side API
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    // Call our server-side API endpoint
    const response = await fetch('/api/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }

    const { embedding } = await response.json();
    return embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    // Return random embedding for development to avoid breaking the UI
    if (process.env.NODE_ENV === 'development') {
      return Array.from({ length: 1536 }, () => Math.random() * 2 - 1);
    }
    throw new Error('Failed to generate embedding');
  }
}

// Generate a response from the LLM by calling our server-side API
export async function generateResponse(
  query: string, 
  context: string[],
  options: { model?: string; temperature?: number } = {}
) {
  try {
    // Call our server-side API endpoint
    const response = await fetch('/api/completion', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        context,
        model: options.model,
        temperature: options.temperature,
      }),
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }

    const { content } = await response.json();
    return content;
  } catch (error) {
    console.error('Error generating response:', error);
    // Return mock response for development to avoid breaking the UI
    if (process.env.NODE_ENV === 'development') {
      const contextText = context.join('\n\n');
      return `Here is information about "${query}":\n\n${contextText.substring(0, 200)}...\n\nThis is a mock response for development.`;
    }
    throw new Error('Failed to generate response');
  }
} 