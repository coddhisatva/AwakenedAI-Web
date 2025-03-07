'use client';

import Link from 'next/link';
import { Github, Mail, Heart } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-border bg-secondary/40 py-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {/* Column 1 - Logo and Tagline */}
          <div className="flex flex-col space-y-4">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">Awakened AI</span>
            </Link>
            <p className="text-sm text-muted-foreground max-w-xs">
              A comprehensive AI knowledge system built on thousands of curated books spanning mysticism, spirituality, and more.
            </p>
          </div>
          
          {/* Column 2 - Quick Links */}
          <div className="flex flex-col space-y-4">
            <h3 className="text-sm font-semibold tracking-wider">Explore</h3>
            <div className="flex flex-col space-y-2">
              <Link href="/search" className="text-sm hover:text-primary transition-colors">
                Search Library
              </Link>
              <Link href="/about" className="text-sm hover:text-primary transition-colors">
                About the Project
              </Link>
              <Link href="/privacy" className="text-sm hover:text-primary transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-sm hover:text-primary transition-colors">
                Terms of Service
              </Link>
            </div>
          </div>
          
          {/* Column 3 - Connect */}
          <div className="flex flex-col space-y-4">
            <h3 className="text-sm font-semibold tracking-wider">Connect</h3>
            <div className="flex flex-col space-y-2">
              <a 
                href="mailto:contact@awakenedai.com" 
                className="flex items-center gap-2 text-sm hover:text-primary transition-colors"
              >
                <Mail size={16} />
                <span>Contact Us</span>
              </a>
              <a
                href="https://github.com/awakenedai"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm hover:text-primary transition-colors"
              >
                <Github size={16} />
                <span>GitHub</span>
              </a>
            </div>
          </div>
        </div>
        
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