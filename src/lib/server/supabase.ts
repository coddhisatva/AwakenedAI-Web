import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import { ragConfig } from '@/lib/config';

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
  filepath?: string;
  created_at?: string;
}

/**
 * Generate embedding using OpenAI
 */
async function generateEmbedding(text: string): Promise<number[]> {
  try {
    console.log('START embedding generation with text length:', text.length);
    const startTime = Date.now();
    
    // Use the existing openai client instance instead of creating a new one
    console.time('openai-api-request');
    const response = await openai.embeddings.create({
      model: "text-embedding-ada-002",
      input: text,
      encoding_format: "float",
    });
    console.timeEnd('openai-api-request');
    
    const totalTime = Date.now() - startTime;
    console.log(`TOTAL embedding generation time: ${totalTime}ms`);
    
    return response.data[0].embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw error;
  }
}

/**
 * Search for vectors in the database based on similarity to the query
 * Using hybrid search: text search first, then vector search on candidates
 */
export async function searchVectors(
  query: string,
  limit: number = 5,
  filters: Record<string, string> = {}
) {
  console.time('supabase-search-total');
  try {
    // Step 1: Perform text search to get initial candidates
    console.log(`Performing text search for query: "${query}"`);
    const { data: textResults, error: textError } = await supabase
      .from('chunks')
      .select('id')
      .textSearch('content', query, {
        config: 'english',
        type: 'websearch'
      })
      .limit(ragConfig.hybridSearch.candidatePoolSize);
    
    if (textError) {
      console.error('Error performing text search:', textError);
      // Fall back to regular vector search if text search fails
      console.log('Falling back to vector-only search');
      return vectorOnlySearch(query, limit, filters);
    }
    
    const candidateIds = textResults?.map(r => r.id) || [];
    
    if (candidateIds.length === 0) {
      console.log('No text search results found, falling back to vector-only search');
      return vectorOnlySearch(query, limit, filters);
    }
    
    console.log(`Text search found ${candidateIds.length} candidates`);
    
    // Step 2: Generate embedding for the query
    const embedding = await generateEmbedding(query);
    
    // Step 3: Get all results from vector search (we'll filter them later)
    const { data, error } = await supabase.rpc('match_chunks', {
      query_embedding: embedding,
      match_count: 50 // Get more than we need to ensure we have enough after filtering
    });
    
    if (error) {
      console.error('Error performing vector search:', error);
      throw new Error(`Failed to perform search: ${error.message}`);
    }
    
    // Step 4: Filter to only include candidates from text search and take top 'limit' results
    const candidateSet = new Set(candidateIds);
    const filteredResults = data
      .filter((chunk: ChunkResult) => candidateSet.has(chunk.id))
      .slice(0, limit);
    
    console.log(`Hybrid search returning ${filteredResults.length} results`);
    
    if (filteredResults.length === 0) {
      console.log('No overlapping results between text and vector search, falling back to vector-only');
      return vectorOnlySearch(query, limit, filters);
    }
    
    // Fetch document metadata for results, just like in vector-only search
    if (filteredResults.length > 0) {
      // Extract unique document IDs from the results
      const documentIds = [...new Set(filteredResults.map((chunk: ChunkResult) => chunk.document_id))];
      
      console.log(`Fetching metadata for ${documentIds.length} documents`);
      
      // Fetch the related documents with all relevant fields
      const { data: documents, error: docError } = await supabase
        .from('documents')
        .select('id, title, author, filepath, created_at')
        .in('id', documentIds);
      
      if (docError) {
        console.error('Error fetching documents:', docError);
      } else if (documents) {
        console.log(`Retrieved ${documents.length} document records`);
        
        // Create a map for faster document lookups
        const documentMap = documents.reduce((map: Record<string, DocumentResult>, doc: DocumentResult) => {
          map[doc.id] = doc;
          return map;
        }, {});
        
        // Process chunks with document metadata
        const result = filteredResults.map((chunk: ChunkResult) => {
          const document = documentMap[chunk.document_id] || null;
          
          return {
            // Basic chunk data
            id: chunk.id,
            document_id: chunk.document_id,
            text: chunk.content || '',
            content: chunk.content || '',
            similarity: chunk.similarity,
            
            // Include full document record
            documents: document,
            
            // Extract key metadata fields for easier access
            metadata: {
              title: document?.title || 'Unknown Document',
              author: document?.author || '',
              source: document?.filepath || '',
              document_id: chunk.document_id,
              created_at: document?.created_at || ''
            }
          };
        });
        
        console.timeEnd('supabase-search-total');
        return result;
      }
    }
    
    // If no document join was performed, still format the base results
    console.timeEnd('supabase-search-total');
    return filteredResults.map((chunk: any) => ({
      id: chunk.id,
      document_id: chunk.document_id,
      text: chunk.content || '',
      content: chunk.content || '',
      similarity: chunk.similarity,
      metadata: {
        title: 'Unknown Document',
        document_id: chunk.document_id
      }
    }));
  } catch (error) {
    console.timeEnd('supabase-search-total');
    console.error('Error in searchVectors:', error);
    throw error;
  }
}

