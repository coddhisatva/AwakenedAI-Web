'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Message } from '@/types';
import { Send, User, Bot, Loader2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface ConversationProps {
  initialQuery: string;
  initialResponse?: string;
  sources?: any[];
}

export function Conversation({ initialQuery, initialResponse, sources = [] }: ConversationProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [streamedContent, setStreamedContent] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Initialize conversation with initial query and response
  useEffect(() => {
    if (initialQuery) {
      const initialMessages: Message[] = [
        {
          id: uuidv4(),
          role: 'user',
          content: initialQuery,
          timestamp: new Date(),
        }
      ];
      
      if (initialResponse) {
        initialMessages.push({
          id: uuidv4(),
          role: 'assistant',
          content: initialResponse,
          timestamp: new Date(),
        });
      }
      
      setMessages(initialMessages);
    }
  }, [initialQuery, initialResponse]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle sending a new message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim()) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Add user message to conversation
      const userMessage: Message = {
        id: uuidv4(),
        role: 'user',
        content: newMessage,
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, userMessage]);
      setNewMessage('');
      
      // Prepare conversation history for context
      const conversationHistory = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));
      
      // Add temporary assistant message that will be updated with streaming
      const tempAssistantMessage: Message = {
        id: uuidv4(),
        role: 'assistant',
        content: '',
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, tempAssistantMessage]);
      
      // Abort any ongoing streams
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      // Start streaming completion
      await startCompletionStream(newMessage, conversationHistory, tempAssistantMessage.id);
      
    } catch (err: any) {
      console.error('Failed to send message:', err);
      setError('Failed to send message. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Function to handle streaming completion
  const startCompletionStream = async (query: string, history: any[], messageId: string) => {
    try {
      // Create a new AbortController for this stream
      abortControllerRef.current = new AbortController();
      const { signal } = abortControllerRef.current;
      
      setStreamedContent('');
      
      // Start the streaming request
      const streamResponse = await fetch('/api/completion-stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: query,
          conversation_history: history,
          temperature: 0.1,
        }),
        signal
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
              
              setStreamedContent(accumulatedContent);
              
              // Update the assistant message with the current content
              setMessages(prevMessages => {
                return prevMessages.map(msg => {
                  if (msg.id === messageId) {
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
                  if (msg.id === messageId) {
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
    } catch (streamError: any) {
      if (streamError.name === 'AbortError') {
        console.log('Stream was aborted');
      } else {
        console.error('Streaming error:', streamError);
        setError(`Error generating response: ${streamError.message}`);
        
        // Update the message to show the error
        setMessages(prevMessages => {
          return prevMessages.map(msg => {
            if (msg.id === messageId) {
              return {
                ...msg,
                content: 'Sorry, there was an error generating a response. Please try again.'
              };
            }
            return msg;
          });
        });
      }
    }
  };

  return (
    <div className="flex flex-col h-full">
      <Card className="flex-1 overflow-hidden mb-4 border border-border/40">
        <CardContent className="flex flex-col h-full p-0">
          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`flex items-start gap-2 max-w-[80%] ${
                    message.role === 'user'
                      ? 'bg-primary/10 rounded-l-lg rounded-tr-lg'
                      : 'bg-muted rounded-r-lg rounded-tl-lg'
                  } p-3`}
                >
                  {message.role === 'assistant' && (
                    <Bot className="h-5 w-5 mt-0.5 text-primary flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <div className="prose prose-sm dark:prose-invert">
                      {message.content || (
                        <div className="flex items-center space-x-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Thinking...</span>
                        </div>
                      )}
                    </div>
                  </div>
                  {message.role === 'user' && (
                    <User className="h-5 w-5 mt-0.5 text-primary flex-shrink-0" />
                  )}
                </div>
              </div>
            ))}
            {error && (
              <div className="bg-destructive/10 text-destructive p-2 rounded-md text-sm">
                {error}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div className="border-t border-border/40 p-4">
            <form onSubmit={handleSendMessage} className="flex space-x-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                disabled={isLoading}
                className="flex-1"
                autoFocus
              />
              <Button 
                type="submit" 
                disabled={isLoading || !newMessage.trim()} 
                className="bg-primary hover:bg-primary/90 text-white"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 