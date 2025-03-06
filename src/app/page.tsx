import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center space-y-12 text-center px-4 py-10">
      <div className="space-y-4 max-w-3xl">
        <h1 className="text-5xl font-bold tracking-tighter">
          Awakened AI Knowledge System
        </h1>
        <p className="text-xl text-muted-foreground">
          A comprehensive AI knowledge base built on thousands of curated books spanning mysticism, spirituality, 
          history, psychology, alternative health, philosophy, and more.
        </p>
      </div>

      <div className="w-full max-w-xl">
        <form 
          className="flex space-x-2"
          action="/search"
        >
          <Input 
            name="q" 
            placeholder="Ask any question..." 
            className="flex-1"
          />
          <Button type="submit">Search</Button>
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl">
        <FeatureCard 
          title="10,000+ Books" 
          description="Access insights from a vast library of carefully selected texts" 
        />
        <FeatureCard 
          title="Intelligent Retrieval" 
          description="Our RAG system finds relevant information across multiple sources" 
        />
        <FeatureCard 
          title="Context-Aware" 
          description="Get answers that consider the broader context of your questions" 
        />
      </div>

      <div className="pt-6">
        <Button size="lg" asChild>
          <Link href="/search">Advanced Search</Link>
        </Button>
      </div>
    </div>
  );
}

function FeatureCard({ title, description }: { title: string; description: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <CardDescription>{description}</CardDescription>
      </CardContent>
    </Card>
  );
}
