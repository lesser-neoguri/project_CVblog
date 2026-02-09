import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// 사용자 인터페이스
interface User {
  id: string;
  email: string;
  username?: string;
}

// 전역 상태 인터페이스
interface GlobalState {
  // 사용자 상태
  user: User | null;
  setUser: (user: User | null) => void;
  
  // 프로필 ID
  currentProfileId: string | null;
  setCurrentProfileId: (id: string | null) => void;
  
  // 테마 (ThemeContext와 통합 가능)
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  
  // 검색 상태
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  
  // 필터 상태
  showPublishedOnly: boolean;
  setShowPublishedOnly: (show: boolean) => void;
}

// Zustand 스토어 생성
export const useGlobalStore = create<GlobalState>()(
  persist(
    (set) => ({
      // 초기 상태
      user: null,
      currentProfileId: null,
      theme: 'dark',
      searchQuery: '',
      showPublishedOnly: true,
      
      // 액션
      setUser: (user) => set({ user }),
      setCurrentProfileId: (id) => set({ currentProfileId: id }),
      toggleTheme: () => set((state) => ({ 
        theme: state.theme === 'light' ? 'dark' : 'light' 
      })),
      setSearchQuery: (query) => set({ searchQuery: query }),
      setShowPublishedOnly: (show) => set({ showPublishedOnly: show }),
    }),
    {
      name: 'cv-blog-storage', // localStorage 키
      partialize: (state) => ({
        currentProfileId: state.currentProfileId,
        theme: state.theme,
        showPublishedOnly: state.showPublishedOnly,
      }),
    }
  )
);
