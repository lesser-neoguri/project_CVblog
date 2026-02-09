'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getPosts } from '@/lib/posts';
import { Post } from '@/lib/supabase';
import Modal from '@/components/Modal';
import { useModal } from '@/hooks/useModal';

export default function PostsPage() {
  const router = useRouter();
  const { modalState, showAlert, showConfirm, closeModal } = useModal();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAll, setShowAll] = useState(false);

  useEffect(() => { loadPosts(); }, [showAll]);

  const loadPosts = async () => {
    setLoading(true); setError('');
    try { setPosts(await getPosts(!showAll)); }
    catch { setError('글 목록을 불러오는데 실패했습니다.'); }
    finally { setLoading(false); }
  };

  const fmtDate = (s: string) => {
    const d = new Date(s);
    return `${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,'0')}.${String(d.getDate()).padStart(2,'0')}`;
  };

  const readTime = (c: string) => `${Math.ceil(c.split(/\s+/).length / 200)}분`;

  const excerpt = (c: string) => {
    const t = c.replace(/#{1,6}\s/g,'').replace(/\*\*|__|[*_`]/g,'').replace(/\[([^\]]*)\]\([^)]*\)/g,'$1').replace(/!\[.*?\]\(.*?\)/g,'').replace(/\n/g,' ').trim();
    return t.length <= 120 ? t : t.slice(0,120)+'…';
  };

  const handlePublish = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    showConfirm('발행하시겠습니까?', async () => {
      try { const { updatePost } = await import('@/lib/posts'); await updatePost(id, { published: true }); await loadPosts(); showAlert('발행 완료'); }
      catch { showAlert('발행 중 오류'); }
    });
  };

  return (
    <main>
      {/* Header */}
      <section style={{ padding: '80px 32px 60px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ maxWidth: 'var(--content-w)', margin: '0 auto' }}>
          <p className="mono accent" style={{ fontSize: '12px', fontWeight: 500, letterSpacing: '0.08em', marginBottom: '12px' }}>BLOG</p>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '16px', flexWrap: 'wrap' }}>
            <div>
              <h1 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1.2, marginBottom: '8px' }}>
                포스트
              </h1>
              <p style={{ fontSize: '14px', color: 'var(--t3)' }}>총 {posts.length}개의 글</p>
            </div>
            <button className="btn-ghost" onClick={() => setShowAll(!showAll)} style={{ padding: '6px 14px', fontSize: '12px' }}>
              {showAll ? '발행된 글만' : '전체 글'}
            </button>
          </div>
        </div>
      </section>

      {/* List */}
      <section style={{ padding: '0 32px 120px' }}>
        <div style={{ maxWidth: 'var(--content-w)', margin: '0 auto' }}>
          {loading ? (
            Array.from({length:5}).map((_,i) => (
              <div key={i} style={{ padding: '32px 0', borderBottom: '1px solid var(--border)', height: '100px', animation: 'pulse 2s infinite', animationDelay: `${i*.1}s` }} />
            ))
          ) : error ? (
            <div style={{ padding: '24px 0', color: '#ef4444', fontSize: '14px' }}>{error}</div>
          ) : posts.length === 0 ? (
            <div style={{ padding: '120px 0', textAlign: 'center' }}>
              <p style={{ color: 'var(--t3)', fontSize: '15px', marginBottom: '24px' }}>아직 글이 없습니다</p>
              <button className="btn-primary" onClick={() => router.push('/write')}>작성하기</button>
            </div>
          ) : posts.map((post, i) => (
            <article
              key={post.id}
              onClick={() => router.push(`/posts/${post.id}`)}
              style={{
                padding: '28px 0',
                borderBottom: '1px solid var(--border)',
                cursor: 'pointer',
                transition: 'background .15s',
                animation: `fadeIn .4s ease-out ${i*.03}s backwards`,
              }}
              onMouseEnter={e=>{e.currentTarget.style.background='var(--bg-hover)';}}
              onMouseLeave={e=>{e.currentTarget.style.background='transparent';}}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span className="mono" style={{ fontSize: '12px', color: 'var(--t4)' }}>{fmtDate(post.created_at)}</span>
                <span style={{ color: 'var(--t4)', fontSize: '12px' }}>·</span>
                <span className="mono" style={{ fontSize: '12px', color: 'var(--t4)' }}>{readTime(post.content)} 읽기</span>
                {!post.published && <span style={{ fontSize: '11px', fontWeight: 600, color: '#eab308', marginLeft: '4px' }}>비공개</span>}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 700, letterSpacing: '-0.01em', lineHeight: 1.4, flex: 1 }}>{post.title}</h2>
                {!post.published && (
                  <button className="btn-ghost" onClick={e=>handlePublish(e,post.id)} style={{ padding: '3px 10px', fontSize: '11px', color: 'var(--accent)', borderColor: 'var(--accent-dim)', flexShrink: 0 }}>
                    발행
                  </button>
                )}
              </div>
              <p style={{ fontSize: '14px', color: 'var(--t3)', lineHeight: 1.6, marginTop: '6px' }}>{excerpt(post.content)}</p>
            </article>
          ))}
        </div>
      </section>

      <Modal isOpen={modalState.isOpen} onClose={closeModal} onConfirm={modalState.onConfirm} title={modalState.title} message={modalState.message} type={modalState.type} />
    </main>
  );
}
