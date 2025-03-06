import { Suspense } from 'react';
import { SearchForm } from '@/components/search/SearchForm';
import { SearchResults } from '@/components/search/SearchResults';

interface SearchPageProps {
  searchParams: { q?: string };
}

export default function SearchPage({ searchParams }: SearchPageProps) {
  const query = searchParams.q || '';

  return (
    <div className="flex flex-col space-y-8">
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">Knowledge Search</h1>
        <p className="text-muted-foreground">
          Search our database of thousands of books to find the information you need.
        </p>
      </div>

      <SearchForm initialQuery={query} />

      {query ? (
        <Suspense fallback={<div>Loading results...</div>}>
          <SearchResults query={query} />
        </Suspense>
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Enter a query to search the knowledge base.</p>
        </div>
      )}
    </div>
  );
} 