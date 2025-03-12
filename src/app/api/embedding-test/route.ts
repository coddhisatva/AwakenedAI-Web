import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Create a singleton OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function GET(request: NextRequest) {
  try {
    // Get timing information
    const startTime = Date.now();
    
    // Log environment info
    console.log('API_KEY_EXISTS:', !!process.env.OPENAI_API_KEY);
    console.log('API_KEY_LENGTH:', process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.length : 0);
    console.log('ENV:', process.env.NODE_ENV);
    
    // Test text - simple to minimize token count
    const testText = "This is a test for embedding performance.";
    
    // Time the actual API request
    console.time('embedding-api-request');
    const response = await openai.embeddings.create({
      model: "text-embedding-ada-002",
      input: testText,
      encoding_format: "float",
    });
    console.timeEnd('embedding-api-request');
    
    const totalTime = Date.now() - startTime;
    
    return NextResponse.json({
      success: true,
      text: testText,
      dimensions: response.data[0].embedding.length,
      timingMs: {
        total: totalTime,
        // Add other timing metrics from the logs
      },
      usage: response.usage
    });
  } catch (error: Error | unknown) {
    console.error('Error in embedding test:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json({
      success: false,
      error: errorMessage
    }, { status: 500 });
  }
} 