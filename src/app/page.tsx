import Link from 'next/link';
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Search, Database, BookOpen, Brain } from 'lucide-react';
import { UnifiedSearch } from '@/components/search/UnifiedSearch';

export default function Home() {
  return (
    <div className="flex flex-col space-y-24 pb-12">
      {/* Hero Section */}
      <section className="relative pt-12 md:pt-24 pb-12 overflow-hidden">
        {/* Background Gradient Elements */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute top-1/4 right-1/4 -z-10 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute bottom-1/3 left-1/3 -z-10 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
        </div>

        <div className="container px-4 mx-auto">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
              Unlock the Wisdom of <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">Thousands of Books</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
              A comprehensive AI knowledge system built on thousands of curated books spanning 
              mysticism, spirituality, history, psychology, alternative health, philosophy, and more (Alpha).
            </p>
          </div>
        </div>
      </section>
      
      {/* Search Section - Full Width */}
      <section className="w-full mx-auto -mt-20">
        <div className="w-full">
          <UnifiedSearch />
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 bg-secondary/30">
        <div className="container px-4 mx-auto">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Powered by Knowledge</h2>
            <p className="text-muted-foreground">
              Our AI system leverages a vast library of carefully selected texts to provide deep insights.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <FeatureCard 
              icon={<BookOpen className="h-6 w-6 text-primary" />}
              title="10,000+ Books" 
              description="Access insights from a vast library of carefully selected texts spanning dozens of subjects." 
            />
            <FeatureCard 
              icon={<Database className="h-6 w-6 text-primary" />}
              title="Intelligent Retrieval" 
              description="Our RAG system finds relevant information across multiple sources for accurate answers." 
            />
            <FeatureCard 
              icon={<Brain className="h-6 w-6 text-primary" />}
              title="Context-Aware" 
              description="Get answers that consider the broader context of your questions and knowledge domain." 
            />
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-12">
        <div className="container px-4 mx-auto">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">How It Works</h2>
            <p className="text-muted-foreground">
              Awakened AI connects you to the wisdom of thousands of books in just a few simple steps
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <StepCard 
              number="1"
              title="Ask a Question" 
              description="Enter any question related to spirituality, psychology, philosophy or other topics." 
            />
            <StepCard 
              number="2"
              title="AI Searches Books" 
              description="Our system searches through thousands of books to find relevant passages and insights." 
            />
            <StepCard 
              number="3"
              title="Receive Wisdom" 
              description="Get a comprehensive answer with direct references to the source materials." 
            />
          </div>
        </div>
      </section>

      {/* Testimonial/CTA Section */}
      <section className="py-12 bg-primary/5 rounded-3xl max-w-6xl mx-auto">
        <div className="container px-4 mx-auto">
          <div className="flex flex-col md:flex-row gap-8 items-center">
            <div className="md:w-1/2 space-y-6">
              <h2 className="text-3xl font-bold">Explore the depths of human knowledge</h2>
              <p className="text-muted-foreground">
                Gain access to wisdom from thousands of carefully curated texts spanning mysticism, spirituality, 
                psychology, philosophy, and more. Start your journey of discovery today.
              </p>
              <div className="flex gap-4 pt-2">
                <Button asChild className="rounded-full px-6 bg-primary hover:bg-primary/90 text-white">
                  <Link href="/sign-up">Sign Up</Link>
                </Button>
                <Button asChild variant="outline" className="rounded-full px-6">
                  <Link href="/about">Learn More</Link>
                </Button>
              </div>
            </div>
            <div className="md:w-1/2 bg-white p-6 rounded-xl shadow-sm border border-border">
              <blockquote className="space-y-4">
                <p className="text-lg italic">
                  &ldquo;Awakened AI has transformed how I research spiritual concepts. It&apos;s like having 
                  access to a personal library with expert guidance.&rdquo;
                </p>
                <footer className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="text-primary font-medium">MJ</span>
                  </div>
                  <div>
                    <p className="font-medium">Michael Johnson</p>
                    <p className="text-sm text-muted-foreground">Researcher & Author</p>
                  </div>
                </footer>
              </blockquote>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string; description: string }) {
  return (
    <Card className="border-border bg-card/60 backdrop-blur-sm hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="mb-3">{icon}</div>
        <CardTitle className="text-xl">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <CardDescription className="text-sm text-muted-foreground">{description}</CardDescription>
      </CardContent>
    </Card>
  );
}

function StepCard({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <Card className="border-border bg-card hover:shadow-md transition-shadow relative overflow-hidden">
      <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-secondary flex items-end justify-end">
        <span className="text-3xl font-bold text-primary/50 mr-3 mb-3">{number}</span>
      </div>
      <CardHeader className="pb-2">
        <CardTitle className="text-xl">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <CardDescription className="text-sm text-muted-foreground">{description}</CardDescription>
      </CardContent>
    </Card>
  );
}
