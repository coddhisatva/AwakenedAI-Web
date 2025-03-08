'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/lib/auth';
import { Search, Menu, Home, Info, User, History, Star, LogOut } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';

export function Header() {
  const { user, signOut } = useAuth();
  
  return (
    <header className="border-b border-border sticky top-0 z-10 bg-background/80 backdrop-blur-sm">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">Awakened AI</span>
          </Link>
          <nav className="hidden md:flex gap-6">
            <Link href="/" className="text-sm font-medium hover:text-primary flex items-center gap-1.5 transition-colors">
              <Home size={16} />
              <span>Home</span>
            </Link>
            <Link href="/search" className="text-sm font-medium hover:text-primary flex items-center gap-1.5 transition-colors">
              <Search size={16} />
              <span>Search</span>
            </Link>
            <Link href="/about" className="text-sm font-medium hover:text-primary flex items-center gap-1.5 transition-colors">
              <Info size={16} />
              <span>About</span>
            </Link>
          </nav>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="hidden md:flex mr-2">
            <form action="/search" className="relative w-full max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                type="search"
                name="q"
                placeholder="Search knowledge..."
                className="w-full rounded-full bg-muted pl-9 focus-visible:ring-primary"
              />
            </form>
          </div>
          
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                  <Avatar className="h-9 w-9 ring-1 ring-border">
                    <AvatarImage src="" alt={user.email || 'User'} />
                    <AvatarFallback className="bg-primary/10 text-primary">{user.email?.charAt(0) || 'U'}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  <Link href="/profile">Profile</Link>
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer">
                  <History className="mr-2 h-4 w-4" />
                  <Link href="/history">Search History</Link>
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer">
                  <Star className="mr-2 h-4 w-4" />
                  <Link href="/favorites">Favorites</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut()} className="cursor-pointer text-destructive focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" asChild size="sm" className="hidden sm:flex">
                <Link href="/sign-in">Sign In</Link>
              </Button>
              <Button asChild size="sm" className="bg-primary hover:bg-primary/90">
                <Link href="/sign-up">Sign Up</Link>
              </Button>
            </div>
          )}
          
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[250px] sm:w-[300px]">
              <nav className="flex flex-col gap-4 mt-8">
                <Link 
                  href="/" 
                  className="flex items-center gap-2 text-sm font-medium px-2 py-1.5 hover:bg-accent rounded-md"
                >
                  <Home size={18} />
                  Home
                </Link>
                <Link 
                  href="/search" 
                  className="flex items-center gap-2 text-sm font-medium px-2 py-1.5 hover:bg-accent rounded-md"
                >
                  <Search size={18} />
                  Search
                </Link>
                <Link 
                  href="/about" 
                  className="flex items-center gap-2 text-sm font-medium px-2 py-1.5 hover:bg-accent rounded-md"
                >
                  <Info size={18} />
                  About
                </Link>
                {!user && (
                  <>
                    <Link 
                      href="/sign-in" 
                      className="flex items-center gap-2 text-sm font-medium px-2 py-1.5 hover:bg-accent rounded-md"
                    >
                      Sign In
                    </Link>
                    <Link 
                      href="/sign-up" 
                      className="flex items-center gap-2 text-sm font-medium bg-primary text-white px-2 py-1.5 rounded-md"
                    >
                      Sign Up
                    </Link>
                  </>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
} 