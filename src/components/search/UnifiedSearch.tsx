'use client';

import { useState } from 'react';
import { 
  Card, 
  CardContent
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Search,
  SlidersHorizontal
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from '@/components/ui/sheet';
import { SearchResults } from './SearchResults';
import { BookOpen } from 'lucide-react';

export function UnifiedSearch({ initialQuery = '' }: { initialQuery?: string }) {
  // Search form state
  const [query, setQuery] = useState(initialQuery);
  const [submittedQuery, setSubmittedQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Handle search form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    setIsLoading(true);
    try {
      setSubmittedQuery(query.trim());
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="flex flex-col space-y-8">
      {/* Search Form */}
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
                      {/* Filters content - simplified for now */}
                      <div className="space-y-4">
                        <h3 className="text-sm font-medium flex items-center gap-2">
                          <BookOpen className="h-4 w-4 text-primary" />
                          <span>Book Categories</span>
                        </h3>
                      </div>
                    </div>
                    <SheetFooter>
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
      
      {/* Use the existing SearchResults component that we know works */}
      {submittedQuery ? (
        <SearchResults query={submittedQuery} />
      ) : (
        // Initial state - show a prompt to search
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
  );
} 