/**
 * Original vector-only search as fallback
 */
async function vectorOnlySearch(
  query: string,
  limit: number = 5,
  filters: Record<string, string> = {}
) {
  try {
    console.log('Performing vector-only search');
    console.time('vector-only-search');
    
    // Generate embedding
    const embedding = await generateEmbedding(query);
    
    // Log filters for debugging even if not used yet
    if (Object.keys(filters).length > 0) {
      console.log('Filters provided but not yet implemented:', filters);
    }
    
    console.log('Embedding generated, searching database...');
    
    // Use the match_chunks RPC function with specific parameters
    const { data, error } = await supabase.rpc('match_chunks', {
      query_embedding: embedding,
      match_count: limit
    });
    
    if (error) {
      console.error('Error performing vector search:', error);
      throw new Error(`Failed to perform search: ${error.message}`);
    }
    
    console.log(`Vector-only search returned ${data?.length || 0} results`);
    
    // If we have results but need document info, fetch the related documents
    if (data && data.length > 0) {
      // Extract unique document IDs from the results
      const documentIds = [...new Set(data.map((chunk: ChunkResult) => chunk.document_id))];
      
      console.log(`Fetching metadata for ${documentIds.length} documents`);
      
      // Fetch the related documents with all relevant fields
      const { data: documents, error: docError } = await supabase
        .from('documents')
        .select('id, title, author, filepath, created_at')
        .in('id', documentIds);
      
      if (docError) {
        console.error('Error fetching documents:', docError);
      } else if (documents) {
        console.log(`Retrieved ${documents.length} document records`);
        
        // Create a map for faster document lookups
        const documentMap = documents.reduce((map: Record<string, DocumentResult>, doc: DocumentResult) => {
          map[doc.id] = doc;
          return map;
        }, {});
        
        // Process chunks with document metadata
        const result = data.map((chunk: ChunkResult) => {
          const document = documentMap[chunk.document_id] || null;
          
          return {
            // Basic chunk data
            id: chunk.id,
            document_id: chunk.document_id,
            text: chunk.content || '',
            content: chunk.content || '',
            similarity: chunk.similarity,
            
            // Include full document record
            documents: document,
            
            // Extract key metadata fields for easier access
            metadata: {
              title: document?.title || 'Unknown Document',
              author: document?.author || '',
              source: document?.filepath || '',
              document_id: chunk.document_id,
              created_at: document?.created_at || ''
            }
          };
        });
        console.timeEnd('vector-only-search');
        return result;
      }
    }
    
    // If no document join was performed, still format the base results
    console.timeEnd('vector-only-search');
    return data.map((chunk: any) => ({
      id: chunk.id,
      document_id: chunk.document_id,
      text: chunk.content || '',
      content: chunk.content || '',
      similarity: chunk.similarity,
      metadata: {
        title: 'Unknown Document',
        document_id: chunk.document_id
      }
    })) || [];
  } catch (error) {
    console.error('Error in vectorOnlySearch:', error);
    throw error;
  }
} 