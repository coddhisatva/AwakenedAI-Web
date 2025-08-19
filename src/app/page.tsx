import Link from 'next/link';
import { UnifiedSearch } from '@/components/search/UnifiedSearch';

export default function Home() {
  return (
    <div className="flex flex-col pb-12">
      {/* Hero Section */}
      <section className="relative pt-12 md:pt-24 pb-8 overflow-hidden">
        {/* Background Gradient Elements */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute top-1/4 right-1/4 -z-10 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute bottom-1/3 left-1/3 -z-10 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
        </div>

        <div className="container px-4 mx-auto">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
              Unlock the Wisdom of <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">Thousands of Books</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed mt-6">
              A comprehensive AI knowledge system built on thousands of curated books spanning 
              mysticism, spirituality, history, psychology, alternative health, philosophy, and more.
            </p>
          </div>
        </div>
      </section>
      
      {/* Search Section - Full Width */}
      <section className="w-full px-0 sm:px-2 md:px-4 -mt-4">
        <div className="relative">
          <UnifiedSearch embedded={true} />
        </div>
      </section>
    </div>
  );
}
