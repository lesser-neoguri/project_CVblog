'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChange } from '@/lib/supabase';
import { useGlobalStore } from '@/lib/store';

interface AuthContextType {
  user: { id: string; email: string } | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const setGlobalUser = useGlobalStore((state) => state.setUser);

  useEffect(() => {
    // Auth 상태 변화 리스너
    const subscription = onAuthStateChange((authUser) => {
      if (authUser && typeof authUser === 'object' && 'id' in authUser && 'email' in authUser) {
        const userData = {
          id: authUser.id as string,
          email: authUser.email as string,
        };
        setUser(userData);
        setGlobalUser(userData);
      } else {
        setUser(null);
        setGlobalUser(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [setGlobalUser]);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
