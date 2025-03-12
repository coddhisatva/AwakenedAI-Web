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
    <div className="flex flex-col h-full w-full">
      <div className="p-4 border-b border-border bg-background/50 backdrop-blur-sm">
        <div className="mx-auto flex items-center gap-2">
          <Search className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-semibold tracking-tight">Knowledge Search</h1>
        </div>
      </div>

      {/* Use the UnifiedSearch component with initialQuery */}
      <UnifiedSearch initialQuery={query} />
    </div>
  );
} 