'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Search, AlertCircle, BookOpen, BookText, User, Tag, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SearchResultsProps {
  query: string;
}

interface ResultSource {
  id: string;
  title: string;
  author?: string;
  subject?: string;
  filename?: string;
}

interface SearchResult {
  content: string;
  sources: ResultSource[];
}

export function SearchResults({ query }: SearchResultsProps) {
  const [result, setResult] = useState<SearchResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          throw new Error(
            errorData?.error || `Error: ${response.status} - ${response.statusText}`
          );
        }
        
        const data = await response.json();
        console.log('Search results:', data);
        setResult(data);
      } catch (err: Error | unknown) {
        console.error('Failed to fetch search results:', err);
        const errorMessage = err instanceof Error ? err.message : 'An error occurred while fetching results';
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    if (query) {
      fetchResults();
    }
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

  if (!result || !result.content) {
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
              {result.sources.length > 0 && (
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
            <div className="whitespace-pre-line leading-7">{result.content}</div>
          </div>
        </CardContent>
        
        {result.sources.length > 0 && (
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
                        {source.subject && (
                          <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
                            <Tag className="h-3.5 w-3.5" />
                            <span>{source.subject}</span>
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