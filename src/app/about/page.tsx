import { BookOpen, Database, Brain, Users, Server, Shield } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-12 space-y-20">
      {/* Hero Section */}
      <section className="max-w-4xl mx-auto text-center space-y-6">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
          About <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">Awakened AI</span>
        </h1>
        <p className="text-lg text-muted-foreground leading-relaxed max-w-3xl mx-auto">
          Awakened AI is a comprehensive knowledge system built on thousands of carefully selected texts spanning mysticism, 
          spirituality, psychology, philosophy, and more.
        </p>
      </section>

      {/* Mission Section */}
      <section className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold">Our Mission</h2>
          <p className="text-muted-foreground">Making ancient and modern wisdom accessible to everyone</p>
        </div>
        
        <div className="prose prose-lg dark:prose-invert max-w-none">
          <p>
            Awakened AI was created with a singular purpose: to make the collective wisdom of humanity 
            easily accessible to anyone seeking knowledge and insights. By utilizing advanced AI technology 
            and a vast library of carefully curated texts, we provide a unique tool for exploration, research, 
            and personal growth.
          </p>
          <p>
            Our system allows you to ask questions about complex topics and receive comprehensive, 
            nuanced answers drawn from thousands of sources. Whether you're a researcher, a student, 
            a spiritual seeker, or simply curious about the big questions in life, Awakened AI is designed 
            to help you find meaningful insights.
          </p>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="max-w-5xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold">How It Works</h2>
          <p className="text-muted-foreground">Advanced AI technology meets curated knowledge</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card className="bg-card/60 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <div className="mb-2">
                <BookOpen className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Curated Library</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-sm text-muted-foreground">
                We've processed over 10,000 carefully selected books spanning ancient wisdom, modern psychology, 
                philosophy, spirituality, and more into a searchable knowledge base.
              </CardDescription>
            </CardContent>
          </Card>
          
          <Card className="bg-card/60 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <div className="mb-2">
                <Database className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Vector Database</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-sm text-muted-foreground">
                Text from each book is converted into mathematical vectors that capture the semantic meaning, 
                allowing the system to find relevant information across our entire library.
              </CardDescription>
            </CardContent>
          </Card>
          
          <Card className="bg-card/60 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <div className="mb-2">
                <Brain className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>AI Synthesis</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-sm text-muted-foreground">
                Our AI models use advanced retrieval-augmented generation (RAG) to find the most relevant 
                information and synthesize it into coherent, insightful responses.
              </CardDescription>
            </CardContent>
          </Card>
          
          <Card className="bg-card/60 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <div className="mb-2">
                <Server className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Source Attribution</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-sm text-muted-foreground">
                Every response includes information about the source materials, so you can explore the original 
                texts and verify the information provided.
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Team Section (Placeholder) */}
      <section className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold">Our Team</h2>
          <p className="text-muted-foreground">Passionate about knowledge and technology</p>
        </div>
        
        <Card className="border-none bg-secondary/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center">
              <Users className="h-16 w-16 text-primary/50" />
            </div>
            <div className="text-center mt-4 space-y-2">
              <p className="text-lg font-medium">We're a small team of developers, researchers, and book lovers</p>
              <p className="text-muted-foreground">Working to make the world's knowledge more accessible</p>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Privacy & Ethics Section */}
      <section className="max-w-4xl mx-auto space-y-8 pb-12">
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold">Privacy & Ethics</h2>
          <p className="text-muted-foreground">Our commitment to responsible AI</p>
        </div>
        
        <div className="flex items-center justify-center mb-6">
          <Shield className="h-16 w-16 text-primary/50" />
        </div>
        
        <div className="prose prose-lg dark:prose-invert max-w-none">
          <p>
            At Awakened AI, we're committed to developing and using AI technology responsibly. 
            We prioritize user privacy, data security, and ethical considerations in everything we do. 
            Our system is designed to be transparent about its sources and limitations.
          </p>
          <p>
            While we strive to provide accurate and helpful information, we acknowledge that AI systems have 
            limitations. We encourage critical thinking and verification of important information through 
            multiple sources.
          </p>
        </div>
      </section>
    </div>
  );
} 