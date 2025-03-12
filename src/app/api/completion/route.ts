import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

// Initialize OpenAI on the server side
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Define proper interfaces for better type safety
interface ContextItem {
  text?: string;
  content?: string;
  metadata?: {
    title?: string;
    [key: string]: unknown;
  };
}

interface CompletionRequest {
  query: string;
  context: ContextItem[];
  model?: string;
  temperature?: number;
}

/**
 * Generate a completion from OpenAI based on provided context
 * Matches the structure from the processing repo
 */
export async function POST(request: NextRequest) {
  console.time('completion-total-time');
  try {
    const { query, context, model, temperature } = await request.json() as CompletionRequest;
    
    if (!query || !context) {
      return NextResponse.json(
        { error: 'Query and context parameters are required' },
        { status: 400 }
      );
    }

    console.log(`Generating completion for query: "${query}"`);
    console.log(`Context length: ${Array.isArray(context) ? context.length : 'Not an array'}`);
    console.log('First context item sample:', JSON.stringify(context[0]).substring(0, 200));

    // Format context exactly like the CLI version
    console.time('format-context-time');
    const formattedContext = formatContextForLLM(context);
    console.timeEnd('format-context-time');

    // Update system prompt to include citation guidance while allowing broader knowledge
    const systemPrompt = `You are Awakened AI, a knowledgeable assistant that prioritizes information from the provided context when available.
When using information from the provided context, cite your sources by referencing the Context Item numbers.
You may also draw on your general knowledge to supplement the provided context when necessary.
Aim to be comprehensive, accurate, and helpful in your responses.`;

    // Update how we structure the messages array
    const messages: ChatCompletionMessageParam[] = [
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
    console.time('openai-api-call');
    const response = await openai.chat.completions.create({
      model: model || "gpt-4-turbo",
      temperature: temperature || 0.1,
      messages: messages,
    });
    console.timeEnd('openai-api-call');

    console.log('Completion generated successfully');

    // Add this logging in the completion route
    console.log('Received context length:', context.length);
    console.log('Sample context item:', JSON.stringify(context[0], null, 2));
    console.log('Formatted context preview:', formattedContext.substring(0, 200) + '...');

    console.timeEnd('completion-total-time');

    return NextResponse.json({
      content: response.choices[0].message.content,
      usage: response.usage,
    });
  } catch (error: Error | unknown) {
    console.timeEnd('completion-total-time');
    console.error('Error generating completion:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate completion';
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

// Format context items into a string for the prompt, matching CLI implementation
function formatContextForLLM(context: ContextItem[]): string {
  return context.map((item, i) => {
    // Always prioritize the 'text' field to match CLI naming convention
    const content = item.text || item.content || "";
    const metadata = item.metadata || {};
    
    // Format as in the CLI
    return `Context Item ${i+1}:\n${content}\n\nSource: ${metadata.title || "Unknown Document"}\n`;
  }).join("\n");
}