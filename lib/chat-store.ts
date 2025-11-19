import { create } from 'zustand';
import { ChatMessage, ClaudeModel } from '@/types/skills';

interface ChatState {
  messages: ChatMessage[];
  isOpen: boolean;
  isProcessing: boolean;
  currentNodeId: string | null;
  model: ClaudeModel;
  workflowStartPrompt: string | null;

  // Actions
  addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  clearMessages: () => void;
  setIsOpen: (isOpen: boolean) => void;
  setIsProcessing: (isProcessing: boolean) => void;
  setCurrentNodeId: (nodeId: string | null) => void;
  setModel: (model: ClaudeModel) => void;
  setWorkflowStartPrompt: (prompt: string | null) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  isOpen: false,
  isProcessing: false,
  currentNodeId: null,
  model: 'claude-haiku-4-5-20251001',
  workflowStartPrompt: null,

  addMessage: (message) => {
    const newMessage: ChatMessage = {
      ...message,
      id: crypto.randomUUID(),
      timestamp: new Date(),
    };
    set({ messages: [...get().messages, newMessage] });
  },

  clearMessages: () => set({ messages: [] }),

  setIsOpen: (isOpen) => set({ isOpen }),

  setIsProcessing: (isProcessing) => set({ isProcessing }),

  setCurrentNodeId: (nodeId) => set({ currentNodeId: nodeId }),

  setModel: (model) => set({ model }),

  setWorkflowStartPrompt: (prompt) => set({ workflowStartPrompt: prompt }),
}));
