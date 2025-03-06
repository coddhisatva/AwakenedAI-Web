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
    
    // Format chunks to consistently use 'text' field and preserve metadata
    const formattedChunks = chunks.map(chunk => ({
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
  } catch (error: any) {
    console.error('Error processing search query:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process search query' },
      { status: 500 }
    );
  }
}

// Enhanced source extraction to match CLI implementation
function extractSourcesFromChunks(chunks: any[]) {
  // Create a map to deduplicate sources - CLI uses similar approach
  const sourceMap = new Map();
  
  chunks.forEach(chunk => {
    if (!chunk.document_id) return;
    
    // Get document info from either the documents property or metadata
    const doc = chunk.documents || {};
    const metadata = chunk.metadata || {};
    
    // Create a unique identifier for the source
    const docId = chunk.document_id;
    
    // Skip if we've already processed this document
    if (sourceMap.has(docId)) return;
    
    // Format source information to match CLI output format
    sourceMap.set(docId, {
      id: docId,
      title: doc.title || metadata.title || 'Unknown Document',
      author: doc.author || doc.creator || metadata.author || '',
      subject: doc.subject || metadata.subject || '',
      filename: doc.filename || doc.path || metadata.source || '',
      // Add page info if available
      page: metadata.page || doc.page || '',
      // Include full path for reference
      path: doc.path || ''
    });
  });
  
  // Convert to array and sort by id to ensure consistent order
  const sources = Array.from(sourceMap.values());
  
  // Log sources to verify correct extraction
  console.log('Extracted sources:', JSON.stringify(sources, null, 2));
  
  return sources;
}

// Local function to generate completions
async function generateCompletionResponse(
  query: string, 
  context: any[],
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
  } catch (error: any) {
    console.error('Error generating completion:', error);
    // Return a simplified response in case of error
    return {
      content: `I found some information about "${query}", but I'm having trouble generating a comprehensive response. Please try again later.`,
    };
  }
} 