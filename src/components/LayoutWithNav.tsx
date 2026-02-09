'use client';

import { usePathname } from 'next/navigation';
import Navbar from '@/components/Navbar';

export default function LayoutWithNav({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isDemo = pathname?.startsWith('/demo') ?? false;

  if (isDemo) {
    return <>{children}</>;
  }

  return (
    <>
      <Navbar />
      <div style={{ paddingTop: 'var(--nav-h)' }}>
        {children}
      </div>
    </>
  );
}
