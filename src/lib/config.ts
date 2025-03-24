/**
 * Configuration settings for the RAG system
 * Central place to adjust parameters that affect system performance and results
 */

export const ragConfig = {
  /**
   * Maximum number of chunks to retrieve from vector search
   * Lower values = faster responses, potentially less comprehensive
   * Higher values = more comprehensive responses, slower processing
   * Recommended range: 3-5
   */
  maxChunks: 3,
  
  /**
   * Temperature for LLM responses
   * Lower values = more deterministic/factual responses
   * Higher values = more creative/varied responses
   */
  temperature: 0.1,
  
  /**
   * Whether to include document metadata in the context
   */
  includeMetadata: true,
  
  // Hybrid search configuration
  hybridSearch: {
    // Number of candidates to retrieve in text search phase
    candidatePoolSize: 200
  }
}; 