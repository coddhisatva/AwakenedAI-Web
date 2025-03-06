'use client';

import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t py-6 md:py-8">
      <div className="container flex flex-col items-center justify-between gap-4 md:flex-row">
        <div className="flex flex-col items-center gap-4 md:flex-row md:gap-6">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <span className="text-lg font-bold">Awakened AI</span>
          </Link>
          <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
            &copy; {new Date().getFullYear()} Awakened AI. All rights reserved.
          </p>
        </div>
        <div className="flex gap-4">
          <Link href="/privacy" className="text-sm font-medium">
            Privacy
          </Link>
          <Link href="/terms" className="text-sm font-medium">
            Terms
          </Link>
          <Link href="/contact" className="text-sm font-medium">
            Contact
          </Link>
        </div>
      </div>
    </footer>
  );
} 