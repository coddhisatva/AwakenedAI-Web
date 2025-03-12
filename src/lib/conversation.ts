'use client';

import { v4 as uuidv4 } from 'uuid';

// Message type
export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// Main conversation type
export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

// Lightweight type for listing conversations
export interface ConversationListItem {
  id: string;
  title: string;
  preview: string;
  createdAt: Date;
  updatedAt: Date;
}

// Storage key for localStorage
const STORAGE_KEY = 'awakened_ai_conversations';

// Time periods for grouping
export type TimePeriod = 'today' | 'yesterday' | 'previous7Days' | 'older';

// Helper to generate title from first message
const generateTitle = (message: string): string => {
  if (!message || !message.trim()) {
    return 'New conversation';
  }
  
  // Remove new lines and extra spaces
  const cleanedMessage = message.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
  
  // Truncate to a reasonable length
  if (cleanedMessage.length <= 30) return cleanedMessage;
  return cleanedMessage.substring(0, 30) + '...';
};

// Helper to group conversations by time period
export const groupConversationsByDate = (conversations: ConversationListItem[]): Record<TimePeriod, ConversationListItem[]> => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const previous7Days = new Date(today);
  previous7Days.setDate(previous7Days.getDate() - 7);
  
  // Sort conversations by updatedAt (newest first)
  const sorted = [...conversations].sort((a, b) => 
    new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
  
  return sorted.reduce((groups, conversation) => {
    const convoDate = new Date(conversation.createdAt);
    
    if (convoDate >= today) {
      groups.today.push(conversation);
    } else if (convoDate >= yesterday) {
      groups.yesterday.push(conversation);
    } else if (convoDate >= previous7Days) {
      groups.previous7Days.push(conversation);
    } else {
      groups.older.push(conversation);
    }
    
    return groups;
  }, {
    today: [] as ConversationListItem[],
    yesterday: [] as ConversationListItem[],
    previous7Days: [] as ConversationListItem[],
    older: [] as ConversationListItem[]
  });
};

// Conversation service class
class ConversationService {
  // Get all conversations
  getConversations(): ConversationListItem[] {
    if (typeof window === 'undefined') return [];
    
    const storedData = localStorage.getItem(STORAGE_KEY);
    if (!storedData) return [];
    
    try {
      const conversations = JSON.parse(storedData) as Conversation[];
      
      // Convert to list items
      return conversations.map(conv => ({
        id: conv.id,
        title: conv.title,
        preview: conv.messages.find(m => m.role === 'assistant')?.content.substring(0, 60) + '...' || 'No response yet',
        createdAt: new Date(conv.createdAt),
        updatedAt: new Date(conv.updatedAt)
      }));
    } catch (error) {
      console.error('Error parsing conversations:', error);
      return [];
    }
  }
  
  // Get a specific conversation by ID
  getConversation(id: string): Conversation | null {
    if (typeof window === 'undefined') return null;
    
    const storedData = localStorage.getItem(STORAGE_KEY);
    if (!storedData) return null;
    
    try {
      const conversations = JSON.parse(storedData) as Conversation[];
      const conversation = conversations.find(c => c.id === id);
      
      if (!conversation) return null;
      
      // Parse dates
      return {
        ...conversation,
        createdAt: new Date(conversation.createdAt),
        updatedAt: new Date(conversation.updatedAt),
        messages: conversation.messages.map(m => ({
          ...m,
          timestamp: new Date(m.timestamp)
        }))
      };
    } catch (error) {
      console.error('Error getting conversation:', error);
      return null;
    }
  }
  
  // Create a new conversation
  createConversation(firstMessage: string): Conversation {
    const newConversation: Conversation = {
      id: uuidv4(),
      title: generateTitle(firstMessage),
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Save to storage
    this.saveConversation(newConversation);
    
    return newConversation;
  }
  
  // Update an existing conversation
  updateConversation(conversation: Conversation): Conversation {
    conversation.updatedAt = new Date();
    this.saveConversation(conversation);
    return conversation;
  }
  
  // Add a message to a conversation
  addMessage(conversationId: string, message: Message): Conversation | null {
    const conversation = this.getConversation(conversationId);
    if (!conversation) return null;
    
    // For the first user message, update the title
    if (conversation.messages.length === 0 && message.role === 'user') {
      conversation.title = generateTitle(message.content);
    }
    
    conversation.messages.push(message);
    conversation.updatedAt = new Date();
    
    this.saveConversation(conversation);
    return conversation;
  }
  
  // Delete a conversation
  deleteConversation(id: string): boolean {
    if (typeof window === 'undefined') return false;
    
    const storedData = localStorage.getItem(STORAGE_KEY);
    if (!storedData) return false;
    
    try {
      const conversations = JSON.parse(storedData) as Conversation[];
      const updatedConversations = conversations.filter(c => c.id !== id);
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedConversations));
      return true;
    } catch (error) {
      console.error('Error deleting conversation:', error);
      return false;
    }
  }
  
  // Private helper to save a conversation
  private saveConversation(conversation: Conversation): void {
    if (typeof window === 'undefined') return;
    
    const storedData = localStorage.getItem(STORAGE_KEY);
    let conversations: Conversation[] = [];
    
    if (storedData) {
      try {
        conversations = JSON.parse(storedData) as Conversation[];
      } catch (error) {
        console.error('Error parsing conversations:', error);
      }
    }
    
    // Find and replace if exists, otherwise add
    const index = conversations.findIndex(c => c.id === conversation.id);
    if (index >= 0) {
      conversations[index] = conversation;
    } else {
      conversations.push(conversation);
    }
    
    // Save back to storage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
  }
}

// Singleton instance
export const conversationService = new ConversationService(); 