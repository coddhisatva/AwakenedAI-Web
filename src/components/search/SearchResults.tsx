'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useState, useEffect } from 'react';

interface SearchResultsProps {
  query: string;
}

interface ResultSource {
  title: string;
  author?: string;
  id: string;
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
          throw new Error(`Error: ${response.status}`);
        }
        
        const data = await response.json();
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
        <p>Loading results...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Card>
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

  if (!result) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>No Results</CardTitle>
          </CardHeader>
          <CardContent>
            <p>No results found for your query.</p>
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
        </CardHeader>
        <CardContent>
          <div className="prose prose-neutral dark:prose-invert max-w-none">
            <div className="whitespace-pre-line">{result.content}</div>
            
            {result.sources.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold">Sources</h3>
                <ul className="mt-2 space-y-1">
                  {result.sources.map((source) => (
                    <li key={source.id}>
                      <span className="font-medium">{source.title}</span>
                      {source.author && <span> by {source.author}</span>}
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