import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useAuth } from './AuthContext';

const ChatContext = createContext();

export function useChatContext() {
  return useContext(ChatContext);
}

const API = import.meta.env.VITE_API_URL || '';

export function ChatProvider({ children }) {
  const { user, isAnonymous } = useAuth();
  
  // Chat core state
  const [messages, setMessages] = useState([]);
  const [context, setContext] = useState(null);
  const [conversationId, setConversationId] = useState(() => crypto.randomUUID());
  
  // History state
  const [conversations, setConversations] = useState([]);

  const fetchConversations = useCallback(async () => {
    if (isAnonymous || !user) return;
    try {
      const res = await fetch(`${API}/api/conversations`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('saathi_token')}` }
      });
      if (res.ok) setConversations(await res.json());
    } catch (e) {
      console.error('Failed to fetch conversations:', e);
    }
  }, [user, isAnonymous]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const handleNewChat = useCallback(() => {
    setMessages([]);
    setContext(null);
    setConversationId(crypto.randomUUID());
  }, []);

  const handleConversationClick = useCallback(async (id) => {
    setContext(null);
    setConversationId(id);
    
    try {
      const res = await fetch(`${API}/api/conversations/${id}/messages`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('saathi_token')}` }
      });
      if (!res.ok) throw new Error('Failed to fetch messages');
      const data = await res.json();
      setMessages(data.messages.map(m => ({
        id: m._id,
        role: m.role === 'user' ? 'user' : 'model',
        content: m.content,
        timestamp: new Date(m.createdAt)
      })));
    } catch (e) {
      console.error(e);
    }
  }, []);

  const handleDeleteConversation = useCallback(async (e, id) => {
    e.stopPropagation();
    try {
      const res = await fetch(`${API}/api/conversations/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('saathi_token')}` }
      });
      if (res.ok) {
        setConversations(prev => prev.filter(c => c.conversationId !== id));
        if (conversationId === id) handleNewChat();
      }
    } catch (e) {
      console.error(e);
    }
  }, [conversationId, handleNewChat]);

  const handleUpdateConversationTitle = useCallback(async (id, newTitle) => {
    // Update local state immediately
    setConversations(prev => prev.map(c => 
      c.conversationId === id ? { ...c, title: newTitle } : c
    ));

    try {
      const res = await fetch(`${API}/api/conversations/${id}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('saathi_token')}` 
        },
        body: JSON.stringify({ title: newTitle })
      });
      if (!res.ok) throw new Error('Failed to update title');
    } catch (e) {
      console.error(e);
      // Optional: revert title on failure (or just re-fetch)
      fetchConversations();
    }
  }, [fetchConversations]);

  const value = {
    messages,
    setMessages,
    context,
    setContext,
    conversationId,
    setConversationId,
    conversations,
    fetchConversations,
    handleNewChat,
    handleConversationClick,
    handleDeleteConversation,
    handleUpdateConversationTitle
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
}
