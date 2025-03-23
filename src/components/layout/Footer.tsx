'use client';

import { Heart } from 'lucide-react';
import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t border-border bg-secondary/40 py-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-col space-y-4">
          {/* Logo and Tagline */}
          <div className="flex flex-col space-y-4">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">Awakened AI</span>
            </Link>
            <p className="text-sm text-muted-foreground max-w-xs">
              A comprehensive AI knowledge system built on thousands of curated books spanning mysticism, spirituality, and more.
            </p>
          </div>
        </div>
        
        {/* Copyright and Made With Love */}
        <div className="mt-8 pt-6 border-t border-border flex flex-col md:flex-row justify-between items-center">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} Awakened AI. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground flex items-center mt-2 md:mt-0">
            Made with <Heart size={12} className="mx-1 text-primary" /> by the Awakened AI Team
          </p>
        </div>
      </div>
    </footer>
  );
} 