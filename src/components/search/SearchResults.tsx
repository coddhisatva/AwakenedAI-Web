'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

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
      } catch (err: any) {
        console.error('Failed to fetch search results:', err);
        setError(err.message || 'An error occurred while fetching results');
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
      <div className="flex justify-center py-8">
        <div className="animate-pulse">
          <p>Searching knowledge base...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-500">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Failed to load search results: {error}</p>
            <p className="mt-2">Please try again later.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!result || !result.content) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>No Results</CardTitle>
          </CardHeader>
          <CardContent>
            <p>No results found for your query: "{query}"</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Results for: {query}</CardTitle>
          {result.sources.length > 0 && (
            <CardDescription>
              Found information in {result.sources.length} source{result.sources.length !== 1 ? 's' : ''}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <div className="prose prose-neutral dark:prose-invert max-w-none">
            <div className="whitespace-pre-line">{result.content}</div>
            
            {result.sources.length > 0 && (
              <div className="mt-6 border-t pt-4">
                <h3 className="text-lg font-semibold mb-2">Sources</h3>
                <ul className="space-y-2">
                  {result.sources.map((source) => (
                    <li key={source.id} className="p-2 rounded bg-muted/50">
                      <div className="font-medium">{source.title || 'Unknown Document'}</div>
                      {source.author && <div className="text-sm">by {source.author}</div>}
                      {source.subject && <div className="text-sm text-muted-foreground">Subject: {source.subject}</div>}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 