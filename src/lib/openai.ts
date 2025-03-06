import OpenAI from 'openai';

// Initialize the OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Generate embeddings for a text
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: text,
    });

    return response.data[0].embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw new Error('Failed to generate embedding');
  }
}

// Generate a response from the LLM
export async function generateResponse(
  query: string, 
  context: string[],
  options: { model?: string; temperature?: number } = {}
) {
  const model = options.model || "gpt-4-turbo";
  const temperature = options.temperature || 0.7;
  
  try {
    const response = await openai.chat.completions.create({
      model,
      temperature,
      messages: [
        {
          role: "system",
          content: `You are an AI assistant that answers questions based on the provided context. 
          If the answer is not contained within the context, say "I don't have enough information to answer that."
          Always include the source of your information.`,
        },
        {
          role: "user",
          content: `Context information is below.
          ---------------------
          ${context.join('\n\n')}
          ---------------------
          Given the context information and not prior knowledge, answer the question: ${query}`,
        },
      ],
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error('Error generating response:', error);
    throw new Error('Failed to generate response');
  }
} 