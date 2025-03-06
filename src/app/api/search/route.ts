import { NextRequest, NextResponse } from 'next/server';
import { searchVectors } from '@/lib/supabase';
import { generateResponse } from '@/lib/openai';

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
    // Get search filters from query parameters (if any)
    const filters: Record<string, any> = {};
    
    // Add metadata filters if they are provided in the search params
    for (const [key, value] of searchParams.entries()) {
      if (key !== 'q') {
        filters[key] = value;
      }
    }
    
    // Retrieve relevant chunks from vector database
    const chunks = await searchVectors(query, 5, filters);
    
    // If no chunks were found, return a message
    if (!chunks || chunks.length === 0) {
      return NextResponse.json({
        content: "I couldn't find any information related to your query.",
        sources: []
      });
    }
    
    // Prepare context from retrieved chunks
    const context = chunks.map(chunk => chunk.content);
    
    // Extract source information
    const sources = chunks.map(chunk => ({
      id: chunk.id,
      title: chunk.documents?.title || 'Unknown Document',
      author: chunk.documents?.author || undefined,
    }));
    
    // Generate response from LLM
    const content = await generateResponse(query, context);
    
    // Return the generated response with source attribution
    return NextResponse.json({
      content,
      sources: [...new Map(sources.map(s => [s.id, s])).values()], // Deduplicate sources
    });
  } catch (error) {
    console.error('Error processing search query:', error);
    return NextResponse.json(
      { error: 'Failed to process search query' },
      { status: 500 }
    );
  }
} 