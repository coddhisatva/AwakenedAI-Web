import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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

async function fetchSearchResults(query: string): Promise<SearchResult> {
  const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch search results');
  }
  
  return response.json();
}

export async function SearchResults({ query }: SearchResultsProps) {
  const result = await fetchSearchResults(query);
  
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