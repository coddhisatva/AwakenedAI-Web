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

    // Use a system prompt that matches the CLI version
    const systemPrompt = `You are a knowledgeable assistant that provides accurate, detailed answers based on the provided context. 
     If the answer cannot be determined from the context, acknowledge this limitation. 
     Cite specific sources when possible. Be concise but thorough.`;

    const response = await openai.chat.completions.create({
      model: model || "gpt-4-turbo",
      temperature: temperature || 0.1,
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: `Question: ${query}\n\nContext:\n${formattedContext}`
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

// Format context items into a string for the prompt, matching CLI implementation
function formatContextForLLM(context: any[]): string {
  const formattedItems = context.map((item, i) => {
    // Extract text and metadata
    const text = item.content || item.text || "";
    const metadata = item.metadata || {};
    
    // Format metadata (document title, page, etc.)
    let sourceInfo = `Source ${i+1}`;
    if (metadata.title) {
      sourceInfo += `: ${metadata.title}`;
    } else if (item.documents?.title) {
      sourceInfo += `: ${item.documents.title}`;
    }
    
    if (metadata.page) {
      sourceInfo += `, Page ${metadata.page}`;
    }
    
    // Add formatted item
    return `${sourceInfo}\n${text}\n`;
  });
  
  return formattedItems.join("\n");
} 