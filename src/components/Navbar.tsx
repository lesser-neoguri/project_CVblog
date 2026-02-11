'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { signOut } from '@/lib/supabase';

const NAV = [
  { label: '블로그', path: '/posts' },
  { label: '프로젝트', path: '/projects' },
  { label: '논문 리뷰', path: '/papers' },
  { label: '설정', path: '/settings' },
];

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { isLightTheme, toggleTheme } = useTheme();
  const { user, loading } = useAuth();
  const [visible, setVisible] = useState(true);
  const [scrolled, setScrolled] = useState(false);
  const [mobile, setMobile] = useState(false);
  const last = useRef(0);
  const timer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => { setMobile(false); }, [pathname]);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 20);
      if (y > last.current && y > 80) setVisible(false);
      else if (y < last.current) setVisible(true);
      last.current = y;
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setVisible(true), 500);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => { window.removeEventListener('scroll', onScroll); if (timer.current) clearTimeout(timer.current); };
  }, []);

  const active = (p: string) => p === '/' ? pathname === '/' : pathname.startsWith(p);
  const authPath = pathname ? `/auth?redirect=${encodeURIComponent(pathname)}` : '/auth';

  const handleLogout = async () => {
    try {
      await signOut();
      router.push('/');
    } catch (err) {
      console.error('로그아웃 오류:', err);
    }
  };

  return (
    <>
      <nav
        className={`navbar ${visible ? 'visible' : 'hidden'}`}
        style={{
          background: scrolled
            ? isLightTheme ? 'rgba(255,255,255,0.92)' : 'rgba(0,0,0,0.92)'
            : 'transparent',
          backdropFilter: scrolled ? 'blur(12px)' : 'none',
          borderBottom: scrolled ? '1px solid var(--border)' : '1px solid transparent',
        }}
      >
        <div className="navbar-inner">
          <div className="navbar-logo" onClick={() => router.push('/')}>
            D.blog
          </div>

          <div className="navbar-links">
            {NAV.map(n => (
              <button key={n.path} className={`navbar-link ${active(n.path) ? 'active' : ''}`} onClick={() => router.push(n.path)}>
                {n.label}
              </button>
            ))}
          </div>

          <div className="navbar-actions">
            <button className="navbar-icon-btn" onClick={() => router.push('/search')} title="검색">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            </button>
            <button className="navbar-icon-btn" onClick={toggleTheme} title="테마">
              {isLightTheme ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
              )}
            </button>
            {!loading && !user && (
              <button
                className="btn-ghost auth-btn"
                onClick={() => router.push(authPath)}
                style={{ padding: '7px 14px', fontSize: '13px', marginLeft: '6px' }}
              >
                로그인
              </button>
            )}
            {!loading && user && (
              <>
                <button
                  className="btn-ghost auth-btn"
                  onClick={() => router.push('/profile/edit')}
                  style={{ padding: '7px 10px', fontSize: '12px', marginLeft: '6px' }}
                >
                  프로필
                </button>
                <button
                  className="btn-ghost auth-btn"
                  onClick={handleLogout}
                  style={{ padding: '7px 10px', fontSize: '12px', marginLeft: '4px' }}
                >
                  로그아웃
                </button>
              </>
            )}
            <button className="btn-primary" onClick={() => router.push('/write')} style={{ padding: '7px 18px', fontSize: '13px', marginLeft: '6px' }}>
              글쓰기
            </button>
            <button className="navbar-icon-btn mobile-menu-btn" onClick={() => setMobile(!mobile)} style={{ display: 'none' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                {mobile ? <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></> : <><line x1="4" y1="7" x2="20" y2="7"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="17" x2="20" y2="17"/></>}
              </svg>
            </button>
          </div>
        </div>
      </nav>

      {mobile && (
        <div className="mobile-menu">
          {NAV.map(n => (
            <button key={n.path} className={`navbar-link ${active(n.path) ? 'active' : ''}`} onClick={() => { router.push(n.path); setMobile(false); }}>
              {n.label}
            </button>
          ))}
          <div style={{ display: 'flex', gap: '8px', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
            <button className="navbar-link" style={{ flex: 1 }} onClick={() => { router.push('/search'); setMobile(false); }}>
              검색
            </button>
            {!loading && !user && (
              <button className="navbar-link" style={{ flex: 1 }} onClick={() => { router.push(authPath); setMobile(false); }}>
                로그인
              </button>
            )}
            {!loading && user && (
              <>
                <button
                  className="navbar-link"
                  style={{ flex: 1 }}
                  onClick={() => { router.push('/profile/edit'); setMobile(false); }}
                >
                  프로필
                </button>
                <button
                  className="navbar-link"
                  style={{ flex: 1 }}
                  onClick={async () => { await handleLogout(); setMobile(false); }}
                >
                  로그아웃
                </button>
              </>
            )}
            <button className="btn-primary" style={{ flex: 1, padding: '10px 16px', fontSize: '13px' }} onClick={() => { router.push('/write'); setMobile(false); }}>
              글쓰기
            </button>
          </div>
        </div>
      )}

      <style jsx global>{`
        @media (max-width: 768px) {
          .mobile-menu-btn { display: flex !important; }
          .navbar .btn-primary { display: none !important; }
          .navbar .auth-btn { display: none !important; }
        }
      `}</style>
    </>
  );
}
