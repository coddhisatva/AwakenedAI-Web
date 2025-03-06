import { createClient } from '@supabase/supabase-js';
import { generateEmbedding } from './openai';

// Create a single supabase client for the entire application
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseKey);

// Helper function for vector search
export async function searchVectors(
  query: string,
  limit: number = 5,
  metadata?: Record<string, any>
) {
  const embedding = await getEmbedding(query);
  
  let vectorQuery = supabase
    .from('chunks')
    .select('*, documents(*)')
    .order('embedding <-> $1', { ascending: true })
    .limit(limit);
  
  // Add metadata filters if provided
  if (metadata) {
    Object.entries(metadata).forEach(([key, value]) => {
      vectorQuery = vectorQuery.eq(key, value);
    });
  }
  
  const { data, error } = await vectorQuery;
  
  if (error) {
    console.error('Error performing vector search:', error);
    throw new Error('Failed to perform search');
  }
  
  return data;
}

// Helper function to get embedding from OpenAI API
async function getEmbedding(text: string) {
  return await generateEmbedding(text);
} 