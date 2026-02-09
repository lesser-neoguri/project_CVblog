'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import { getPaperReviewById, deletePaperReview, updatePaperReview } from '@/lib/papers';
import { getKnowledgeNodeById, getConnectedNodes, deleteKnowledgeNode } from '@/lib/knowledge';
import { PaperReview, KnowledgeNode, KnowledgeEdge } from '@/lib/supabase';
import Modal from '@/components/Modal';
import { useModal } from '@/hooks/useModal';

/* ═══════════════════════════════════════════════════════
   Shared helpers
   ═══════════════════════════════════════════════════════ */
function Stars({ rating }: { rating: number }) {
  return (
    <span style={{ display: 'inline-flex', gap: '2px' }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill={i < rating ? 'var(--accent)' : 'none'} stroke={i < rating ? 'var(--accent)' : 'var(--t4)'} strokeWidth="2">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </span>
  );
}

const TYPE_LABELS: Record<string, string> = { field: '분야', technology: '기술', concept: '개념', paper: '논문' };
const TYPE_COLORS: Record<string, string> = { field: 'rgba(245,158,11,0.15)', technology: 'rgba(59,130,246,0.15)', concept: 'rgba(20,184,166,0.15)', paper: 'rgba(167,139,250,0.15)' };
const TYPE_TEXT_COLORS: Record<string, string> = { field: '#f59e0b', technology: '#3b82f6', concept: '#14b8a6', paper: '#a78bfa' };
const REL_LABELS: Record<string, string> = { proposes: '제안', uses: '사용', extends: '확장', part_of: '분야', contains: '포함', related: '관련', solves: '해결', produces: '생성' };

interface ConnectedNodeInfo {
  node: KnowledgeNode;
  edge: KnowledgeEdge;
  relationship: string;
  direction: 'from' | 'to';
}

const fmtDate = (s: string) => {
  const d = new Date(s);
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
};

const readTime = (c: string) => `${Math.ceil(c.split(/\s+/).length / 200)}분`;

/* ═══════════════════════════════════════════════════════
   Paper Review Detail View
   ═══════════════════════════════════════════════════════ */
function PaperReviewDetail({
  review,
  onBack,
  onDelete,
  onPublish,
  isDeleting,
  isPublishing,
}: {
  review: PaperReview;
  onBack: () => void;
  onDelete: () => void;
  onPublish: () => void;
  isDeleting: boolean;
  isPublishing: boolean;
}) {
  const router = useRouter();
  return (
    <>
      <section style={{ padding: '80px 32px 0', maxWidth: 'var(--content-w)', margin: '0 auto' }}>
        {/* Navigation */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '48px' }}>
          <button className="btn-ghost" onClick={onBack} style={{ padding: '5px 14px', fontSize: '12px' }}>
            ← 목록
          </button>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button className="btn-ghost" onClick={() => router.push(`/papers/${review.id}/edit`)}
              style={{ padding: '5px 14px', fontSize: '12px' }}>
              수정
            </button>
            {!review.published && (
              <button className="btn-ghost" onClick={onPublish} disabled={isPublishing}
                style={{ padding: '5px 14px', fontSize: '12px', color: 'var(--accent)', borderColor: 'var(--accent-dim)', opacity: isPublishing ? .5 : 1 }}>
                {isPublishing ? '발행 중...' : '발행'}
              </button>
            )}
            <button className="btn-ghost" onClick={onDelete} disabled={isDeleting}
              style={{ padding: '5px 14px', fontSize: '12px', color: '#ef4444', borderColor: 'rgba(239,68,68,0.15)', opacity: isDeleting ? .5 : 1 }}>
              {isDeleting ? '삭제 중...' : '삭제'}
            </button>
          </div>
        </div>

        <header style={{ animation: 'fadeUp .6s cubic-bezier(0.16,1,0.3,1)' }}>
          {!review.published && (
            <span style={{ display: 'inline-block', padding: '2px 8px', fontSize: '11px', fontWeight: 600, background: 'rgba(234,179,8,0.1)', color: '#eab308', marginBottom: '14px' }}>
              비공개
            </span>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--accent)', padding: '3px 10px', background: 'var(--accent-dim)' }}>
              {review.venue}
            </span>
            <Stars rating={review.rating} />
          </div>
          <h1 style={{ fontSize: 'clamp(24px, 3.5vw, 36px)', fontWeight: 900, lineHeight: 1.3, letterSpacing: '-0.03em', marginBottom: '12px' }}>
            {review.title}
          </h1>
          <p style={{ fontSize: '15px', color: 'var(--t2)', marginBottom: '16px', lineHeight: 1.5 }}>
            {review.authors}
          </p>
          <div style={{ background: 'var(--bg-alt)', border: '1px solid var(--border)', padding: '16px 20px', marginBottom: '20px' }}>
            <span className="mono accent" style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.06em', display: 'block', marginBottom: '6px' }}>TL;DR</span>
            <p style={{ fontSize: '14px', color: 'var(--t2)', lineHeight: 1.6, margin: 0 }}>{review.tldr}</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span className="mono" style={{ fontSize: '12px', color: 'var(--t3)' }}>{fmtDate(review.created_at)}</span>
            <span style={{ color: 'var(--t4)' }}>·</span>
            <span className="mono" style={{ fontSize: '12px', color: 'var(--t3)' }}>{readTime(review.content)} 읽기</span>
            {review.paper_url && (
              <>
                <span style={{ color: 'var(--t4)' }}>·</span>
                <a href={review.paper_url} target="_blank" rel="noopener noreferrer"
                  style={{ fontSize: '12px', color: 'var(--accent)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  원문 보기
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                </a>
              </>
            )}
          </div>
          {review.tags && review.tags.length > 0 && (
            <div style={{ display: 'flex', gap: '4px', marginTop: '16px', flexWrap: 'wrap' }}>
              {review.tags.map(tag => (<span key={tag} className="tag">{tag}</span>))}
            </div>
          )}
        </header>
      </section>

      <div style={{ maxWidth: 'var(--content-w)', margin: '40px auto', padding: '0 32px' }}>
        <div style={{ borderTop: '1px solid var(--border)' }} />
      </div>

      <section style={{ padding: '0 32px 100px', maxWidth: 'var(--content-w)', margin: '0 auto' }}>
        <div className="markdown-content" style={{ animation: 'fadeIn .6s ease-out .1s backwards' }}>
          <MarkdownRenderer content={review.content} />
        </div>
      </section>

      <div style={{ borderTop: '1px solid var(--border)', padding: '24px 32px', maxWidth: 'var(--content-w)', margin: '0 auto' }}>
        <button className="btn-ghost" onClick={onBack} style={{ padding: '6px 16px', fontSize: '13px' }}>
          ← 전체 리뷰 보기
        </button>
      </div>
    </>
  );
}

/* ═══════════════════════════════════════════════════════
   Knowledge Node Detail View
   ═══════════════════════════════════════════════════════ */
function KnowledgeNodeDetail({
  node,
  connected,
  onBack,
  onDelete,
  isDeleting,
}: {
  node: KnowledgeNode;
  connected: ConnectedNodeInfo[];
  onBack: () => void;
  onDelete: () => void;
  isDeleting: boolean;
}) {
  const router = useRouter();
  return (
    <>
      <section style={{ padding: '80px 32px 0', maxWidth: 'var(--content-w)', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '48px' }}>
          <button className="btn-ghost" onClick={onBack} style={{ padding: '5px 14px', fontSize: '12px' }}>
            ← 목록
          </button>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button className="btn-ghost" onClick={() => router.push(`/papers/${node.id}/edit`)}
              style={{ padding: '5px 14px', fontSize: '12px' }}>
              수정
            </button>
            <button className="btn-ghost" onClick={onDelete} disabled={isDeleting}
              style={{ padding: '5px 14px', fontSize: '12px', color: '#ef4444', borderColor: 'rgba(239,68,68,0.15)', opacity: isDeleting ? .5 : 1 }}>
              {isDeleting ? '삭제 중...' : '삭제'}
            </button>
          </div>
        </div>

        <header style={{ animation: 'fadeUp .6s cubic-bezier(0.16,1,0.3,1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <span style={{
              display: 'inline-block', padding: '3px 12px', fontSize: '11px',
              fontFamily: 'var(--mono)', fontWeight: 700, letterSpacing: '0.06em',
              background: TYPE_COLORS[node.type] || 'rgba(255,255,255,0.1)',
              color: TYPE_TEXT_COLORS[node.type] || 'var(--t2)',
            }}>
              {TYPE_LABELS[node.type]?.toUpperCase() || node.type.toUpperCase()}
            </span>
            {node.color && (
              <span style={{ width: '12px', height: '12px', background: node.color, display: 'inline-block', border: '1px solid var(--border)' }} />
            )}
          </div>

          <h1 style={{ fontSize: 'clamp(24px, 3.5vw, 40px)', fontWeight: 900, lineHeight: 1.25, letterSpacing: '-0.03em', marginBottom: '12px' }}>
            {node.label}
          </h1>

          {node.type === 'paper' && typeof node.metadata?.venue === 'string' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--accent)', padding: '3px 10px', background: 'var(--accent-dim)' }}>
                {node.metadata.venue}
              </span>
              {typeof node.metadata?.authors === 'string' && (
                <span style={{ fontSize: '14px', color: 'var(--t2)' }}>{node.metadata.authors}</span>
              )}
            </div>
          )}

          {node.url && (
            <a href={node.url} target="_blank" rel="noopener noreferrer"
              style={{ fontSize: '12px', color: 'var(--accent)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px', marginBottom: '12px' }}>
              외부 링크
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            </a>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
            <span className="mono" style={{ fontSize: '12px', color: 'var(--t3)' }}>생성: {fmtDate(node.created_at)}</span>
            <span style={{ color: 'var(--t4)' }}>·</span>
            <span className="mono" style={{ fontSize: '12px', color: 'var(--t3)' }}>수정: {fmtDate(node.updated_at)}</span>
            <span style={{ color: 'var(--t4)' }}>·</span>
            <span className="mono" style={{ fontSize: '12px', color: 'var(--t3)' }}>{connected.length}개 연결</span>
          </div>
        </header>
      </section>

      <div style={{ maxWidth: 'var(--content-w)', margin: '40px auto', padding: '0 32px' }}>
        <div style={{ borderTop: '1px solid var(--border)' }} />
      </div>

      <section style={{ padding: '0 32px 40px', maxWidth: 'var(--content-w)', margin: '0 auto' }}>
        {node.description ? (
          <div className="markdown-content" style={{ animation: 'fadeIn .6s ease-out .1s backwards' }}>
            <MarkdownRenderer content={node.description} />
          </div>
        ) : (
          <p style={{ fontSize: '14px', color: 'var(--t3)', fontStyle: 'italic' }}>아직 설명이 작성되지 않았습니다.</p>
        )}
      </section>

      {connected.length > 0 && (
        <>
          <div style={{ maxWidth: 'var(--content-w)', margin: '0 auto', padding: '0 32px' }}>
            <div style={{ borderTop: '1px solid var(--border)' }} />
          </div>
          <section style={{ padding: '40px 32px 100px', maxWidth: 'var(--content-w)', margin: '0 auto' }}>
            <p className="mono" style={{ fontSize: '11px', fontWeight: 600, color: 'var(--t4)', letterSpacing: '0.08em', marginBottom: '24px' }}>
              CONNECTIONS ({connected.length})
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1px', background: 'var(--border)' }}>
              {connected.map((cn, i) => (
                <article key={`${cn.node.id}-${i}`}
                  onClick={() => router.push(`/papers/${cn.node.id}`)}
                  style={{ padding: '20px', background: 'var(--bg)', cursor: 'pointer', transition: 'background .15s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-hover)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg)'; }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <span style={{ width: '8px', height: '8px', background: cn.node.color || 'var(--t3)', flexShrink: 0 }} />
                    <span style={{ fontSize: '10px', fontFamily: 'var(--mono)', color: TYPE_TEXT_COLORS[cn.node.type] || 'var(--t3)', fontWeight: 600 }}>
                      {TYPE_LABELS[cn.node.type] || cn.node.type}
                    </span>
                    <span style={{ fontSize: '10px', color: 'var(--t4)', fontFamily: 'var(--mono)' }}>
                      {cn.direction === 'from' ? `→ ${REL_LABELS[cn.relationship] || cn.relationship}` : `← ${REL_LABELS[cn.relationship] || cn.relationship}`}
                    </span>
                  </div>
                  <h3 style={{ fontSize: '15px', fontWeight: 700, lineHeight: 1.4, letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {cn.node.label}
                  </h3>
                  {cn.node.description && (
                    <p style={{ fontSize: '12px', color: 'var(--t3)', lineHeight: 1.5, marginTop: '6px', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                      {cn.node.description.replace(/[#*`\[\]]/g, '').slice(0, 120)}
                    </p>
                  )}
                </article>
              ))}
            </div>
          </section>
        </>
      )}

      {connected.length === 0 && (
        <div style={{ borderTop: '1px solid var(--border)', padding: '24px 32px', maxWidth: 'var(--content-w)', margin: '0 auto' }}>
          <button className="btn-ghost" onClick={onBack} style={{ padding: '6px 16px', fontSize: '13px' }}>← 돌아가기</button>
        </div>
      )}
    </>
  );
}

/* ═══════════════════════════════════════════════════════
   Main Page — tries paper_review first, then knowledge_node
   ═══════════════════════════════════════════════════════ */
export default function PaperDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { modalState, showAlert, showConfirm, closeModal } = useModal();

  const [review, setReview] = useState<PaperReview | null>(null);
  const [node, setNode] = useState<KnowledgeNode | null>(null);
  const [connected, setConnected] = useState<ConnectedNodeInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  useEffect(() => {
    if (params.id) loadData(params.id as string);
  }, [params.id]);

  const loadData = async (id: string) => {
    setLoading(true);
    setError('');

    // 1) paper_review 시도
    try {
      const r = await getPaperReviewById(id);
      setReview(r);
      setLoading(false);
      return;
    } catch {
      // not found as paper review — try knowledge node
    }

    // 2) knowledge_node 시도
    try {
      const [nodeData, connData] = await Promise.all([
        getKnowledgeNodeById(id),
        getConnectedNodes(id),
      ]);
      setNode(nodeData);

      const info: ConnectedNodeInfo[] = connData.edges.map(edge => {
        const isSource = edge.source_id === id;
        const connectedId = isSource ? edge.target_id : edge.source_id;
        const connNode = connData.nodes.find(n => n.id === connectedId);
        if (!connNode) return null;
        return { node: connNode, edge, relationship: edge.relationship || 'related', direction: isSource ? 'from' : 'to' } as ConnectedNodeInfo;
      }).filter(Boolean) as ConnectedNodeInfo[];

      const typeOrder = { field: 0, technology: 1, concept: 2, paper: 3 };
      info.sort((a, b) => (typeOrder[a.node.type as keyof typeof typeOrder] ?? 4) - (typeOrder[b.node.type as keyof typeof typeOrder] ?? 4));
      setConnected(info);
    } catch (err: unknown) {
      console.error('로딩 오류:', err);
      setError('해당 콘텐츠를 찾을 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReview = async () => {
    if (!review) return;
    showConfirm('정말로 이 리뷰를 삭제하시겠습니까?', async () => {
      setIsDeleting(true);
      try { await deletePaperReview(review.id); showAlert('리뷰가 삭제되었습니다.'); setTimeout(() => router.push('/papers'), 1000); }
      catch { showAlert('리뷰 삭제 중 오류가 발생했습니다.'); }
      finally { setIsDeleting(false); }
    }, '리뷰 삭제');
  };

  const handlePublish = async () => {
    if (!review) return;
    showConfirm('이 리뷰를 발행하시겠습니까?', async () => {
      setIsPublishing(true);
      try { setReview(await updatePaperReview(review.id, { published: true })); showAlert('리뷰가 발행되었습니다!'); }
      catch { showAlert('리뷰 발행 중 오류가 발생했습니다.'); }
      finally { setIsPublishing(false); }
    });
  };

  const handleDeleteNode = async () => {
    if (!node) return;
    showConfirm(`"${node.label}" 노드를 삭제하시겠습니까?`, async () => {
      setIsDeleting(true);
      try { await deleteKnowledgeNode(node.id); showAlert('노드가 삭제되었습니다.'); setTimeout(() => router.push('/papers'), 1000); }
      catch { showAlert('노드 삭제 중 오류가 발생했습니다.'); }
      finally { setIsDeleting(false); }
    }, '노드 삭제');
  };

  if (loading) {
    return (
      <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span className="mono" style={{ fontSize: '13px', color: 'var(--t3)' }}>loading...</span>
      </main>
    );
  }

  if (error || (!review && !node)) {
    return (
      <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 32px' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '14px', color: '#ef4444', marginBottom: '20px' }}>{error || '콘텐츠를 찾을 수 없습니다.'}</p>
          <button className="btn-ghost" onClick={() => router.push('/papers')}>목록으로</button>
        </div>
      </main>
    );
  }

  return (
    <main style={{ minHeight: '100vh' }}>
      {review ? (
        <PaperReviewDetail
          review={review}
          onBack={() => router.push('/papers')}
          onDelete={handleDeleteReview}
          onPublish={handlePublish}
          isDeleting={isDeleting}
          isPublishing={isPublishing}
        />
      ) : node ? (
        <KnowledgeNodeDetail
          node={node}
          connected={connected}
          onBack={() => router.push('/papers')}
          onDelete={handleDeleteNode}
          isDeleting={isDeleting}
        />
      ) : null}

      <Modal isOpen={modalState.isOpen} onClose={closeModal} onConfirm={modalState.onConfirm} title={modalState.title} message={modalState.message} type={modalState.type} />
    </main>
  );
}
