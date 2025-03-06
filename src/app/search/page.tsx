import { SearchForm } from '@/components/search/SearchForm';
import { SearchResults } from '@/components/search/SearchResults';
import { Suspense } from 'react';

interface SearchPageProps {
  searchParams: { q?: string };
}

// This makes the component a Server Component
export default function SearchPage({ searchParams }: SearchPageProps) {
  // Access searchParams directly but safely
  const query = searchParams?.q || '';

  return (
    <div className="flex flex-col space-y-8">
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">Knowledge Search</h1>
        <p className="text-muted-foreground">
          Search our database of thousands of books to find the information you need.
        </p>
      </div>

      {/* Use a Client Component for the form */}
      <SearchForm initialQuery={query} />

      {/* Only render results if we have a query */}
      {query ? (
        <Suspense fallback={<div className="flex justify-center py-8">
          <div className="animate-pulse">
            <p>Searching knowledge base...</p>
          </div>
        </div>}>
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