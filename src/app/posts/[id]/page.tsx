'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import { getPostById, deletePost } from '@/lib/posts';
import { Post } from '@/lib/supabase';
import Modal from '@/components/Modal';
import { useModal } from '@/hooks/useModal';

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { modalState, showAlert, showConfirm, closeModal } = useModal();

  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  useEffect(() => {
    if (params.id) loadPost(params.id as string);
  }, [params.id]);

  const loadPost = async (id: string) => {
    setLoading(true); setError('');
    try { setPost(await getPostById(id)); }
    catch (err: unknown) { console.error('글 로딩 오류:', err); setError('글을 불러오는데 실패했습니다.'); }
    finally { setLoading(false); }
  };

  const handleDelete = async () => {
    if (!post) return;
    showConfirm('정말로 이 글을 삭제하시겠습니까?', async () => {
      setIsDeleting(true);
      try { await deletePost(post.id); showAlert('글이 삭제되었습니다.'); setTimeout(() => router.push('/posts'), 1000); }
      catch (err: unknown) { console.error('삭제 오류:', err); showAlert('글 삭제 중 오류가 발생했습니다.'); }
      finally { setIsDeleting(false); }
    }, '글 삭제');
  };

  const handlePublish = async () => {
    if (!post) return;
    showConfirm('이 글을 발행하시겠습니까?', async () => {
      setIsPublishing(true);
      try { const { updatePost } = await import('@/lib/posts'); setPost(await updatePost(post.id, { published: true })); showAlert('글이 발행되었습니다!'); }
      catch (err: unknown) { console.error('발행 오류:', err); showAlert('글 발행 중 오류가 발생했습니다.'); }
      finally { setIsPublishing(false); }
    });
  };

  const fmtDate = (s: string) => {
    const d = new Date(s);
    return `${d.getFullYear()}년 ${d.getMonth()+1}월 ${d.getDate()}일`;
  };

  const readTime = (c: string) => `${Math.ceil(c.split(/\s+/).length / 200)}분`;

  if (loading) {
    return (
      <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span className="mono" style={{ fontSize: '13px', color: 'var(--t3)' }}>loading...</span>
      </main>
    );
  }

  if (error || !post) {
    return (
      <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 32px' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '14px', color: '#ef4444', marginBottom: '20px' }}>{error || '글을 찾을 수 없습니다.'}</p>
          <button className="btn-ghost" onClick={() => router.push('/posts')}>목록으로</button>
        </div>
      </main>
    );
  }

  return (
    <main style={{ minHeight: '100vh' }}>
      {/* Header */}
      <section style={{ padding: '80px 32px 0', maxWidth: 'var(--content-w)', margin: '0 auto' }}>
        {/* Navigation */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '48px' }}>
          <button className="btn-ghost" onClick={() => router.push('/posts')} style={{ padding: '5px 14px', fontSize: '12px' }}>
            ← 목록
          </button>
          <div style={{ display: 'flex', gap: '6px' }}>
            {!post.published && (
              <button className="btn-ghost" onClick={handlePublish} disabled={isPublishing}
                style={{ padding: '5px 14px', fontSize: '12px', color: 'var(--accent)', borderColor: 'var(--accent-dim)', opacity: isPublishing ? .5 : 1 }}>
                {isPublishing ? '발행 중...' : '발행'}
              </button>
            )}
            <button className="btn-ghost" onClick={() => router.push(`/posts/${post.id}/edit`)} style={{ padding: '5px 14px', fontSize: '12px' }}>수정</button>
            <button className="btn-ghost" onClick={handleDelete} disabled={isDeleting}
              style={{ padding: '5px 14px', fontSize: '12px', color: '#ef4444', borderColor: 'rgba(239,68,68,0.15)', opacity: isDeleting ? .5 : 1 }}>
              {isDeleting ? '삭제 중...' : '삭제'}
            </button>
          </div>
        </div>

        {/* Title & Meta */}
        <header style={{ animation: 'fadeUp .6s cubic-bezier(0.16,1,0.3,1)' }}>
          {!post.published && (
            <span style={{ display: 'inline-block', padding: '2px 8px', fontSize: '11px', fontWeight: 600, background: 'rgba(234,179,8,0.1)', color: '#eab308', marginBottom: '14px' }}>
              비공개
            </span>
          )}
          <h1 style={{ fontSize: 'clamp(26px, 4vw, 40px)', fontWeight: 900, lineHeight: 1.3, letterSpacing: '-0.03em', marginBottom: '20px' }}>
            {post.title}
          </h1>
          <div className="mono" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--t3)' }}>
            <span>{fmtDate(post.created_at)}</span>
            <span style={{ color: 'var(--t4)' }}>·</span>
            <span>{readTime(post.content)} 읽기</span>
            {post.updated_at !== post.created_at && (<><span style={{ color: 'var(--t4)' }}>·</span><span>수정됨</span></>)}
          </div>
        </header>
      </section>

      {/* Divider */}
      <div style={{ maxWidth: 'var(--content-w)', margin: '40px auto', padding: '0 32px' }}>
        <div style={{ borderTop: '1px solid var(--border)' }} />
      </div>

      {/* Content */}
      <section style={{ padding: '0 32px 100px', maxWidth: 'var(--content-w)', margin: '0 auto' }}>
        <div className="markdown-content" style={{ animation: 'fadeIn .6s ease-out .1s backwards' }}>
          <MarkdownRenderer content={post.content} />
        </div>
      </section>

      {/* Bottom */}
      <div style={{ borderTop: '1px solid var(--border)', padding: '24px 32px', maxWidth: 'var(--content-w)', margin: '0 auto' }}>
        <button className="btn-ghost" onClick={() => router.push('/posts')} style={{ padding: '6px 16px', fontSize: '13px' }}>
          ← 전체 글 보기
        </button>
      </div>

      <Modal isOpen={modalState.isOpen} onClose={closeModal} onConfirm={modalState.onConfirm} title={modalState.title} message={modalState.message} type={modalState.type} />
    </main>
  );
}
