import { useState, useEffect } from 'react';
import { toast } from "sonner";
import { ChatMessage } from '@/types/message';

const STORAGE_KEY = 'wce_emulator_chats';

export const useChatPersistence = () => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved, (key, value) => {
            if (key === 'timestamp') return new Date(value);
            return value;
        });
      }
    } catch (error) {
      console.error("Failed to load chats:", error);
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  }, [messages]);

  const clearPersistence = () => {
    localStorage.removeItem(STORAGE_KEY);
    setMessages([]);
    toast.success("Chat history cleared");
  };

  return { messages, setMessages, clearPersistence };
};