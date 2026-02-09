'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { searchAll, toSearchResults, type SearchResult } from '@/lib/search';

type TabType = 'all' | 'post' | 'paper' | 'node';

const TAB_LABELS: Record<TabType, string> = {
  all: '전체',
  post: '블로그',
  paper: '논문 리뷰',
  node: '지식 노드',
};

export default function SearchPage() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('all');

  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 100); }, []);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setHasSearched(false);
      return;
    }
    const timer = setTimeout(() => runSearch(query.trim()), 300);
    return () => clearTimeout(timer);
  }, [query]);

  const runSearch = async (q: string) => {
    setLoading(true);
    setHasSearched(true);
    try {
      const { posts, papers, nodes } = await searchAll(q);
      const all = toSearchResults(posts, papers, nodes);
      setResults(all);
    } catch (err) {
      console.error('검색 오류:', err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const fmtDate = (s: string) => {
    const d = new Date(s);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
  };

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') router.back();
  }, [router]);

  const filtered = activeTab === 'all'
    ? results
    : results.filter((r) => r.type === activeTab);

  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: '6px 14px',
    fontSize: '12px',
    fontWeight: 500,
    fontFamily: 'var(--mono)',
    background: active ? 'var(--t1)' : 'transparent',
    color: active ? 'var(--bg)' : 'var(--t3)',
    border: '1px solid var(--border)',
    cursor: 'pointer',
    transition: 'all .15s',
  });

  return (
    <main>
      {/* Header */}
      <section style={{ padding: 'clamp(60px, 12vw, 80px) clamp(20px, 5vw, 32px) 0' }}>
        <div style={{ maxWidth: 'var(--content-w)', margin: '0 auto' }}>
          <p className="mono accent" style={{ fontSize: '12px', fontWeight: 500, letterSpacing: '0.08em', marginBottom: '12px' }}>SEARCH</p>
          <h1 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1.2, marginBottom: '32px' }}>
            검색
          </h1>

          {/* Input */}
          <div style={{ position: 'relative', marginBottom: '8px' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--t4)', pointerEvents: 'none' }}>
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="블로그, 논문 리뷰, 지식 노드에서 검색"
              style={{
                width: '100%',
                padding: '12px 38px 12px 42px',
                fontSize: '15px',
                fontFamily: 'var(--font)',
                background: 'var(--bg-alt)',
                border: '1px solid var(--border)',
                color: 'var(--t1)',
                outline: 'none',
                transition: 'border-color .15s',
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--t3)'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; }}
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--t4)', cursor: 'pointer', padding: '2px', display: 'flex' }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            )}
          </div>
          <p className="mono" style={{ fontSize: '11px', color: 'var(--t4)', marginBottom: '24px' }}>ESC 돌아가기</p>

          {/* Tabs */}
          {hasSearched && results.length > 0 && (
            <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', flexWrap: 'wrap' }}>
              {(['all', 'post', 'paper', 'node'] as TabType[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={tabStyle(activeTab === tab)}
                >
                  {TAB_LABELS[tab]}
                  {tab !== 'all' && (
                    <span style={{ marginLeft: '4px', opacity: 0.8 }}>
                      ({results.filter((r) => r.type === tab).length})
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Results */}
      <section style={{ padding: '0 clamp(20px, 5vw, 32px) clamp(80px, 15vw, 120px)' }}>
        <div style={{ maxWidth: 'var(--content-w)', margin: '0 auto' }}>
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} style={{ padding: '24px 0', borderBottom: '1px solid var(--border)', height: '80px', animation: 'pulse 2s infinite', animationDelay: `${i * 0.1}s` }} />
            ))
          ) : hasSearched && filtered.length === 0 ? (
            <div style={{ padding: '80px 0', textAlign: 'center' }}>
              <p style={{ fontSize: '14px', color: 'var(--t3)' }}>
                &ldquo;{query}&rdquo;에 대한 {activeTab === 'all' ? '' : `"${TAB_LABELS[activeTab]}" 카테고리 `}결과가 없습니다
              </p>
            </div>
          ) : (
            <>
              {hasSearched && filtered.length > 0 && (
                <p className="mono" style={{ fontSize: '12px', color: 'var(--t4)', marginBottom: '16px' }}>
                  {filtered.length}건
                </p>
              )}
              {filtered.map((item, i) => (
                <article
                  key={`${item.type}-${item.id}`}
                  onClick={() => router.push(item.path)}
                  style={{
                    padding: '20px 0',
                    borderBottom: '1px solid var(--border)',
                    cursor: 'pointer',
                    transition: 'background .15s',
                    animation: `fadeIn .3s ease-out ${i * 0.03}s backwards`,
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-hover)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span
                      className="tag"
                      style={{
                        fontSize: '10px',
                        padding: '1px 6px',
                        background: item.type === 'post' ? 'var(--accent-dim)' : item.type === 'paper' ? 'rgba(167,139,250,0.15)' : 'rgba(59,130,246,0.15)',
                        color: item.type === 'post' ? 'var(--accent)' : item.type === 'paper' ? '#a78bfa' : '#3b82f6',
                      }}
                    >
                      {item.type === 'post' ? '블로그' : item.type === 'paper' ? '논문' : '지식'}
                    </span>
                    {item.meta && (
                      <span className="mono" style={{ fontSize: '11px', color: 'var(--t4)' }}>{item.meta}</span>
                    )}
                  </div>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, letterSpacing: '-0.01em', marginBottom: '4px' }}>
                    {item.title}
                  </h3>
                  {item.subtitle && (
                    <p style={{ fontSize: '12px', color: 'var(--t4)', marginBottom: '4px' }}>{item.subtitle}</p>
                  )}
                  <p style={{ fontSize: '13px', color: 'var(--t3)', lineHeight: 1.5 }}>{item.excerpt}</p>
                  <span className="mono" style={{ fontSize: '11px', color: 'var(--t4)', display: 'block', marginTop: '6px' }}>
                    {fmtDate(item.createdAt)}
                  </span>
                </article>
              ))}
            </>
          )}
        </div>
      </section>
    </main>
  );
}
