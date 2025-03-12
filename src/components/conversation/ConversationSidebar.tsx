'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PlusCircle, MessageCircle, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TimePeriod, ConversationListItem } from '@/lib/conversation';

interface ConversationSidebarProps {
  groupedConversations: Record<TimePeriod, ConversationListItem[]>;
  currentConversationId?: string | null;
  isCollapsed: boolean;
  onCollapseToggle: () => void;
  onNewConversation: () => void;
  onSelectConversation: (id: string) => void;
  onDeleteConversation: (id: string) => void;
}

const timePeriodLabels: Record<TimePeriod, string> = {
  today: 'Today',
  yesterday: 'Yesterday',
  previous7Days: 'Previous 7 Days',
  older: 'Older'
};

export function ConversationSidebar({
  groupedConversations,
  currentConversationId,
  isCollapsed,
  onCollapseToggle,
  onNewConversation,
  onSelectConversation,
  onDeleteConversation
}: ConversationSidebarProps) {
  const [hoveredConversationId, setHoveredConversationId] = useState<string | null>(null);
  
  // Check if there are any conversations
  const hasConversations = Object.values(groupedConversations).some(group => group.length > 0);
  
  return (
    <div
      className={cn(
        'flex flex-col border-r border-border bg-background h-full relative transition-all duration-300 ease-in-out',
        isCollapsed ? 'w-0 border-transparent' : 'w-56 md:w-60'
      )}
      style={{
        position: isCollapsed ? 'relative' : 'sticky',
        left: 0,
        top: 0,
        bottom: 0,
        zIndex: 10
      }}
    >
      <div className="absolute right-0 top-4 transform translate-x-1/2 z-20">
        <Button
          variant="outline"
          size="icon"
          className="h-6 w-6 rounded-full border border-border bg-background shadow-md"
          onClick={onCollapseToggle}
        >
          {isCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
        </Button>
      </div>

      {!isCollapsed && (
        <>
          <div className="p-2 border-b border-border">
            <Button
              onClick={onNewConversation}
              className="w-full flex items-center gap-2"
              variant="outline"
              size="sm"
            >
              <PlusCircle className="h-4 w-4" />
              <span>New conversation</span>
            </Button>
          </div>

          <ScrollArea className="flex-1 py-1">
            {!hasConversations ? (
              <div className="flex flex-col items-center justify-center h-full py-8 text-center text-muted-foreground">
                <MessageCircle className="h-8 w-8 mb-2 opacity-50" />
                <p className="text-sm">No conversation history</p>
                <p className="text-xs mt-1">Start a new conversation to see it here</p>
              </div>
            ) : (
              <div className="space-y-3 px-2">
                {Object.entries(groupedConversations).map(([period, conversations]) => {
                  if (conversations.length === 0) return null;
                  
                  return (
                    <div key={period} className="space-y-1">
                      <h3 className="px-2 text-xs font-medium text-muted-foreground">
                        {timePeriodLabels[period as TimePeriod]}
                      </h3>
                      <div className="space-y-1">
                        {conversations.map(conversation => (
                          <div
                            key={conversation.id}
                            className="relative group"
                            onMouseEnter={() => setHoveredConversationId(conversation.id)}
                            onMouseLeave={() => setHoveredConversationId(null)}
                          >
                            <Button
                              variant={currentConversationId === conversation.id ? "secondary" : "ghost"}
                              className="w-full justify-start text-left truncate h-auto py-1.5 px-2.5 text-sm"
                              onClick={() => onSelectConversation(conversation.id)}
                            >
                              <MessageCircle className="h-3.5 w-3.5 mr-2 flex-shrink-0" />
                              <span className="truncate text-sm">
                                {conversation.title || 'New conversation'}
                              </span>
                            </Button>
                            {(hoveredConversationId === conversation.id || conversation.id === currentConversationId) && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="absolute right-0.5 top-0.5 h-5 w-5 opacity-70 hover:opacity-100 invisible group-hover:visible"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDeleteConversation(conversation.id);
                                }}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </>
      )}
    </div>
  );
} 