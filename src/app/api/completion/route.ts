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

    // Format context exactly like the CLI version
    const formattedContext = formatContextForLLM(context);

    // Update system prompt to include citation guidance while allowing broader knowledge
    const systemPrompt = `You are Awakened AI, a knowledgeable assistant that prioritizes information from the provided context when available.
When using information from the provided context, cite your sources by referencing the Context Item numbers.
You may also draw on your general knowledge to supplement the provided context when necessary.
Aim to be comprehensive, accurate, and helpful in your responses.`;

    // Update how we structure the messages array
    const messages = [
      {
        role: "system",
        content: systemPrompt,
      },
      {
        role: "user",
        content: `Question: ${query}

Context:
${formattedContext}

Please answer the question. When using information from the context, cite the specific Context Item numbers.`
      },
    ];

    // Then use the messages in the OpenAI call
    const response = await openai.chat.completions.create({
      model: model || "gpt-4-turbo",
      temperature: temperature || 0.1,
      messages: messages,
    });

    console.log('Completion generated successfully');

    // Add this logging in the completion route
    console.log('Received context length:', context.length);
    console.log('Sample context item:', JSON.stringify(context[0], null, 2));
    console.log('Formatted context preview:', formattedContext.substring(0, 200) + '...');

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

// Format context items into a string for the prompt, matching CLI implementation
function formatContextForLLM(context: any[]): string {
  return context.map((item, i) => {
    // Extract content - be flexible with field naming to handle both text and content fields
    const content = item.text || item.content || "";
    const metadata = item.metadata || {};
    
    // Format exactly as CLI does with numbered context items
    return `Context Item ${i+1}:\n${content}\n\nSource: ${metadata.title || "Unknown Document"}\n`;
  }).join("\n");
} 