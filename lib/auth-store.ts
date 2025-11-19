import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email?: string;
  apiKey: string; // Encrypted or hashed
  sessionToken: string;
  createdAt: Date;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  login: (apiKey: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (apiKey: string) => {
        set({ isLoading: true });

        try {
          // Validate API key and generate session token
          const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ apiKey }),
          });

          const data = await response.json();

          if (!response.ok) {
            set({ isLoading: false });
            return {
              success: false,
              error: data.error || 'Authenticatie mislukt',
            };
          }

          // Store user data
          const user: User = {
            id: data.userId,
            email: data.email,
            apiKey: data.encryptedApiKey, // Encrypted version
            sessionToken: data.sessionToken,
            createdAt: new Date(),
          };

          set({
            user,
            isAuthenticated: true,
            isLoading: false,
          });

          return { success: true };
        } catch (error: any) {
          set({ isLoading: false });
          return {
            success: false,
            error: error.message || 'Er is een fout opgetreden',
          };
        }
      },

      logout: () => {
        set({
          user: null,
          isAuthenticated: false,
        });

        // Clear from localStorage
        localStorage.removeItem('auth-storage');
      },

      setUser: (user) => set({ user, isAuthenticated: !!user }),

      setLoading: (loading) => set({ isLoading: loading }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
