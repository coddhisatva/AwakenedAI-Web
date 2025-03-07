# AwakenedAI-Web Technical Documentation

## Overview
AwakenedAI-Web is a Next.js web application that provides a user interface for querying the AwakenedAI knowledge base. It connects to the same Supabase vector database as the Processing component but focuses on retrieval and presentation rather than document processing.

## System Architecture

### 1. Frontend
- **Framework**: Next.js 14+ with App Router
- **Language**: TypeScript 5+
- **Styling**: Tailwind CSS
- **Components**: Shadcn UI component library
- **State Management**: React's built-in hooks

### 2. Backend
- **API Routes**: Next.js API routes for handling queries
- **Database**: Supabase with pgvector extension
- **LLM Integration**: OpenAI API for response generation

### 3. RAG Implementation
- **Vector Search**: Direct integration with Supabase vectors
- **Retrieval Processing**: Multi-step retrieval with context formatting
- **LLM Interaction**: OpenAI chat completions API with structured prompt templates
- **Source Attribution**: Document metadata tracking and citation

## Key Components

### API Routes
- **`/api/search`**: Handles search queries by:
  - Generating embeddings for user queries
  - Performing vector search in Supabase
  - Retrieving relevant document chunks
  - Passing contexts to the completion API
  - Returning formatted responses with source attribution

- **`/api/completion`**: Generates LLM responses based on:
  - Retrieved context chunks
  - User query
  - Structured prompting for knowledge synthesis

### UI Components
- **SearchForm**: Input interface for user queries
- **SearchResults**: Display of generated responses
- **SourceCitation**: Attribution of information sources

## Data Flow
1. User submits search query through the SearchForm
2. Query is sent to `/api/search` endpoint
3. Search endpoint generates embedding and queries Supabase
4. Retrieved chunks are formatted into context
5. Context and query are sent to `/api/completion`
6. Completion endpoint generates a response using OpenAI
7. Response with source citations is displayed to the user

## Configuration
- **Environment Variables**:
  - `NEXT_PUBLIC_SUPABASE_URL`: Supabase instance URL
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Public Supabase API key
  - `OPENAI_API_KEY`: OpenAI API key for embeddings and completions

## Development Workflow
1. Run development server: `npm run dev`
2. Build for production: `npm run build`
3. Start production server: `npm start`

## Optimization Considerations
- **Response Caching**: Frequent queries could be cached
- **Chunking Limits**: Pagination for large result sets
- **Error Handling**: Robust error recovery for API failures
- **Loading States**: Graceful UI indicators for processing time