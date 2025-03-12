'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  Conversation, 
  Message, 
  ConversationListItem, 
  conversationService,
  groupConversationsByDate,
  TimePeriod 
} from '@/lib/conversation';
import { v4 as uuidv4 } from 'uuid';

export function useConversations() {
  const [conversations, setConversations] = useState<ConversationListItem[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [groupedConversations, setGroupedConversations] = useState<Record<TimePeriod, ConversationListItem[]>>(
    { today: [], yesterday: [], previous7Days: [], older: [] }
  );
  const [isLoading, setIsLoading] = useState(true);

  // Load conversations on mount
  useEffect(() => {
    const loadConversations = () => {
      try {
        const allConversations = conversationService.getConversations();
        setConversations(allConversations);
        setGroupedConversations(groupConversationsByDate(allConversations));
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading conversations:', error);
        setIsLoading(false);
      }
    };

    loadConversations();
  }, []);

  // Get a conversation by ID
  const getConversation = useCallback((id: string): Conversation | null => {
    return conversationService.getConversation(id);
  }, []);

  // Start a new conversation
  const startNewConversation = useCallback((firstMessage?: string): Conversation => {
    // Create a new conversation with a default empty title
    const conversation = conversationService.createConversation(firstMessage || '');
    setCurrentConversation(conversation);
    
    // If first message was provided, add it to the conversation
    if (firstMessage && firstMessage.trim()) {
      const message: Message = {
        id: uuidv4(),
        role: 'user',
        content: firstMessage,
        timestamp: new Date()
      };
      
      conversationService.addMessage(conversation.id, message);
    }
    
    // Update the list
    const updatedConversations = conversationService.getConversations();
    setConversations(updatedConversations);
    setGroupedConversations(groupConversationsByDate(updatedConversations));
    
    return conversation;
  }, []);

  // Load a conversation
  const loadConversation = useCallback((id: string): boolean => {
    const conversation = conversationService.getConversation(id);
    if (conversation) {
      setCurrentConversation(conversation);
      return true;
    }
    return false;
  }, []);

  // Add a message to the current conversation
  const addMessage = useCallback((message: Omit<Message, 'id' | 'timestamp'>): Conversation | null => {
    if (!currentConversation) return null;
    
    const fullMessage: Message = {
      ...message,
      id: uuidv4(),
      timestamp: new Date()
    };
    
    const updatedConversation = conversationService.addMessage(
      currentConversation.id, 
      fullMessage
    );
    
    if (updatedConversation) {
      setCurrentConversation(updatedConversation);
      
      // Update the list
      const updatedConversations = conversationService.getConversations();
      setConversations(updatedConversations);
      setGroupedConversations(groupConversationsByDate(updatedConversations));
      
      return updatedConversation;
    }
    
    return null;
  }, [currentConversation]);

  // Delete a conversation
  const deleteConversation = useCallback((id: string): boolean => {
    const success = conversationService.deleteConversation(id);
    
    if (success) {
      // If the deleted conversation was current, clear it
      if (currentConversation?.id === id) {
        setCurrentConversation(null);
      }
      
      // Update the list
      const updatedConversations = conversationService.getConversations();
      setConversations(updatedConversations);
      setGroupedConversations(groupConversationsByDate(updatedConversations));
    }
    
    return success;
  }, [currentConversation]);

  return {
    conversations,
    groupedConversations,
    currentConversation,
    isLoading,
    getConversation,
    startNewConversation,
    loadConversation,
    addMessage,
    deleteConversation
  };
} 