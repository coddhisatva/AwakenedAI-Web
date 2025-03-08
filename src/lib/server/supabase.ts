import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

// Initialize the OpenAI client for embeddings
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Create a Supabase client for server-side operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseKey, {
  db: {
    schema: 'public',
  },
});

// Define proper interfaces for better type safety
interface ChunkResult {
  id: string;
  content?: string;
  text?: string;
  document_id: string;
  similarity: number;
  metadata?: Record<string, unknown>;
}

interface DocumentResult {
  id: string;
  title?: string;
  author?: string;
  creator?: string;
  subject?: string;
  filename?: string;
  path?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Generate embedding using OpenAI
 */
async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await openai.embeddings.create({
      model: "text-embedding-ada-002",
      input: text,
      encoding_format: "float",
    });

    return response.data[0].embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw error;
  }
}

/**
 * Search for vectors in the database based on similarity to the query
 * Matches CLI implementation closely
 */
export async function searchVectors(
  query: string,
  limit: number = 5,
  filters: Record<string, string> = {}
) {
  try {
    console.log(`Generating embedding for query: "${query}"`);
    const embedding = await generateEmbedding(query);
    
    // Log filters for debugging even if not used yet
    if (Object.keys(filters).length > 0) {
      console.log('Filters provided but not yet implemented:', filters);
    }
    
    console.log('Embedding generated, searching database...');
    
    // Use the match_chunks RPC function with specific parameters to match CLI
    // The CLI uses specific threshold parameters
    const { data, error } = await supabase.rpc('match_chunks', {
      query_embedding: embedding,
      match_count: limit
    });
    
    if (error) {
      console.error('Error performing vector search:', error);
      throw new Error(`Failed to perform search: ${error.message}`);
    }
    
    console.log(`Search returned ${data?.length || 0} results`);
    
    // Log raw chunk data to verify content retrieval
    if (data && data.length > 0) {
      console.log('First raw chunk data:', {
        id: data[0].id,
        document_id: data[0].document_id,
        content_preview: data[0].content ? data[0].content.substring(0, 100) + '...' : 'No content found!',
        similarity: data[0].similarity
      });
    }
    
    // If we have results but need document info, fetch the related documents
    // This follows the CLI pattern of joining document metadata
    if (data && data.length > 0) {
      // Extract unique document IDs from the results
      const documentIds = [...new Set(data.map((chunk: ChunkResult) => chunk.document_id))];
      
      console.log(`Fetching metadata for ${documentIds.length} documents`);
      
      // Fetch the related documents with all relevant fields
      // This matches the fields the CLI retrieves
      const { data: documents, error: docError } = await supabase
        .from('documents')
        .select('id, title, author, creator, subject, filename, path, metadata')
        .in('id', documentIds);
      
      if (docError) {
        console.error('Error fetching documents:', docError);
      } else if (documents) {
        console.log(`Retrieved ${documents.length} document records`);
        
        // Create a map for faster document lookups (CLI uses a similar approach)
        const documentMap = documents.reduce((map: Record<string, DocumentResult>, doc: DocumentResult) => {
          map[doc.id] = doc;
          return map;
        }, {});
        
        // Process chunks with document metadata like the CLI does
        return data.map((chunk: ChunkResult) => {
          const document = documentMap[chunk.document_id] || null;
          
          // Return a structure that matches the CLI's format
          return {
            // Basic chunk data
            id: chunk.id,
            document_id: chunk.document_id,
            text: chunk.content || '', // Standardize on text field but preserve content
            content: chunk.content || '', // Keep original content field
            similarity: chunk.similarity,
            
            // Include full document record
            documents: document,
            
            // Extract key metadata fields for easier access (matches CLI pattern)
            metadata: {
              title: document?.title || 'Unknown Document',
              author: document?.author || document?.creator || '',
              subject: document?.subject || '',
              source: document?.filename || document?.path || '',
              document_id: chunk.document_id
            }
          };
        });
      }
    }
    
    // If no document join was performed, still format the base results
    return data.map((chunk: any) => ({
      id: chunk.id,
      document_id: chunk.document_id,
      text: chunk.content || '', // Standardize on text for consistency
      content: chunk.content || '',
      similarity: chunk.similarity,
      metadata: {
        title: 'Unknown Document',
        document_id: chunk.document_id
      }
    })) || [];
  } catch (error) {
    console.error('Error in searchVectors:', error);
    throw error;
  }
} 