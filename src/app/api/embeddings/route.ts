import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize OpenAI on the server side using environment variable
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * API route for generating embeddings
 * Matches the structure from the processing repo
 */
export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();
    
    if (!text) {
      return NextResponse.json(
        { error: 'Text parameter is required' },
        { status: 400 }
      );
    }

    console.log(`Generating embedding for text (${text.length} chars)`);

    // Use the same model as in the processing repo
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: text,
      encoding_format: "float",
    });

    console.log('Embedding generated successfully');

    return NextResponse.json({
      embedding: response.data[0].embedding,
      usage: response.usage,
    });
  } catch (error: any) {
    console.error('Error generating embedding:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to generate embedding',
        details: error.response?.data || {}
      },
      { status: 500 }
    );
  }
} 