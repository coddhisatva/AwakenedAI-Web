import { NextRequest, NextResponse } from 'next/server';
import { OpenAI } from 'openai';
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Types
interface ContextItem {
  text: string;
  metadata?: {
    title?: string;
    author?: string;
    source?: string;
    document_id?: string;
    created_at?: string;
    [key: string]: any;
  };
}

interface CompletionRequest {
  query: string;
  context: ContextItem[];
  conversation_history?: { role: string; content: string }[];
  temperature?: number;
  max_tokens?: number;
}

// Stream encoder function to format messages
const encoder = (data: any) => {
  const json = JSON.stringify(data);
  return new TextEncoder().encode(`${json}\n`);
};

export async function POST(request: NextRequest) {
  try {
    console.log(`[${new Date().toISOString()}] Streaming completion request received`);
    const startTime = Date.now();
    
    // Parse request body
    const requestData: CompletionRequest = await request.json();
    
    // Validate required parameters
    const { query, context, conversation_history } = requestData;
    if (!query || !context) {
      console.log(`[${new Date().toISOString()}] Missing required parameters`);
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }
    
    const temperature = requestData.temperature ?? 0.1;
    const max_tokens = requestData.max_tokens ?? 2000;
    
    console.log(`[${new Date().toISOString()}] Processing query: "${query.substring(0, 50)}${query.length > 50 ? '...' : ''}"`);
    console.log(`[${new Date().toISOString()}] Context items: ${context.length}`);
    console.log(`[${new Date().toISOString()}] First context item: ${JSON.stringify(context[0]?.text?.substring(0, 100) || 'N/A')}...`);
    console.log(`[${new Date().toISOString()}] Conversation history: ${conversation_history ? conversation_history.length : 'None'}`);
    
    // Format context for the model
    console.log(`[${new Date().toISOString()}] Formatting context for model...`);
    const contextFormatStart = Date.now();
    
    let formattedContext = '';
    context.forEach((item, index) => {
      formattedContext += `\n--- DOCUMENT ${index + 1} ---\n${item.text}\n`;
    });
    
    console.log(`[${new Date().toISOString()}] Context formatting completed in ${Date.now() - contextFormatStart}ms`);
    console.log(`[${new Date().toISOString()}] Formatted context length: ${formattedContext.length} characters`);
    
    // Create prompt
    const messages: ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: 'You are a helpful AI assistant that provides accurate and concise information based on the provided context. When answering:\n\n1. Focus on the information present in the context.\n2. If the context doesn\'t provide enough information to answer the question fully, acknowledge the limitations.\n3. Always start your response with a complete sentence, using proper capitalization.\n4. Use proper punctuation and paragraph breaks for readability.\n5. Provide a coherent, well-structured response that fully addresses the query.\n6. Maintain continuity with any previous conversation if provided.'
      }
    ];
    
    // Add conversation history if available
    if (conversation_history && conversation_history.length > 0) {
      // Add previous messages from conversation history
      conversation_history.forEach(msg => {
        messages.push({
          role: msg.role as 'user' | 'assistant' | 'system',
          content: msg.content
        });
      });
      
      // Add the current query with context
      messages.push({
        role: 'user',
        content: `I need information about the following query: "${query}"\n\nHere is the relevant context:\n${formattedContext}`
      });
    } else {
      // No conversation history, just add the query
      messages.push({
        role: 'user',
        content: `I need information about the following query: "${query}"\n\nHere is the relevant context:\n${formattedContext}`
      });
    }
    
    // Create the transform stream for the response
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();
    
    // Log before OpenAI API call
    const apiCallStartTime = Date.now();
    console.log(`[${new Date().toISOString()}] Starting OpenAI API call with gpt-4o model`);
    console.log(`[${new Date().toISOString()}] OpenAI API key exists: ${!!process.env.OPENAI_API_KEY}`);
    console.log(`[${new Date().toISOString()}] OpenAI API key length: ${process.env.OPENAI_API_KEY?.length || 0}`);
    
    // Make the OpenAI API call with streaming
    console.log(`[${new Date().toISOString()}] Creating chat completion with streaming...`);
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: messages,
      temperature: temperature,
      max_tokens: max_tokens,
      stream: true,
    });
    console.log(`[${new Date().toISOString()}] OpenAI streaming connection established`);
    
    // Process the streaming response
    (async () => {
      try {
        let fullResponse = '';
        let chunkCount = 0;
        
        // Handle each chunk as it arrives
        console.log(`[${new Date().toISOString()}] Beginning to process streaming chunks`);
        for await (const chunk of completion) {
          chunkCount++;
          const content = chunk.choices[0]?.delta?.content || '';
          
          if (content) {
            fullResponse += content;
            
            // Send the chunk to the client
            console.log(`[${new Date().toISOString()}] Sending chunk #${chunkCount}: ${content.length} chars`);
            await writer.write(
              encoder({
                type: 'chunk',
                content: content,
                // Include the current position of this chunk in the full response
                position: fullResponse.length - content.length,
                // Include full accumulated content for safer client-side rendering
                fullContent: fullResponse,
              })
            );
          } else {
            console.log(`[${new Date().toISOString()}] Received empty content chunk #${chunkCount}`);
          }
        }
        
        // Log completion of OpenAI API call
        const apiCallDuration = Date.now() - apiCallStartTime;
        console.log(`[${new Date().toISOString()}] OpenAI API call completed in ${apiCallDuration}ms`);
        console.log(`[${new Date().toISOString()}] Received ${chunkCount} chunks in total`);
        console.log(`[${new Date().toISOString()}] Final response length: ${fullResponse.length} characters`);
        
        // Format and clean up the full response
        const formattedResponse = fullResponse.trim();
        
        // Send the completion message
        console.log(`[${new Date().toISOString()}] Sending completion done message`);
        await writer.write(
          encoder({
            type: 'done',
            content: formattedResponse,
          })
        );
        
        // Log total request time
        const totalDuration = Date.now() - startTime;
        console.log(`[${new Date().toISOString()}] Streaming completion request completed in ${totalDuration}ms`);
      } catch (error) {
        console.error(`[${new Date().toISOString()}] Error during streaming:`, error);
        
        // Send error message to client
        console.log(`[${new Date().toISOString()}] Sending error message to client`);
        await writer.write(
          encoder({
            type: 'error',
            error: error instanceof Error ? error.message : 'Unknown error during streaming',
          })
        );
      } finally {
        await writer.close();
        console.log(`[${new Date().toISOString()}] Stream writer closed`);
      }
    })();
    
    // Return the stream response
    console.log(`[${new Date().toISOString()}] Returning stream response`);
    return new NextResponse(stream.readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error in completion-stream API:`, error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 