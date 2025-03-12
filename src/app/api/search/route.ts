import { NextRequest, NextResponse } from 'next/server';
import { searchVectors } from '@/lib/server/supabase';

// Define proper interfaces for better type safety
interface DocumentMetadata {
  title?: string;
  author?: string;
  source?: string;
  created_at?: string;
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
    filepath?: string;
    created_at?: string;
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
  console.time('total-search-time');
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q');
  
  // Add diagnostic logging
  console.log('API_KEY_EXISTS:', !!process.env.OPENAI_API_KEY);
  console.log('API_KEY_LENGTH:', process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.length : 0);
  console.log('ENV:', process.env.NODE_ENV);
  console.log('MEMORY_USAGE:', JSON.stringify(process.memoryUsage()));
  
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
      if (key !== 'q' && ['author', 'title'].includes(key)) {
        filters[key] = value;
      }
    }

    console.log('Searching for:', query);
    console.time('vector-search-time');
    // Retrieve relevant chunks from vector database with proper error handling
    const chunks = await searchVectors(query, 5, filters);
    console.timeEnd('vector-search-time');
    
    if (!chunks || chunks.length === 0) {
      console.timeEnd('total-search-time');
      console.log('No results found for query:', query);
      return NextResponse.json({
        content: "I couldn't find any information related to your query.",
        sources: []
      });
    }
    
    console.log(`Found ${chunks.length} relevant chunks`);
    
    // Format chunks to consistently use 'text' field and preserve metadata
    console.time('formatting-chunks-time');
    const formattedChunks = chunks.map((chunk: SearchChunk) => ({
      // Always use 'text' for content to match CLI convention
      text: chunk.text || chunk.content || '',
      // Include score for potential ranking
      score: chunk.similarity,
      // Preserve all metadata
      metadata: chunk.metadata || {
        title: chunk.documents?.title || 'Unknown Document',
        author: chunk.documents?.author || '',
        source: chunk.documents?.filepath || '',
        document_id: chunk.document_id,
        created_at: chunk.documents?.created_at
      }
    }));
    console.timeEnd('formatting-chunks-time');
    
    // Extract source information for attribution
    console.time('extract-sources-time');
    const sources = extractSourcesFromChunks(chunks);
    console.timeEnd('extract-sources-time');
    
    // Generate response using the completion API
    console.time('completion-api-time');
    const responseData = await generateCompletionResponse(query, formattedChunks, request);
    console.timeEnd('completion-api-time');
    
    console.timeEnd('total-search-time');
    // Return the generated response with source attribution
    return NextResponse.json({
      content: responseData.content,
      sources: sources,
      query: query
    });
  } catch (error: Error | unknown) {
    console.timeEnd('total-search-time');
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
      // Look for document title or filepath
      title: chunk.documents?.title || 
             chunk.metadata?.source || 
             chunk.documents?.filepath ||
             "Unknown Document"
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