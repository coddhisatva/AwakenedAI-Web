import { UnifiedSearch } from '@/components/search/UnifiedSearch';
import { Search } from 'lucide-react';

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

        {/* Use the UnifiedSearch component with initialQuery */}
        <UnifiedSearch initialQuery={query} />
      </div>
    </div>
  );
} 