'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Search, AlertCircle, BookOpen, BookText, User, Loader2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SearchResultsProps {
  query: string;
  onStartConversation?: (response?: string) => void;
}

interface ResultSource {
  id: string;
  title: string;
  author?: string;
  filepath?: string;
  created_at?: string;
}

interface RawChunk {
  text: string;
  score?: number;
  metadata: {
    title?: string;
    author?: string;
    source?: string;
    document_id?: string;
    created_at?: string;
  };
}

interface SearchResponse {
  status: string;
  message: string;
  raw_results: {
    chunks: RawChunk[];
    sources: ResultSource[];
    query: string;
  };
  content?: string;
}

interface SearchResult {
  content: string;
  sources: ResultSource[];
  isStreaming?: boolean;
}

export function SearchResults({ query, onStartConversation }: SearchResultsProps) {
  const [result, setResult] = useState<SearchResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCompletionLoading, setIsCompletionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [streamedContent, setStreamedContent] = useState<string>('');
  const abortControllerRef = useRef<AbortController | null>(null);

  // Fetch search results and handle streaming completion
  useEffect(() => {
    const fetchResults = async () => {
      try {
        setIsLoading(true);
        setError(null);
        setStreamedContent('');
        
        // Abort any ongoing streams
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
        
        // Get search results first
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          throw new Error(
            errorData?.error || `Error: ${response.status} - ${response.statusText}`
          );
        }
        
        const data = await response.json() as SearchResponse;
        console.log('Search results:', data);
        
        if (data.status === 'search_complete') {
          // Create initial result with placeholder content
          setResult({
            content: 'Generating answer based on search results...',
            sources: data.raw_results.sources,
            isStreaming: true
          });
          setIsLoading(false);
          
          // Start streaming completion
          await startCompletionStream(data.raw_results.chunks, query);
        } else {
          // Legacy response format - use as-is
          setResult({
            content: data.content || 'No content found',
            sources: data.raw_results?.sources || []
          });
          setIsLoading(false);
        }
      } catch (err: Error | unknown) {
        console.error('Failed to fetch search results:', err);
        const errorMessage = err instanceof Error ? err.message : 'An error occurred while fetching results';
        setError(errorMessage);
        setIsLoading(false);
      }
    };

    const startCompletionStream = async (chunks: RawChunk[], searchQuery: string) => {
      try {
        setIsCompletionLoading(true);
        
        // Create a new AbortController for this stream
        abortControllerRef.current = new AbortController();
        const { signal } = abortControllerRef.current;
        
        // Start the streaming request
        const streamResponse = await fetch('/api/completion-stream', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: searchQuery,
            context: chunks,
            temperature: 0.1,
          }),
          signal
        });
        
        if (!streamResponse.ok) {
          throw new Error(`Stream error: ${streamResponse.status}`);
        }
        
        // Process the stream
        const reader = streamResponse.body?.getReader();
        if (!reader) throw new Error('Failed to get stream reader');
        
        const decoder = new TextDecoder();
        let accumulatedContent = '';
        
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) {
            console.log('Stream complete');
            break;
          }
          
          // Process the chunk
          const chunk = decoder.decode(value);
          const lines = chunk.split('\n').filter(line => line.trim());
          
          for (const line of lines) {
            try {
              const parsedChunk = JSON.parse(line);
              
              if (parsedChunk.type === 'chunk') {
                // Use the fullContent if available for more accurate rendering
                if (parsedChunk.fullContent) {
                  accumulatedContent = parsedChunk.fullContent;
                } else {
                  accumulatedContent += parsedChunk.content;
                }
                
                setStreamedContent(accumulatedContent);
                
                // Update the result with streamed content
                setResult(prev => prev ? {
                  ...prev,
                  content: accumulatedContent,
                  isStreaming: true
                } : null);
              } else if (parsedChunk.type === 'done') {
                // Final content - use the complete content from the server
                const finalContent = parsedChunk.content || accumulatedContent;
                
                setResult(prev => prev ? {
                  ...prev,
                  content: finalContent,
                  isStreaming: false
                } : null);
                
                console.log('Streaming completed successfully');
              } else if (parsedChunk.type === 'error') {
                throw new Error(parsedChunk.error || 'Stream processing error');
              }
            } catch (parseError) {
              console.error('Error parsing stream chunk:', parseError, line);
            }
          }
        }
      } catch (streamError: any) {
        if (streamError.name === 'AbortError') {
          console.log('Stream was aborted');
        } else {
          console.error('Streaming error:', streamError);
          setError(`Error generating response: ${streamError.message}`);
        }
      } finally {
        setIsCompletionLoading(false);
      }
    };

    if (query) {
      fetchResults();
    }
    
    // Cleanup function to abort any ongoing streams
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [query]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-8 w-8 rounded-full border-4 border-primary/30 border-t-primary animate-spin"></div>
          <p className="text-muted-foreground">Searching knowledge base...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Card className="border-destructive/30 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <CardTitle className="text-destructive">Error</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p>Failed to load search results: {error}</p>
            <p className="mt-2 text-muted-foreground">Please try again later or refine your search query.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="space-y-6">
        <Card className="shadow-sm border-warning/20">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Search className="h-5 w-5 text-primary" />
              <CardTitle>No Results Found</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p>No results found for your query: &quot;<span className="font-medium">{query}</span>&quot;</p>
            <p className="mt-2 text-muted-foreground">Try using different keywords or check your spelling.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-sm border-border overflow-hidden">
        <CardHeader className="bg-secondary/30 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Search className="h-5 w-5 text-primary" />
                <CardTitle>Results for: &quot;<span className="text-primary font-semibold">{query}</span>&quot;</CardTitle>
              </div>
              {result.sources && result.sources.length > 0 && (
                <CardDescription>
                  Found information in {result.sources.length} source{result.sources.length !== 1 ? 's' : ''}
                </CardDescription>
              )}
            </div>
            <Button size="sm" variant="outline" className="gap-1.5">
              <ExternalLink className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Save</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="prose prose-neutral dark:prose-invert max-w-none prose-headings:text-foreground prose-a:text-primary">
            <div className="whitespace-pre-line leading-7 relative">
              {result.content}
              
              {/* Show a blinking cursor while streaming */}
              {result.isStreaming && (
                <span className="ml-1 inline-block h-4 w-0.5 animate-blink bg-current align-[-0.1em]"></span>
              )}
              
              {/* Show loading indicator if completion is still loading but not streaming yet */}
              {isCompletionLoading && !streamedContent && (
                <div className="flex items-center gap-2 mt-4 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Generating answer...</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
        
        {result.sources && result.sources.length > 0 && (
          <CardFooter className="flex flex-col border-t px-6 py-5 bg-secondary/10">
            <div className="w-full">
              <h3 className="text-base font-semibold mb-3 flex items-center gap-1.5">
                <BookOpen className="h-4 w-4 text-primary" />
                <span>Sources</span>
              </h3>
              <div className="grid gap-3">
                {result.sources.map((source) => (
                  <div 
                    key={source.id} 
                    className="p-3 rounded bg-card border border-border/50 hover:shadow-sm transition-shadow"
                  >
                    <div className="flex items-start gap-2">
                      <BookText className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <h4 className="font-medium">{source.title || 'Unknown Document'}</h4>
                        {source.author && (
                          <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
                            <User className="h-3.5 w-3.5" />
                            <span>{source.author}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardFooter>
        )}
      </Card>
    </div>
  );
} 