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
  SlidersHorizontal,
  BookOpen,
  Send
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
import { v4 as uuidv4 } from 'uuid';

// Define Message type directly in this file
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export function UnifiedSearch({ initialQuery = '' }: { initialQuery?: string }) {
  // Search form state
  const [query, setQuery] = useState(initialQuery);
  const [isLoading, setIsLoading] = useState(false);
  
  // Conversation state
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Handle search form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    await sendMessage(query);
    setQuery(''); // Clear input after sending
  };
  
  // Send a message and get a response
  const sendMessage = async (messageText: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Add user message to conversation
      const userMessage: Message = {
        id: uuidv4(),
        role: 'user',
        content: messageText,
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, userMessage]);
      
      // Add temporary assistant message that will be updated with streaming
      const tempAssistantMessage: Message = {
        id: uuidv4(),
        role: 'assistant',
        content: '',
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, tempAssistantMessage]);
      
      // Prepare conversation history for context
      const conversationHistory = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));
      
      // Start the search and streaming process
      setIsStreaming(true);
      
      // First get search results
      const searchResponse = await fetch(`/api/search?q=${encodeURIComponent(messageText)}`);
      
      if (!searchResponse.ok) {
        const errorData = await searchResponse.json().catch(() => null);
        throw new Error(
          errorData?.error || `Error: ${searchResponse.status} - ${searchResponse.statusText}`
        );
      }
      
      const searchData = await searchResponse.json();
      console.log('Search results:', searchData);
      
      // Start streaming completion
      const streamResponse = await fetch('/api/completion-stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: messageText,
          context: searchData.raw_results.chunks,
          conversation_history: conversationHistory,
          temperature: 0.1,
        }),
      });
      
      if (!streamResponse.ok) {
        throw new Error(`Stream error: ${streamResponse.status}`);
      }
      
      // Process the stream
      const reader = streamResponse.body?.getReader();
      if (!reader) throw new Error('Failed to get stream reader');
      
      const decoder = new TextDecoder();
      let accumulatedContent = '';
      
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          console.log('Stream complete');
          break;
        }
        
        // Process the chunk
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim());
        
        for (const line of lines) {
          try {
            const parsedChunk = JSON.parse(line);
            
            if (parsedChunk.type === 'chunk') {
              // Use the fullContent if available for more accurate rendering
              if (parsedChunk.fullContent) {
                accumulatedContent = parsedChunk.fullContent;
              } else {
                accumulatedContent += parsedChunk.content;
              }
              
              // Update the assistant message with the current content
              setMessages(prevMessages => {
                return prevMessages.map(msg => {
                  if (msg.id === tempAssistantMessage.id) {
                    return {
                      ...msg,
                      content: accumulatedContent
                    };
                  }
                  return msg;
                });
              });
            } else if (parsedChunk.type === 'done') {
              // Final content - use the complete content from the server
              const finalContent = parsedChunk.content || accumulatedContent;
              
              setMessages(prevMessages => {
                return prevMessages.map(msg => {
                  if (msg.id === tempAssistantMessage.id) {
                    return {
                      ...msg,
                      content: finalContent
                    };
                  }
                  return msg;
                });
              });
              
              console.log('Streaming completed successfully');
            } else if (parsedChunk.type === 'error') {
              throw new Error(parsedChunk.error || 'Stream processing error');
            }
          } catch (parseError) {
            console.error('Error parsing stream chunk:', parseError, line);
          }
        }
      }
    } catch (err: any) {
      console.error('Failed to send message:', err);
      setError('Failed to send message. Please try again.');
      
      // Update the message to show the error
      setMessages(prevMessages => {
        return prevMessages.map(msg => {
          if (msg.role === 'assistant' && msg.content === '') {
            return {
              ...msg,
              content: 'Sorry, there was an error generating a response. Please try again.'
            };
          }
          return msg;
        });
      });
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
    }
  };
  
  return (
    <div className="flex flex-col space-y-8">
      {/* Messages Display */}
      {messages.length > 0 && (
        <div className="space-y-4">
          {messages.map((message) => (
            <Card 
              key={message.id} 
              className={`shadow-sm overflow-hidden ${
                message.role === 'user' 
                  ? 'border-primary/20 bg-primary/5' 
                  : 'border-border'
              }`}
            >
              <CardContent className="p-4">
                <div className="prose prose-neutral dark:prose-invert max-w-none">
                  <div className="whitespace-pre-line">
                    {message.content || (
                      <div className="flex items-center space-x-2 text-muted-foreground">
                        <div className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
                        <span>Thinking...</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {error && (
            <div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm">
              {error}
            </div>
          )}
        </div>
      )}
      
      {/* Initial state - show a prompt to search */}
      {messages.length === 0 && (
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
                  placeholder={messages.length > 0 ? "Ask a follow-up question..." : "What would you like to know?"}
                  className="pl-9 pr-4 border-border focus-visible:ring-primary"
                  disabled={isLoading || isStreaming}
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
                  disabled={isLoading || isStreaming || !query.trim()} 
                  className="bg-primary hover:bg-primary/90 text-white"
                >
                  {isLoading ? (
                    <>
                      <span className="mr-2">Searching</span>
                      <span className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      <span>{messages.length > 0 ? 'Send' : 'Search'}</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 