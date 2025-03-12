'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardFooter 
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Search, 
  AlertCircle, 
  BookOpen, 
  BookText, 
  User, 
  Loader2, 
  ExternalLink,
  SlidersHorizontal
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from '@/components/ui/sheet';

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

export function UnifiedSearch({ initialQuery = '' }: { initialQuery?: string }) {
  // Search form state
  const [query, setQuery] = useState(initialQuery);
  const [submittedQuery, setSubmittedQuery] = useState<string>('');
  
  // Search results state
  const [result, setResult] = useState<SearchResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCompletionLoading, setIsCompletionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [streamedContent, setStreamedContent] = useState<string>('');
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // Handle search form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    // Set the submitted query so we can display it in results
    setSubmittedQuery(query.trim());
    
    // Reset previous results
    setResult(null);
    setStreamedContent('');
    setError(null);
    
    // Start search process
    setIsLoading(true);
    
    try {
      // Abort any ongoing streams
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      // Send the search request
      await fetchResults(query.trim());
    } catch (err) {
      console.error('Search error:', err);
      const errorMessage = err instanceof Error ? err.message : 'An error occurred during search';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Function to fetch search results
  const fetchResults = async (searchQuery: string) => {
    try {
      // Get search results first
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
      
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
        
        // Start streaming completion
        await startCompletionStream(data.raw_results.chunks, searchQuery);
      } else {
        // Legacy response format - use as-is
        setResult({
          content: data.content || 'No content found',
          sources: data.raw_results?.sources || []
        });
      }
    } catch (err) {
      console.error('Failed to fetch search results:', err);
      const errorMessage = err instanceof Error ? err.message : 'An error occurred while fetching results';
      setError(errorMessage);
    }
  };
  
  // Function to start streaming completion
  const startCompletionStream = async (chunks: RawChunk[], searchQuery: string) => {
    try {
      setIsCompletionLoading(true);
      console.log('Starting completion stream for query:', searchQuery);
      console.log('Number of chunks to process:', chunks.length);
      
      // Create a new AbortController for this stream
      abortControllerRef.current = new AbortController();
      const { signal } = abortControllerRef.current;
      
      // Start the streaming request
      console.log('Making request to /api/completion-stream');
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
      
      console.log('Stream response status:', streamResponse.status);
      
      if (!streamResponse.ok) {
        throw new Error(`Stream error: ${streamResponse.status}`);
      }
      
      // Process the stream
      const reader = streamResponse.body?.getReader();
      if (!reader) throw new Error('Failed to get stream reader');
      
      const decoder = new TextDecoder();
      let accumulatedContent = '';
      console.log('Beginning to read stream');
      
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          console.log('Stream complete, done signal received');
          break;
        }
        
        // Process the chunk
        const chunk = decoder.decode(value);
        console.log('Received chunk data:', chunk.length, 'bytes');
        
        const lines = chunk.split('\n').filter(line => line.trim());
        console.log('Split into', lines.length, 'lines');
        
        for (const line of lines) {
          try {
            console.log('Processing line:', line.substring(0, 50) + (line.length > 50 ? '...' : ''));
            const parsedChunk = JSON.parse(line);
            console.log('Parsed chunk type:', parsedChunk.type);
            
            if (parsedChunk.type === 'chunk') {
              // Use the fullContent if available for more accurate rendering
              if (parsedChunk.fullContent) {
                console.log('Using fullContent with length:', parsedChunk.fullContent.length);
                accumulatedContent = parsedChunk.fullContent;
              } else {
                console.log('Appending content with length:', parsedChunk.content?.length);
                accumulatedContent += parsedChunk.content;
              }
              
              setStreamedContent(accumulatedContent);
              console.log('Updated streamedContent, current length:', accumulatedContent.length);
              
              // Update the result with streamed content
              setResult(prev => {
                console.log('Updating result with new content');
                return prev ? {
                  ...prev,
                  content: accumulatedContent,
                  isStreaming: true
                } : null;
              });
            } else if (parsedChunk.type === 'done') {
              // Final content - use the complete content from the server
              const finalContent = parsedChunk.content || accumulatedContent;
              console.log('Received done signal with final content length:', finalContent.length);
              
              setResult(prev => {
                console.log('Setting final result content');
                return prev ? {
                  ...prev,
                  content: finalContent,
                  isStreaming: false
                } : null;
              });
              
              console.log('Streaming completed successfully');
            } else if (parsedChunk.type === 'error') {
              console.error('Stream error message received:', parsedChunk.error);
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
      console.log('Completion streaming process finished');
    }
  };
  
  // Cleanup function to abort any ongoing streams on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);
  
  return (
    <div className="flex flex-col space-y-8">
      {/* Search Form */}
      <Card className="border-border shadow-sm overflow-hidden bg-card">
        <CardContent className="p-4">
          <form onSubmit={handleSubmit} className="flex flex-col space-y-4" role="form">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="What would you like to know?"
                  className="pl-9 pr-4 border-border focus-visible:ring-primary"
                />
              </div>
              <div className="flex gap-2">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" type="button" className="flex items-center gap-1.5 border-border">
                      <SlidersHorizontal className="h-4 w-4" />
                      <span className="hidden sm:inline">Filters</span>
                    </Button>
                  </SheetTrigger>
                  <SheetContent className="sm:max-w-md">
                    <SheetHeader>
                      <SheetTitle>Search Filters</SheetTitle>
                      <SheetDescription>
                        Refine your search with specific filters to find exactly what you&apos;re looking for.
                      </SheetDescription>
                    </SheetHeader>
                    <div className="py-6 space-y-6">
                      {/* Filters content - simplified for now */}
                      <div className="space-y-4">
                        <h3 className="text-sm font-medium flex items-center gap-2">
                          <BookOpen className="h-4 w-4 text-primary" />
                          <span>Book Categories</span>
                        </h3>
                      </div>
                    </div>
                    <SheetFooter>
                      <Button 
                        type="button" 
                        className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-white"
                      >
                        Apply Filters
                      </Button>
                    </SheetFooter>
                  </SheetContent>
                </Sheet>
                <Button 
                  type="submit" 
                  disabled={isLoading || !query.trim()} 
                  className="bg-primary hover:bg-primary/90 text-white"
                >
                  {isLoading ? (
                    <>
                      <span className="mr-2">Searching</span>
                      <span className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
                    </>
                  ) : 'Search'}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
      
      {/* Search Results Section */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="flex flex-col items-center space-y-4">
            <div className="h-8 w-8 rounded-full border-4 border-primary/30 border-t-primary animate-spin"></div>
            <p className="text-muted-foreground">Searching knowledge base...</p>
          </div>
        </div>
      ) : submittedQuery ? (
        // Only show results if a query was submitted
        error ? (
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
        ) : !result ? (
          <div className="space-y-6">
            <Card className="shadow-sm border-warning/20">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Search className="h-5 w-5 text-primary" />
                  <CardTitle>No Results Found</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p>No results found for your query: &quot;<span className="font-medium">{submittedQuery}</span>&quot;</p>
                <p className="mt-2 text-muted-foreground">Try using different keywords or check your spelling.</p>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="space-y-6">
            <Card className="shadow-sm border-border overflow-hidden">
              <CardHeader className="bg-secondary/30 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Search className="h-5 w-5 text-primary" />
                      <CardTitle>Results for: &quot;<span className="text-primary font-semibold">{submittedQuery}</span>&quot;</CardTitle>
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
        )
      ) : (
        // Initial state - show a prompt to search
        <div className="text-center py-16 bg-secondary/20 rounded-lg border border-border/40">
          <div className="flex flex-col items-center space-y-4 max-w-md mx-auto px-4">
            <BookOpen className="h-12 w-12 text-primary/50" />
            <h3 className="text-xl font-medium">Enter a query to begin</h3>
            <p className="text-muted-foreground">
              Ask any question related to spirituality, philosophy, psychology, mysticism, or any other topic covered in our book collection.
            </p>
          </div>
        </div>
      )}
    </div>
  );
} 