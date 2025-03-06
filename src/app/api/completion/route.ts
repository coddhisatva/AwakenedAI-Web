import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize OpenAI on the server side
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { query, context, model, temperature } = await request.json();
    
    if (!query || !context) {
      return NextResponse.json(
        { error: 'Query and context parameters are required' },
        { status: 400 }
      );
    }

    const response = await openai.chat.completions.create({
      model: model || "gpt-4-turbo",
      temperature: temperature || 0.7,
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
          ${Array.isArray(context) ? context.join('\n\n') : context}
          ---------------------
          Given the context information and not prior knowledge, answer the question: ${query}`,
        },
      ],
    });

    return NextResponse.json({
      content: response.choices[0].message.content,
    });
  } catch (error: any) {
    console.error('Error generating completion:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate completion' },
      { status: 500 }
    );
  }
} 