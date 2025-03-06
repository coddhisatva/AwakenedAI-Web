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
      const doc = chunk.documents || {};
      return {
        id: chunk.id,
        title: doc.title || 'Unknown Document',
        author: doc.author || doc.creator || undefined,
        subject: doc.subject || undefined,
      };
    });
    
    // Generate response from LLM
    const content = await generateResponse(query, context);
    
    // Return the generated response with source attribution
    return NextResponse.json({
      content,
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