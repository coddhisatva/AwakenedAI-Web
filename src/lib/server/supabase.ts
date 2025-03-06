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

/**
 * Generate embedding using OpenAI
 */
async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
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
  filters: Record<string, any> = {}
) {
  try {
    console.log(`Generating embedding for query: "${query}"`);
    const embedding = await generateEmbedding(query);
    
    console.log('Embedding generated, searching database...');
    
    // Create a query to the chunks table with document join
    // Using a raw query with RPC call like the CLI does
    const { data, error } = await supabase.rpc('match_chunks', {
      query_embedding: embedding,
      match_count: limit
    });
    
    if (error) {
      console.error('Error performing vector search:', error);
      throw new Error(`Failed to perform search: ${error.message}`);
    }
    
    console.log(`Search returned ${data?.length || 0} results`);
    
    // If we have results but need document info, fetch the related documents
    if (data && data.length > 0) {
      // Extract document IDs from the results
      const documentIds = [...new Set(data.map((chunk: any) => chunk.document_id))];
      
      // Fetch the related documents
      const { data: documents, error: docError } = await supabase
        .from('documents')
        .select('id, title, author, creator, subject, filename, path')
        .in('id', documentIds);
      
      if (docError) {
        console.error('Error fetching documents:', docError);
      } else if (documents) {
        // Add document info to each chunk, matching CLI structure
        return data.map((chunk: any) => {
          const document = documents.find(doc => doc.id === chunk.document_id);
          return {
            ...chunk,
            documents: document || null,
            // Ensure content field exists and is properly extracted
            content: chunk.content || chunk.text || '',
          };
        });
      }
    }
    
    return data || [];
  } catch (error) {
    console.error('Error in searchVectors:', error);
    throw error;
  }
} 