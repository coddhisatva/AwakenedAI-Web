import { SearchForm } from '@/components/search/SearchForm';
import { SearchResults } from '@/components/search/SearchResults';
import { Suspense } from 'react';
import { Search, BookOpen } from 'lucide-react';

interface SearchPageProps {
  searchParams: { q?: string };
}

// This makes the component a Server Component
export default function SearchPage({ searchParams }: SearchPageProps) {
  // Access searchParams directly but safely
  const query = searchParams?.q || '';

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <div className="max-w-4xl mx-auto flex flex-col space-y-8">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Search className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight">Knowledge Search</h1>
          </div>
          <p className="text-muted-foreground">
            Search our database of thousands of books to find insights on any topic of interest.
          </p>
        </div>

        {/* Use a Client Component for the form */}
        <SearchForm initialQuery={query} />

        {/* Only render results if we have a query */}
        {query ? (
          <Suspense 
            fallback={
              <div className="flex justify-center py-12">
                <div className="flex flex-col items-center space-y-4">
                  <div className="h-8 w-8 rounded-full border-4 border-primary/30 border-t-primary animate-spin"></div>
                  <p className="text-muted-foreground">Searching knowledge base...</p>
                </div>
              </div>
            }
          >
            <SearchResults query={query} />
          </Suspense>
        ) : (
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
    </div>
  );
} 