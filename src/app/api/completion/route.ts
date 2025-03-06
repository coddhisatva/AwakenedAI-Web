import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize OpenAI on the server side
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Generate a completion from OpenAI based on provided context
 * Matches the structure from the processing repo
 */
export async function POST(request: NextRequest) {
  try {
    const { query, context, model, temperature } = await request.json();
    
    if (!query || !context) {
      return NextResponse.json(
        { error: 'Query and context parameters are required' },
        { status: 400 }
      );
    }

    console.log(`Generating completion for query: "${query}"`);
    console.log(`Context length: ${Array.isArray(context) ? context.length : 'Not an array'}`);

    const contextText = Array.isArray(context) 
      ? context.join('\n\n---\n\n') 
      : context;

    const response = await openai.chat.completions.create({
      model: model || "gpt-4-turbo",
      temperature: temperature || 0.7,
      messages: [
        {
          role: "system",
          content: `You are a knowledgeable AI assistant that provides informative answers based on the context provided.
          
          CONTEXT INFORMATION:
          ---------------------
          ${contextText}
          ---------------------
          
          INSTRUCTIONS:
          1. Base your answer only on the context provided, not prior knowledge.
          2. If the answer is not contained within the context, say "I don't have enough information to answer that."
          3. Cite the sources where you found the information.
          4. Use markdown formatting for better readability.
          5. Be concise but comprehensive.`,
        },
        {
          role: "user",
          content: query,
        },
      ],
    });

    console.log('Completion generated successfully');

    return NextResponse.json({
      content: response.choices[0].message.content,
      usage: response.usage,
    });
  } catch (error: any) {
    console.error('Error generating completion:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to generate completion',
        details: error.response?.data || {}
      },
      { status: 500 }
    );
  }
} 