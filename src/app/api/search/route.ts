import { NextRequest, NextResponse } from 'next/server';
import { searchVectors } from '@/lib/server/supabase';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q');
  
  if (!query) {
    return NextResponse.json(
      { error: 'Query parameter is required' },
      { status: 400 }
    );
  }
  
  try {
    // Extract any filters from search parameters
    const filters: Record<string, any> = {};
    
    // Add metadata filters if provided
    for (const [key, value] of searchParams.entries()) {
      if (key !== 'q' && ['author', 'title', 'subject', 'creator'].includes(key)) {
        filters[key] = value;
      }
    }

    console.log('Searching for:', query);
    console.log('With filters:', filters);
    
    // Retrieve relevant chunks from vector database with proper error handling
    const chunks = await searchVectors(query, 5, filters);
    
    if (!chunks || chunks.length === 0) {
      console.log('No results found for query:', query);
      return NextResponse.json({
        content: "I couldn't find any information related to your query.",
        sources: []
      });
    }
    
    console.log(`Found ${chunks.length} relevant chunks`);
    
    // Prepare context from retrieved chunks
    const context = chunks.map(chunk => chunk.content);
    
    // Extract source information with better document property handling
    const sources = chunks.map(chunk => {
      // Ensure we have an object to work with, even if documents is undefined
      const doc = (chunk.documents as any) || {};
      return {
        id: chunk.id,
        title: doc.title || 'Unknown Document',
        author: doc.author || doc.creator || undefined,
        subject: doc.subject || undefined,
      };
    });
    
    // Generate response using our own function to keep code organization consistent
    const responseData = await generateCompletionResponse(query, context, request);
    
    // Return the generated response with source attribution
    return NextResponse.json({
      content: responseData.content,
      // Deduplicate sources by document ID to avoid repetition
      sources: Array.from(
        new Map(sources.map(s => [s.id, s])).values()
      ),
    });
  } catch (error: any) {
    console.error('Error processing search query:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process search query' },
      { status: 500 }
    );
  }
}

// Local function to generate completions
async function generateCompletionResponse(
  query: string, 
  context: string[],
  request: NextRequest
) {
  try {
    // Call the completion API
    const response = await fetch(new URL('/api/completion', request.url).toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        context,
        model: 'gpt-4-turbo',
        temperature: 0.7,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Error from completion API: ${response.status}`);
    }
    
    return await response.json();
  } catch (error: any) {
    console.error('Error generating completion:', error);
    // Return a simplified response in case of error
    return {
      content: `I found some information about "${query}", but I'm having trouble generating a comprehensive response. Please try again later.`,
    };
  }
} 