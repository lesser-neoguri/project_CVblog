'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useTheme } from '@/contexts/ThemeContext';

// 네비게이션 아이콘 정의
const NAV_ICONS = [
  { id: 'message', svg: <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/> },
  { id: 'search', svg: <><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></> },
  { id: 'home', svg: <><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/></> },
  { id: 'profile', svg: <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></> },
  { id: 'settings', svg: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></> }
];

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { isLightTheme, toggleTheme } = useTheme();
  const [showOptions, setShowOptions] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [isNavExpanded, setIsNavExpanded] = useState(false);
  const [isNavVisible, setIsNavVisible] = useState(true);
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [centerIndex, setCenterIndex] = useState<number>(2); // 기본값: 홈 (인덱스 2)
  const [ignoreHover, setIgnoreHover] = useState(false); // 호버 무시 플래그
  const lastScrollY = useRef(0);
  const lastScrollTime = useRef(Date.now());
  const scrollTimeout = useRef<NodeJS.Timeout | null>(null);

  // 아이콘을 재배열하는 함수
  const getReorderedIcons = () => {
    const icons = [...NAV_ICONS];
    const offset = centerIndex - 2; // 중앙(인덱스 2)과의 차이
    
    if (offset === 0) return icons;
    
    // 선택된 아이콘을 중앙으로 이동
    const reordered = [];
    for (let i = 0; i < icons.length; i++) {
      const newIndex = (i - offset + icons.length) % icons.length;
      reordered[newIndex] = icons[i];
    }
    
    return reordered;
  };

  // 아이콘 클릭 핸들러
  const handleIconClick = (index: number, iconId: string) => {
    setCenterIndex(index);
    
    // 모든 아이콘 클릭 시 마우스를 뗀 것처럼 축소
    setIsNavExpanded(false);
    setIgnoreHover(true);
    
    // 각 아이콘별 동작
    switch(iconId) {
      case 'home':
        router.push('/');
        break;
      case 'search':
        setIsSearchMode(true);
        setTimeout(() => {
          router.push('/search');
        }, 1500);
        break;
      case 'settings':
        toggleOptions();
        break;
      case 'message':
        toggleChat();
        break;
      case 'profile':
        // 아직 미구현
        break;
    }
  };

  const toggleOptions = () => {
    const newShowOptions = !showOptions;
    setShowOptions(newShowOptions);
    
    // 옵션바를 열 때는 챗바를 닫고 네비바를 축소 상태로
    if (newShowOptions) {
      setShowChat(false);
      setIsNavExpanded(false);
      setIgnoreHover(true);
    } else {
      // 옵션바를 닫으면 호버 기능 복구
      setIgnoreHover(false);
    }
  };

  const toggleChat = () => {
    const newShowChat = !showChat;
    setShowChat(newShowChat);
    
    // 챗바를 열 때는 옵션바를 닫고 네비바를 축소 상태로
    if (newShowChat) {
      setShowOptions(false);
      setIsNavExpanded(false);
      setIgnoreHover(true);
    } else {
      // 챗바를 닫으면 호버 기능 복구
      setIgnoreHover(false);
    }
  };

  const toggleSearchMode = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    setIsSearchMode(true);
    
    // 애니메이션이 끝난 후 바로 검색 페이지로 이동 (1.5초 = 애니메이션 duration)
    setTimeout(() => {
      router.push('/search');
    }, 1500);
  };

  const handleNavMouseEnter = () => {
    // 옵션바나 챗바가 열려있거나 호버 무시 플래그가 설정되어 있으면 확장하지 않음
    if (!ignoreHover && !showOptions && !showChat) {
      setIsNavExpanded(true);
    }
  };

  const handleNavMouseLeave = () => {
    setIsNavExpanded(false);
    // 옵션바나 챗바가 열려있지 않을 때만 호버 무시 플래그 해제
    if (!showOptions && !showChat) {
      setIgnoreHover(false);
    }
  };


  // 페이지 변경 시 상태 리셋
  useEffect(() => {
    setIsSearchMode(false);
    setIsNavExpanded(false);
    setShowOptions(false);
    setShowChat(false);
    setIgnoreHover(false);
    
    // 홈 페이지로 돌아가면 중앙을 홈으로 리셋
    if (pathname === '/') {
      setCenterIndex(2);
    }
  }, [pathname]);

  useEffect(() => {
    let isScrolling = false;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const currentTime = Date.now();
      
      // 스크롤 속도 계산
      const scrollDelta = Math.abs(currentScrollY - lastScrollY.current);
      const timeDelta = currentTime - lastScrollTime.current;
      const scrollSpeed = scrollDelta / timeDelta;

      // 스크롤 방향 감지
      if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
        // 아래로 스크롤 중이고, 100px 이상 스크롤했을 때 숨김
        if (!isScrolling) {
          isScrolling = true;
        }
        setIsNavVisible(false);
      } else if (currentScrollY < lastScrollY.current) {
        // 위로 스크롤 시 즉시 표시
        setIsNavVisible(true);
      }

      lastScrollY.current = currentScrollY;
      lastScrollTime.current = currentTime;

      // 스크롤이 멈추면 자연스럽게 다시 표시 (관성 스크롤 고려)
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }

      // 스크롤 속도에 따라 대기 시간 조정 (빠를수록 더 오래 대기)
      const delay = scrollSpeed > 2 ? 600 : scrollSpeed > 1 ? 500 : 400;

      scrollTimeout.current = setTimeout(() => {
        isScrolling = false;
        setIsNavVisible(true);
      }, delay);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }
    };
  }, []);

  return (
    <>
      {/* SVG 필터 정의 */}
      <svg width="0" height="0" style={{ position: 'absolute' }}>
        <defs>
          <filter id="glass-distortion" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="2"/>
            <feColorMatrix values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1 0"/>
            <feTurbulence baseFrequency="0.02" numOctaves="3" result="noise"/>
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="3"/>
          </filter>
        </defs>
      </svg>

      {/* 중앙 하단 네비게이션 바 */}
      <nav className={`glass-navbar ${isNavVisible ? 'visible' : 'hidden'} ${showOptions || showChat ? 'options-mode' : ''}`} onMouseEnter={handleNavMouseEnter} onMouseLeave={handleNavMouseLeave}>
        <div className={`liquidGlass-wrapper dock ${isNavExpanded ? 'expanded' : ''}`}>
          <div className="liquidGlass-effect"></div>
          <div className="liquidGlass-tint"></div>
          <div className="liquidGlass-shine"></div>
          
          {/* 동적으로 재배열된 아이콘들 렌더링 */}
          {getReorderedIcons().map((icon, visualIndex) => {
            const originalIndex = NAV_ICONS.findIndex(i => i.id === icon.id);
            const isCenterIcon = originalIndex === centerIndex;
            
            return (
              <div 
                key={icon.id}
                className={`nav-item ${isCenterIcon ? 'center-icon' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleIconClick(originalIndex, icon.id);
                }}
                style={{
                  transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  order: visualIndex,
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  {icon.svg}
                </svg>
              </div>
            );
          })}
        </div>
      </nav>

      {/* 옵션 바 - 오른쪽에 배치 (챗/설정에 따라 다른 아이콘 표시) */}
      <div 
        className={`liquidGlass-wrapper dock options-bar ${showOptions || showChat ? 'show' : ''}`}
        onMouseLeave={() => {
          setShowOptions(false);
          setShowChat(false);
          setIsNavExpanded(false);
        }}
      >
        <div className="liquidGlass-effect"></div>
        <div className="liquidGlass-tint"></div>
        <div className="liquidGlass-shine"></div>
        
        {/* 챗 모드일 때: 번개 아이콘 */}
        {showChat && (
          <div className="nav-item" onClick={() => window.open('mailto:your-email@example.com', '_blank')}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
            </svg>
          </div>
        )}
        
        {/* 설정 모드일 때: 테마 변경 아이콘 */}
        {showOptions && (
          <div className="nav-item" onClick={toggleTheme}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="5"/>
              <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
            </svg>
          </div>
        )}
      </div>

      {/* 검색 모드 비네팅 오버레이 */}
      {isSearchMode && (
        <div className={`search-vignette-overlay ${isLightTheme ? 'light-mode' : 'dark-mode'}`}>
        </div>
      )}
    </>
  );
}

