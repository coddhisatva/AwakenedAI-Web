import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize OpenAI on the server side
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();
    
    if (!text) {
      return NextResponse.json(
        { error: 'Text parameter is required' },
        { status: 400 }
      );
    }

    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: text,
    });

    return NextResponse.json({
      embedding: response.data[0].embedding,
    });
  } catch (error: any) {
    console.error('Error generating embedding:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate embedding' },
      { status: 500 }
    );
  }
} 