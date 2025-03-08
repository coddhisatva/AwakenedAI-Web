'use client';

import { createClient } from '@supabase/supabase-js';
import { generateEmbedding } from './openai';

// Create a single supabase client for the entire application
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseKey, {
  db: {
    schema: 'public',
  },
});

/**
 * Search for vectors in the database based on similarity to the query
 * This matches the structure from the processing repo
 */
export async function searchVectors(
  query: string,
  limit: number = 5,
  filters: Record<string, string> = {}
) {
  try {
    console.log(`Generating embedding for query: "${query}"`);
    const queryEmbedding = await getEmbedding(query);
    
    // Create a query to the chunks table with document join
    let vectorQuery = supabase
      .from('chunks')
      .select(`
        id,
        content,
        metadata,
        documents (
          id,
          title,
          author,
          creator,
          subject,
          filename,
          path
        )
      `)
      .order('embedding <-> $1', { ascending: true })
      .limit(limit);
    
    // Add any metadata filters if provided
    if (filters && Object.keys(filters).length > 0) {
      console.log('Applying filters:', filters);
      Object.entries(filters).forEach(([key, value]) => {
        if (key.startsWith('document.')) {
          // For document fields, filter on the related table
          const docField = key.replace('document.', '');
          vectorQuery = vectorQuery.eq(`documents.${docField}`, value);
        } else {
          // For chunk metadata fields
          vectorQuery = vectorQuery.eq(`metadata->>${key}`, value);
        }
      });
    }
    
    const { data, error } = await vectorQuery;
    
    if (error) {
      console.error('Error performing vector search:', error);
      throw new Error(`Failed to perform search: ${error.message}`);
    }
    
    console.log(`Search returned ${data?.length || 0} results`);
    return data || [];
  } catch (error) {
    console.error('Error in searchVectors:', error);
    throw error;
  }
}

/**
 * Get embedding for text using OpenAI API
 */
async function getEmbedding(text: string) {
  try {
    return await generateEmbedding(text);
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw error;
  }
} 