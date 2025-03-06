import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

interface SearchFormProps {
  initialQuery: string;
}

export function SearchForm({ initialQuery }: SearchFormProps) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    setIsLoading(true);
    // Update URL with search parameters
    router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    // The page will rerender with new search params
    setIsLoading(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Search</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
          <div className="flex gap-2">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="What would you like to know?"
              className="flex-1"
            />
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" type="button">Filters</Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Search Filters</SheetTitle>
                  <SheetDescription>
                    Refine your search with specific filters
                  </SheetDescription>
                </SheetHeader>
                <div className="py-4 space-y-4">
                  {/* Filter options will go here */}
                  <p className="text-sm text-muted-foreground">
                    Filter options coming soon.
                  </p>
                </div>
              </SheetContent>
            </Sheet>
            <Button type="submit" disabled={isLoading || !query.trim()}>
              {isLoading ? 'Searching...' : 'Search'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
} 