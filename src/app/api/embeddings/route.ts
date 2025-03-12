import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize OpenAI on the server side using environment variable
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface EmbeddingRequest {
  text: string;
}

/**
 * API route for generating embeddings
 * Matches the structure from the processing repo
 */
export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json() as EmbeddingRequest;
    
    if (!text) {
      return NextResponse.json(
        { error: 'Text parameter is required' },
        { status: 400 }
      );
    }

    console.log(`Generating embedding for text (${text.length} chars)`);

    // Use the same model as in the processing repo
    const response = await openai.embeddings.create({
      model: "text-embedding-ada-002",
      input: text,
      encoding_format: "float",
    });

    console.log('Embedding generated successfully');

    return NextResponse.json({
      embedding: response.data[0].embedding,
      usage: response.usage,
    });
  } catch (error: Error | unknown) {
    console.error('Error generating embedding:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate embedding';
    const errorDetails = error instanceof Error && 'response' in error 
      ? (error as any).response?.data || {} 
      : {};
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: errorDetails
      },
      { status: 500 }
    );
  }
} 