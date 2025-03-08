'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from '@/components/ui/sheet';
import { Search, SlidersHorizontal, Book, Calendar, Tag, RotateCw } from 'lucide-react';

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
    <Card className="border-border shadow-sm overflow-hidden bg-card">
      <CardContent className="p-4">
        <form onSubmit={handleSubmit} className="flex flex-col space-y-4" role="form">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="What would you like to know?"
                className="pl-9 pr-4 border-border focus-visible:ring-primary"
              />
            </div>
            <div className="flex gap-2">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" type="button" className="flex items-center gap-1.5 border-border">
                    <SlidersHorizontal className="h-4 w-4" />
                    <span className="hidden sm:inline">Filters</span>
                  </Button>
                </SheetTrigger>
                <SheetContent className="sm:max-w-md">
                  <SheetHeader>
                    <SheetTitle>Search Filters</SheetTitle>
                    <SheetDescription>
                      Refine your search with specific filters to find exactly what you&apos;re looking for.
                    </SheetDescription>
                  </SheetHeader>
                  <div className="py-6 space-y-6">
                    <div className="space-y-4">
                      <h3 className="text-sm font-medium flex items-center gap-2">
                        <Book className="h-4 w-4 text-primary" />
                        <span>Book Categories</span>
                      </h3>
                      <div className="grid grid-cols-2 gap-2">
                        {['Philosophy', 'Spirituality', 'Psychology', 'Mysticism', 'Health', 'History'].map((category) => (
                          <div key={category} className="flex items-center gap-2">
                            <input type="checkbox" id={category} className="rounded text-primary focus:ring-primary/25" />
                            <label htmlFor={category} className="text-sm">{category}</label>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <h3 className="text-sm font-medium flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-primary" />
                        <span>Time Period</span>
                      </h3>
                      <div className="grid grid-cols-2 gap-2">
                        {['Ancient', 'Medieval', 'Renaissance', 'Modern', 'Contemporary'].map((period) => (
                          <div key={period} className="flex items-center gap-2">
                            <input type="checkbox" id={period} className="rounded text-primary focus:ring-primary/25" />
                            <label htmlFor={period} className="text-sm">{period}</label>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <h3 className="text-sm font-medium flex items-center gap-2">
                        <Tag className="h-4 w-4 text-primary" />
                        <span>Tags</span>
                      </h3>
                      <Input placeholder="Add tags separated by commas" className="focus-visible:ring-primary" />
                    </div>
                  </div>
                  <SheetFooter>
                    <Button 
                      type="button" 
                      variant="outline" 
                      className="w-full sm:w-auto flex items-center gap-1.5"
                    >
                      <RotateCw className="h-4 w-4" />
                      <span>Reset Filters</span>
                    </Button>
                    <Button 
                      type="button" 
                      className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-white"
                    >
                      Apply Filters
                    </Button>
                  </SheetFooter>
                </SheetContent>
              </Sheet>
              <Button 
                type="submit" 
                disabled={isLoading || !query.trim()} 
                className="bg-primary hover:bg-primary/90 text-white"
              >
                {isLoading ? (
                  <>
                    <span className="mr-2">Searching</span>
                    <span className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
                  </>
                ) : 'Search'}
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
} 