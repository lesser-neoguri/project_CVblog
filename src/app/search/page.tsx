'use client';

import { useState, useEffect } from 'react';
import { useTheme } from '@/contexts/ThemeContext';

export default function SearchPage() {
  const { isLightTheme } = useTheme();
  const [animationComplete, setAnimationComplete] = useState(false);

  useEffect(() => {
    // 애니메이션 완료 후 플래그 설정 (1.5초 애니메이션)
    const timer = setTimeout(() => {
      setAnimationComplete(true);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={`search-page ${isLightTheme ? 'light' : 'dark'}`}>
      {/* 테마에 따른 배경 */}
      
      {/* 원형 스프라이트 오버레이 - 중앙에서 축소되며 검색 페이지 노출 */}
      <div className={`search-iris-in-overlay ${animationComplete ? 'complete' : ''}`}></div>
      
      {/* 검색 페이지 콘텐츠 영역 */}
      <div className="search-content">
        {/* 추후 검색 요소 추가 */}
      </div>
    </div>
  );
}

