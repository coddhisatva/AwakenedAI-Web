'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
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
  Send,
  PlusCircle,
  RefreshCw,
  ChevronRight,
  ChevronLeft
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
import { useConversations } from '@/hooks/useConversations';
import { ConversationSidebar } from '@/components/conversation/ConversationSidebar';
import { Message, conversationService } from '@/lib/conversation';
import { debounce } from 'lodash';
import { v4 as uuidv4 } from 'uuid';

export function UnifiedSearch({ initialQuery = '', embedded = false }: { initialQuery?: string; embedded?: boolean }) {
  // Search form state
  const [query, setQuery] = useState(initialQuery);
  const [isLoading, setIsLoading] = useState(false);
  
  // Sidebar state
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isNewConversationStarting, setIsNewConversationStarting] = useState(false);
  
  // Streaming state
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Track assistant message ID for streaming updates
  const assistantMessageIdRef = useRef<string | null>(null);
  const conversationIdRef = useRef<string | null>(null);
  const contentRef = useRef<string>('');
  
  // Use the conversation hook
  const {
    currentConversation,
    groupedConversations,
    startNewConversation,
    loadConversation,
    addMessage,
    deleteConversation
  } = useConversations();
  
  // Create a debounced function for updating the UI during streaming
  // This helps reduce the number of re-renders during fast streaming updates
  const debouncedUpdateStreamingMessage = useRef(
    debounce((messageId: string, conversationId: string, content: string) => {
      console.log(`Updating streaming message (debounced): ${content.length} chars`);
      
      // Get the current conversation
      const conversation = conversationService.getConversation(conversationId);
      if (!conversation) return;
      
      // Update the message content
      const updatedMessages = conversation.messages.map(msg => {
        if (msg.id === messageId) {
          return {
            ...msg,
            content
          };
        }
        return msg;
      });
      
      // Create an updated conversation object
      const updatedConversation = {
        ...conversation,
        messages: updatedMessages,
        updatedAt: new Date()
      };
      
      // Update the conversation in storage
      conversationService.updateConversation(updatedConversation);
      
      // Force a reload of the conversation to update UI
      loadConversation(conversationId);
    }, 150) // 150ms debounce time provides smooth updates without too many re-renders
  ).current;
  
  // Effect to initialize a new conversation if none exists and process initial query
  useEffect(() => {
    // If there's an initial query and no current conversation,
    // create a new conversation when the component mounts and send the query
    if (initialQuery && initialQuery.trim()) {
      const initializeWithQuery = async () => {
        if (!currentConversation) {
          // Create an empty conversation and then send the message
          const newConversation = startNewConversation('');
          if (newConversation) {
            conversationIdRef.current = newConversation.id;
            await sendMessage(initialQuery);
          }
        }
      };
      
      initializeWithQuery();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuery, currentConversation]);  // We only want this to run on mount or if initialQuery changes
  
  // Clean up the debounced function on unmount
  useEffect(() => {
    return () => {
      debouncedUpdateStreamingMessage.cancel();
    };
  }, [debouncedUpdateStreamingMessage]);
  
  // Handle search form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    // If there's no current conversation, start a new one but don't add the message yet
    // We'll let sendMessage handle it to avoid duplicate messages
    if (!currentConversation) {
      const newConversation = startNewConversation('');
      
      // Make sure we have the new conversation ID for reference
      if (newConversation) {
        conversationIdRef.current = newConversation.id;
      }
    }
    
    // Now send the message - this will add it to the current conversation
    // and process it to get a response
    await sendMessage(query);
    setQuery(''); // Clear input after sending
  };
  
  // Send a message and get a response
  const sendMessage = async (messageText: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Get the current conversation ID either from state or from our ref
      const targetConversationId = currentConversation?.id || conversationIdRef.current;
      
      // If we still don't have a conversation, create one now
      if (!targetConversationId) {
        const newConversation = startNewConversation('');
        if (!newConversation) {
          throw new Error('Failed to create a new conversation');
        }
        conversationIdRef.current = newConversation.id;
      }
      
      // Add user message to conversation
      const userMessage: Omit<Message, 'id' | 'timestamp'> = {
        role: 'user',
        content: messageText,
      };
      
      // If we have a current conversation in state, use that
      // Otherwise use the conversation service directly with our saved ID
      let updatedConversation;
      if (currentConversation) {
        updatedConversation = addMessage(userMessage);
      } else if (conversationIdRef.current) {
        // Add the message directly using the conversation service
        const message: Message = {
          ...userMessage,
          id: uuidv4(),
          timestamp: new Date()
        };
        updatedConversation = conversationService.addMessage(conversationIdRef.current, message);
        
        // Make sure our local state is updated
        if (updatedConversation) {
          loadConversation(conversationIdRef.current);
        }
      }
      
      if (!updatedConversation) {
        throw new Error('Failed to add message to conversation');
      }
      
      // Store conversation ID for later use (if not already set)
      conversationIdRef.current = updatedConversation.id;
      
      // Add temporary assistant message that will be updated with streaming content
      const tempAssistantMessage: Omit<Message, 'id' | 'timestamp'> = {
        role: 'assistant',
        content: '',
      };
      
      // Similar approach for the assistant message
      let withAssistantMessage;
      if (currentConversation) {
        withAssistantMessage = addMessage(tempAssistantMessage);
      } else if (conversationIdRef.current) {
        const message: Message = {
          ...tempAssistantMessage,
          id: uuidv4(),
          timestamp: new Date()
        };
        withAssistantMessage = conversationService.addMessage(conversationIdRef.current, message);
        
        // Update our local state
        if (withAssistantMessage) {
          loadConversation(conversationIdRef.current);
        }
      }
      
      if (!withAssistantMessage) {
        throw new Error('Failed to add assistant message to conversation');
      }
      
      // Store the assistant message ID for updating during streaming
      assistantMessageIdRef.current = withAssistantMessage.messages[withAssistantMessage.messages.length - 1].id;
      
      // Reset the content reference
      contentRef.current = '';
      
      // Prepare conversation history for context
      const conversationHistory = updatedConversation.messages.map(msg => ({
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
                contentRef.current = parsedChunk.fullContent;
              } else {
                contentRef.current += parsedChunk.content;
              }
              
              // Update the assistant message with the current content
              if (assistantMessageIdRef.current && conversationIdRef.current) {
                // Use the debounced update to avoid too many UI updates
                debouncedUpdateStreamingMessage(
                  assistantMessageIdRef.current, 
                  conversationIdRef.current, 
                  contentRef.current
                );
              }
            } else if (parsedChunk.type === 'done') {
              // Cancel any pending debounced updates
              debouncedUpdateStreamingMessage.cancel();
              
              // Final content - use the complete content from the server
              const finalContent = parsedChunk.content || contentRef.current;
              contentRef.current = finalContent;
              
              // Update the assistant message with the final content immediately
              if (assistantMessageIdRef.current && conversationIdRef.current) {
                // Get the current conversation
                const conversation = conversationService.getConversation(conversationIdRef.current);
                if (conversation) {
                  // Update the message content
                  const updatedMessages = conversation.messages.map(msg => {
                    if (msg.id === assistantMessageIdRef.current) {
                      return {
                        ...msg,
                        content: finalContent
                      };
                    }
                    return msg;
                  });
                  
                  // Create an updated conversation object
                  const updatedConversation = {
                    ...conversation,
                    messages: updatedMessages,
                    updatedAt: new Date()
                  };
                  
                  // Update the conversation in storage
                  conversationService.updateConversation(updatedConversation);
                  
                  // Force a reload of the conversation to update UI
                  loadConversation(conversationIdRef.current);
                  
                  // Reset the assistant message ID ref since we're done with this message
                  assistantMessageIdRef.current = null;
                }
              }
              
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
      
      // More descriptive error message
      const errorMessage = err.message || 'Unknown error';
      setError(`Failed to process query: ${errorMessage}`);
      
      // Cancel any pending debounced updates
      debouncedUpdateStreamingMessage.cancel();
      
      // Update the message to show the error
      if (assistantMessageIdRef.current && conversationIdRef.current) {
        // Get the current conversation
        const conversation = conversationService.getConversation(conversationIdRef.current);
        if (conversation) {
          // Update the message content with a more descriptive error
          const updatedMessages = conversation.messages.map(msg => {
            if (msg.id === assistantMessageIdRef.current) {
              return {
                ...msg,
                content: `Sorry, there was an error processing your query. ${errorMessage.includes('search') ? 'The search service might be experiencing issues.' : 'Please try again later or rephrase your question.'}`
              };
            }
            return msg;
          });
          
          // Create an updated conversation object
          const updatedConversation = {
            ...conversation,
            messages: updatedMessages,
            updatedAt: new Date()
          };
          
          // Update the conversation in storage
          conversationService.updateConversation(updatedConversation);
          
          // Force a reload of the conversation to update UI
          loadConversation(conversationIdRef.current);
        }
      }
      
      // If this was a brand new conversation with only the error message,
      // consider deleting it or marking it specially
      if (conversationIdRef.current) {
        const conversation = conversationService.getConversation(conversationIdRef.current);
        if (conversation && conversation.messages.length <= 2) {
          // It's a new conversation with just the user message and error response
          // We could delete it here, but for now we'll keep it and let the user decide
          
          // Optionally add a flag to the conversation to indicate it had an error
          // This could be used for UI treatment or future retry logic
        }
      }
    } finally {
      // Reset loading states
      setIsLoading(false);
      setIsStreaming(false);
      
      // Ensure we have the latest conversation data displayed
      if (conversationIdRef.current) {
        loadConversation(conversationIdRef.current);
      }
      
      // Reset references if we're done with streaming
      if (!isStreaming) {
        assistantMessageIdRef.current = null;
        // Don't reset conversationIdRef.current here, as we may need it for future messages
      }
    }
  };
  
  // Start a new conversation UI interaction
  const handleNewConversation = () => {
    if (isLoading || isStreaming) return;
    
    setIsNewConversationStarting(true);
    
    // Clear the current conversation state locally
    setQuery('');
    setError(null);
    
    // Start a new conversation with an empty initial message
    // Using setTimeout to provide visual feedback
    setTimeout(() => {
      startNewConversation('');
      setIsNewConversationStarting(false);
    }, 500);
  };
  
  return (
    <div className={`flex ${embedded ? 'h-[60vh] md:h-[70vh]' : 'h-[calc(100vh-4rem)]'} w-full max-w-none overflow-hidden`}>
      {/* Conversation History Sidebar */}
      <ConversationSidebar 
        groupedConversations={groupedConversations}
        currentConversationId={currentConversation?.id}
        isCollapsed={isSidebarCollapsed}
        onCollapseToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        onNewConversation={handleNewConversation}
        onSelectConversation={loadConversation}
        onDeleteConversation={deleteConversation}
      />
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0 w-full">
        {/* Mobile-only header with sidebar toggle */}
        <div className="md:hidden flex items-center p-2 border-b border-border">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          >
            {isSidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
          {currentConversation && (
            <div className="ml-2 text-sm font-medium truncate">
              {currentConversation.title}
            </div>
          )}
        </div>
        
        {/* Scrollable message area */}
        <div className="flex-1 overflow-auto px-3 sm:px-5 lg:px-8">
          <div className="flex flex-col space-y-6 w-full max-w-full">
            {/* Messages Display */}
            {currentConversation && currentConversation.messages.length > 0 ? (
              <div className="space-y-4 pt-4">
                {currentConversation.messages.map((message) => (
                  <Card 
                    key={message.id} 
                    className={`shadow-sm overflow-hidden ${
                      message.role === 'user' 
                        ? 'border-primary/20 bg-primary/5' 
                        : 'border-border'
                    }`}
                  >
                    <CardContent className="p-3 sm:p-4">
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
            ) : (
              <div className="text-center py-12 lg:py-16 my-4 bg-secondary/20 rounded-lg border border-border/40">
                <div className="flex flex-col items-center space-y-4 px-4">
                  <BookOpen className="h-10 w-10 md:h-12 md:w-12 text-primary/50" />
                  <h3 className="text-lg md:text-xl font-medium">Enter a query to begin</h3>
                  <p className="text-sm md:text-base text-muted-foreground">
                    Ask any question related to spirituality, philosophy, psychology, mysticism, or any other topic covered in our book collection.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Search Form and Action Buttons - sticky at bottom */}
        <div className="sticky bottom-0 pt-2 pb-3 px-2 sm:px-4 lg:px-6 bg-background z-10 border-t border-border/30">
          <Card className="border-border shadow-sm overflow-hidden bg-card">
            <CardContent className="p-2 sm:p-3">
              <form onSubmit={handleSubmit} className="flex flex-col space-y-3" role="form">
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder={currentConversation && currentConversation.messages.length > 0 
                        ? "Ask a follow-up question..." 
                        : "What would you like to know?"}
                      className="pl-9 pr-4 border-border focus-visible:ring-primary"
                      disabled={isLoading || isStreaming}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Sheet>
                      <SheetTrigger asChild>
                        <Button variant="outline" type="button" className="flex items-center gap-1.5 border-border h-10">
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
                      className="bg-primary hover:bg-primary/90 text-white h-10"
                    >
                      {isLoading ? (
                        <>
                          <span className="mr-2">Searching</span>
                          <span className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          <span>{currentConversation && currentConversation.messages.length > 0 ? 'Send' : 'Search'}</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
          
          {/* New Conversation Button - shown when there are messages */}
          {currentConversation && currentConversation.messages.length > 0 && (
            <div className="flex justify-center mt-3">
              <Button
                onClick={handleNewConversation}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
                disabled={isLoading || isStreaming}
              >
                {isNewConversationStarting ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <PlusCircle className="h-4 w-4" />
                )}
                <span>New Conversation</span>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 