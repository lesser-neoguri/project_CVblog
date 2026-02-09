'use client';

import { usePathname } from 'next/navigation';

export default function PapersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isListPage = pathname === '/papers';

  // 논문 목록 페이지만 뷰포트에 고정 (write, [id] 등은 스크롤 가능)
  if (!isListPage) {
    return <>{children}</>;
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 'var(--nav-h)',
        left: 0,
        right: 0,
        bottom: 0,
        height: 'calc(100dvh - var(--nav-h))',
        maxHeight: 'calc(100svh - var(--nav-h))',
        overflow: 'hidden',
        width: '100%',
        maxWidth: '100vw',
        zIndex: 0,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {children}
    </div>
  );
}
