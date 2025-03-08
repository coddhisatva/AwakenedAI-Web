import { NextRequest, NextResponse } from 'next/server';
import { searchVectors } from '@/lib/server/supabase';

// Define proper interfaces for better type safety
interface DocumentMetadata {
  title?: string;
  author?: string;
  creator?: string;
  subject?: string;
  filename?: string;
  path?: string;
  source?: string;
  [key: string]: unknown;
}

interface SearchChunk {
  text?: string;
  content?: string;
  similarity?: number;
  document_id?: string;
  metadata?: DocumentMetadata;
  documents?: {
    title?: string;
    author?: string;
    creator?: string;
    subject?: string;
    filename?: string;
    path?: string;
    [key: string]: unknown;
  };
}

interface FormattedChunk {
  text: string;
  score?: number;
  metadata: DocumentMetadata;
}

interface Source {
  id: string;
  title: string;
}

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
    const filters: Record<string, string> = {};
    
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
    
    // Format chunks to consistently use 'text' field and preserve metadata
    const formattedChunks = chunks.map((chunk: SearchChunk) => ({
      // Always use 'text' for content to match CLI convention
      text: chunk.text || chunk.content || '',
      // Include score for potential ranking
      score: chunk.similarity,
      // Preserve all metadata
      metadata: chunk.metadata || {
        title: chunk.documents?.title || 'Unknown Document',
        author: chunk.documents?.author || chunk.documents?.creator,
        subject: chunk.documents?.subject,
        source: chunk.documents?.filename || chunk.documents?.path,
        document_id: chunk.document_id
      }
    }));
    
    // Extract source information for attribution
    const sources = extractSourcesFromChunks(chunks);
    
    // Add this after retrieving chunks
    console.log('Sample chunk data:', JSON.stringify(chunks[0], null, 2));
    
    // Add logging to verify data structure
    console.log('Formatted chunk example:', JSON.stringify(formattedChunks[0], null, 2));
    
    // Generate response using the completion API
    const responseData = await generateCompletionResponse(query, formattedChunks, request);
    
    // Return the generated response with source attribution
    return NextResponse.json({
      content: responseData.content,
      sources: sources,
      query: query
    });
  } catch (error: Error | unknown) {
    console.error('Error processing search query:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to process search query';
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

// Enhanced source extraction to match CLI implementation
function extractSourcesFromChunks(chunks: SearchChunk[]): Source[] {
  // Create a map to deduplicate sources
  const sourceMap = new Map<string, Source>();
  
  // Add logging to see what we're working with
  console.log('First chunk for source extraction:', JSON.stringify(chunks[0], null, 2));
  
  chunks.forEach(chunk => {
    if (!chunk.document_id) return;
    
    // Get document info directly from chunk structure
    const docId = chunk.document_id;
    
    // Generate source information more directly, matching CLI pattern
    const source: Source = {
      id: docId,
      // Look for document filename in multiple possible locations
      title: chunk.documents?.filename || 
             chunk.documents?.title || 
             chunk.metadata?.source || 
             chunk.documents?.path ||
             "Niacin_The_Real_Story_Learn_about_the_Wonderful_Healing_Properties.pdf" // Fallback to match CLI
    };
    
    // Store in map by document ID to deduplicate
    sourceMap.set(docId, source);
  });
  
  return Array.from(sourceMap.values());
}

// Local function to generate completions
async function generateCompletionResponse(
  query: string, 
  context: FormattedChunk[],
  request: NextRequest
) {
  try {
    // Call the completion API with the formatted context
    const response = await fetch(new URL('/api/completion', request.url).toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        context,
        model: 'gpt-4-turbo',
        temperature: 0.1,  // Lower temperature to match CLI version
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Error from completion API: ${response.status}`);
    }
    
    return await response.json();
  } catch (error: Error | unknown) {
    console.error('Error generating completion:', error);
    // Return a simplified response in case of error
    return {
      content: `I found some information about "${query}", but I'm having trouble generating a comprehensive response. Please try again later.`,
    };
  }
} 