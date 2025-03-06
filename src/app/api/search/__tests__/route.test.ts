import { GET } from '../route';
import { searchVectors } from '@/lib/supabase';
import { generateResponse } from '@/lib/openai';
import { NextRequest } from 'next/server';

// Mock dependencies
jest.mock('@/lib/supabase', () => ({
  searchVectors: jest.fn(),
}));
jest.mock('@/lib/openai', () => ({
  generateResponse: jest.fn(),
}));

describe('Search API Route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 400 when query parameter is missing', async () => {
    const request = new NextRequest('http://localhost:3000/api/search');
    const response = await GET(request);
    
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe('Query parameter is required');
  });

  it('returns search results when query is provided', async () => {
    // Mock the vector search results
    const mockChunks = [
      { 
        id: 'chunk1', 
        content: 'Test content 1', 
        documents: { 
          title: 'Test Document 1', 
          author: 'Test Author 1' 
        } 
      },
      { 
        id: 'chunk2', 
        content: 'Test content 2', 
        documents: { 
          title: 'Test Document 2' 
        } 
      }
    ];
    
    const mockResponse = 'This is a synthesized response from the LLM';
    
    // Set up the mocks
    (searchVectors as jest.Mock).mockResolvedValue(mockChunks);
    (generateResponse as jest.Mock).mockResolvedValue(mockResponse);
    
    // Create a request with a query
    const request = new NextRequest('http://localhost:3000/api/search?q=test+query');
    const response = await GET(request);
    
    expect(response.status).toBe(200);
    const data = await response.json();
    
    // Verify the response
    expect(data.content).toBe(mockResponse);
    expect(data.sources).toHaveLength(2);
    expect(data.sources[0].title).toBe('Test Document 1');
    expect(data.sources[1].title).toBe('Test Document 2');
    
    // Verify the mocks were called correctly
    expect(searchVectors).toHaveBeenCalledWith('test query', 5, {});
    expect(generateResponse).toHaveBeenCalledWith(
      'test query', 
      ['Test content 1', 'Test content 2']
    );
  });

  it('handles the case when no chunks are found', async () => {
    // Mock empty search results
    (searchVectors as jest.Mock).mockResolvedValue([]);
    
    // Create a request with a query
    const request = new NextRequest('http://localhost:3000/api/search?q=nonexistent');
    const response = await GET(request);
    
    expect(response.status).toBe(200);
    const data = await response.json();
    
    // Verify the response
    expect(data.content).toBe("I couldn't find any information related to your query.");
    expect(data.sources).toEqual([]);
    
    // Verify the mock was called
    expect(searchVectors).toHaveBeenCalledWith('nonexistent', 5, {});
    expect(generateResponse).not.toHaveBeenCalled();
  });

  it('returns 500 when an error occurs', async () => {
    // Mock an error in searchVectors
    (searchVectors as jest.Mock).mockRejectedValue(new Error('Database error'));
    
    // Create a request with a query
    const request = new NextRequest('http://localhost:3000/api/search?q=error');
    const response = await GET(request);
    
    expect(response.status).toBe(500);
    const data = await response.json();
    
    // Verify the response
    expect(data.error).toBe('Failed to process search query');
  });
}); 