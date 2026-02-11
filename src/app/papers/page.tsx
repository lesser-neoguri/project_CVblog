'use client';

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { getPaperReviews } from '@/lib/papers';
import { getKnowledgeNodes } from '@/lib/knowledge';
import { PaperReview, KnowledgeNode, getCurrentUserRole } from '@/lib/supabase';
import KnowledgeGraph from '@/components/KnowledgeGraph';
import { useMediaQuery } from '@/hooks/useMediaQuery';

/* ═══════════════════════════════════════════════════════
   View Modes
   ═══════════════════════════════════════════════════════ */
type ViewMode = 'split' | 'list' | 'graph';

/* ═══════════════════════════════════════════════════════
   Stars
   ═══════════════════════════════════════════════════════ */
function Stars({ rating }: { rating: number }) {
  return (
    <span style={{ display: 'inline-flex', gap: '2px' }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} width="10" height="10" viewBox="0 0 24 24" fill={i < rating ? 'var(--accent)' : 'none'} stroke={i < rating ? 'var(--accent)' : 'var(--t4)'} strokeWidth="2">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </span>
  );
}

/* ═══════════════════════════════════════════════════════
   Unified Preview Data
   ═══════════════════════════════════════════════════════ */
type PreviewData = {
  id: string;
  badge: string;
  rating: number;
  showRating: boolean;
  title: string;
  subtitle: string;
  summary: string;
  summaryLabel: string;
  createdAt: string;
  externalUrl: string | null;
  tags: string[];
  published: boolean;
};

function reviewToPreview(r: PaperReview): PreviewData {
  return {
    id: r.id, badge: r.venue, rating: r.rating, showRating: true,
    title: r.title, subtitle: r.authors,
    summary: r.tldr, summaryLabel: 'TL;DR',
    createdAt: r.created_at, externalUrl: r.paper_url,
    tags: r.tags || [], published: r.published,
  };
}

const NODE_TYPE_LABELS: Record<string, string> = {
  paper: '논문', technology: '기술', concept: '개념', field: '분야',
};

function nodeToPreview(n: KnowledgeNode): PreviewData {
  const desc = typeof n.description === 'string' ? n.description : '';
  return {
    id: n.id,
    badge: NODE_TYPE_LABELS[n.type] || n.type,
    rating: 0, showRating: false,
    title: n.label, subtitle: '',
    summary: desc.length > 300 ? desc.slice(0, 300) + '…' : desc,
    summaryLabel: 'DESCRIPTION',
    createdAt: n.created_at, externalUrl: n.url || null,
    tags: [], published: true,
  };
}

/* ═══════════════════════════════════════════════════════
   Unified Preview Panel (DDPM style for all nodes)
   ═══════════════════════════════════════════════════════ */
function PreviewPanel({
  data,
  onClose,
  onNavigate,
  fullScreen = false,
}: {
  data: PreviewData;
  onClose: () => void;
  onNavigate: (path: string) => void;
  fullScreen?: boolean;
}) {
  const fmtDate = (s: string) => {
    const d = new Date(s);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
  };

  return (
    <div style={{
      width: fullScreen ? '100%' : '380px',
      minWidth: fullScreen ? undefined : 280,
      height: fullScreen ? '100%' : '100%',
      borderLeft: fullScreen ? 'none' : '1px solid var(--border)',
      background: 'var(--bg)',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      animation: 'panelSlideIn .2s ease-out',
      flexShrink: 0,
    }}>
      {/* Header */}
      <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', flexWrap: 'wrap' }}>
              {data.badge && (
                <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--accent)', fontFamily: 'var(--mono)' }}>
                  {data.badge}
                </span>
              )}
              {data.showRating && <Stars rating={data.rating} />}
              {!data.published && (
                <span style={{ fontSize: '10px', fontWeight: 600, color: '#eab308', padding: '1px 6px', border: '1px solid rgba(234,179,8,0.3)' }}>DRAFT</span>
              )}
            </div>
            <h3 style={{ fontSize: '17px', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.35, color: 'var(--t1)' }}>
              {data.title}
            </h3>
            {data.subtitle && (
              <p style={{ fontSize: '12px', color: 'var(--t3)', marginTop: '6px', lineHeight: 1.5 }}>
                {data.subtitle}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            style={{
              width: fullScreen ? 44 : 28, height: fullScreen ? 44 : 28,
              display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: fullScreen ? 44 : 28, minHeight: fullScreen ? 44 : 28,
              background: 'transparent', border: '1px solid var(--border)',
              color: 'var(--t3)', cursor: 'pointer', flexShrink: 0,
              transition: 'all .15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-strong)'; e.currentTarget.style.color = 'var(--t1)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--t3)'; }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: '20px', minHeight: 0 }}>
        {/* Summary (TL;DR or Description) */}
        {data.summary && (
          <div style={{ marginBottom: '20px' }}>
            <p style={{ fontSize: '10px', fontFamily: 'var(--mono)', fontWeight: 600, color: 'var(--t4)', letterSpacing: '0.08em', marginBottom: '8px' }}>{data.summaryLabel}</p>
            <p style={{ fontSize: '14px', color: 'var(--t2)', lineHeight: 1.7 }}>{data.summary}</p>
          </div>
        )}

        {/* Meta */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
            <span style={{ color: 'var(--t4)' }}>작성일</span>
            <span style={{ color: 'var(--t2)', fontFamily: 'var(--mono)' }}>{fmtDate(data.createdAt)}</span>
          </div>
          {data.externalUrl && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
              <span style={{ color: 'var(--t4)' }}>원문</span>
              <a
                href={data.externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: 'var(--accent)', textDecoration: 'none', fontFamily: 'var(--mono)' }}
                onClick={e => e.stopPropagation()}
              >
                링크 →
              </a>
            </div>
          )}
        </div>

        {/* Tags */}
        {data.tags.length > 0 && (
          <div style={{ marginBottom: '20px' }}>
            <p style={{ fontSize: '10px', fontFamily: 'var(--mono)', fontWeight: 600, color: 'var(--t4)', letterSpacing: '0.08em', marginBottom: '8px' }}>TAGS</p>
            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
              {data.tags.map(tag => (
                <span key={tag} className="tag">{tag}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer actions */}
      <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border)', flexShrink: 0, display: 'flex', gap: '6px' }}>
        <button
          onClick={() => onNavigate(`/papers/${data.id}`)}
          style={{
            flex: 1, padding: '9px 0', fontSize: '13px', fontWeight: 600,
            background: 'var(--t1)', color: 'var(--bg)',
            border: 'none', cursor: 'pointer', transition: 'opacity .15s',
            fontFamily: 'var(--font)',
          }}
          onMouseEnter={e => { e.currentTarget.style.opacity = '0.85'; }}
          onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
        >
          전문보기
        </button>
        <button
          onClick={() => onNavigate(`/papers/${data.id}/edit`)}
          style={{
            padding: '9px 16px', fontSize: '13px', fontWeight: 500,
            background: 'transparent', color: 'var(--t2)',
            border: '1px solid var(--border)', cursor: 'pointer',
            transition: 'all .15s', fontFamily: 'var(--font)',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-strong)'; e.currentTarget.style.color = 'var(--t1)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--t2)'; }}
        >
          수정
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Compact Paper Card (for list sidebar)
   ═══════════════════════════════════════════════════════ */
function PaperCard({
  review,
  isActive,
  isSearchHighlight,
  onClick,
}: {
  review: PaperReview;
  isActive: boolean;
  isSearchHighlight?: boolean;
  onClick: () => void;
}) {
  const elRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (isActive && elRef.current) {
      const el = elRef.current;
      const t = setTimeout(() => {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
      return () => clearTimeout(t);
    }
  }, [isActive]);

  const fmtDate = (s: string) => {
    const d = new Date(s);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}`;
  };

  return (
    <button
      ref={elRef}
      onClick={onClick}
      style={{
        display: 'block',
        width: '100%',
        textAlign: 'left',
        padding: '16px 20px',
        background: isActive ? 'var(--bg-hover)' : isSearchHighlight ? 'rgba(0,199,60,0.06)' : 'transparent',
        border: 'none',
        borderBottom: '1px solid var(--border)',
        cursor: 'pointer',
        transition: 'background .12s',
        borderLeft: isActive ? '2px solid var(--accent)' : isSearchHighlight ? '2px solid rgba(0,199,60,0.4)' : '2px solid transparent',
      }}
      onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--bg-hover)'; }}
      onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = isSearchHighlight ? 'rgba(0,199,60,0.06)' : 'transparent'; }}
    >
      {/* Meta row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
        <span style={{ fontSize: '10px', fontFamily: 'var(--mono)', color: 'var(--t4)' }}>
          {fmtDate(review.created_at)}
        </span>
        {review.venue && (
          <>
            <span style={{ color: 'var(--t4)', fontSize: '8px' }}>·</span>
            <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--accent)' }}>{review.venue}</span>
          </>
        )}
        {!review.published && (
          <span style={{ fontSize: '9px', fontWeight: 600, color: '#eab308', marginLeft: 'auto' }}>DRAFT</span>
        )}
      </div>
      {/* Title */}
      <h4 style={{
        fontSize: '14px',
        fontWeight: 700,
        letterSpacing: '-0.01em',
        lineHeight: 1.4,
        color: isActive ? 'var(--t1)' : 'var(--t2)',
        marginBottom: '4px',
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
      }}>
        {review.title}
      </h4>
      {/* Rating + tags */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <Stars rating={review.rating} />
        {review.tags && review.tags.length > 0 && (
          <span style={{ fontSize: '10px', color: 'var(--t4)', fontFamily: 'var(--mono)' }}>
            +{review.tags.length} tags
          </span>
        )}
      </div>
    </button>
  );
}

/* ═══════════════════════════════════════════════════════
   Full-width Paper Row (for full list view)
   ═══════════════════════════════════════════════════════ */
function PaperRow({
  review,
  isActive,
  isSearchHighlight,
  onClick,
}: {
  review: PaperReview;
  isActive: boolean;
  isSearchHighlight?: boolean;
  onClick: () => void;
}) {
  const elRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (isActive && elRef.current) {
      const el = elRef.current;
      const t = setTimeout(() => {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
      return () => clearTimeout(t);
    }
  }, [isActive]);

  const fmtDate = (s: string) => {
    const d = new Date(s);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
  };

  return (
    <button
      ref={elRef}
      onClick={onClick}
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr auto',
        gap: '24px',
        alignItems: 'center',
        width: '100%',
        textAlign: 'left',
        padding: '20px 24px',
        background: isActive ? 'var(--bg-hover)' : isSearchHighlight ? 'rgba(0,199,60,0.06)' : 'transparent',
        border: 'none',
        borderBottom: '1px solid var(--border)',
        cursor: 'pointer',
        transition: 'background .12s',
        borderLeft: isActive ? '2px solid var(--accent)' : isSearchHighlight ? '2px solid rgba(0,199,60,0.4)' : '2px solid transparent',
      }}
      onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--bg-hover)'; }}
      onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = isSearchHighlight ? 'rgba(0,199,60,0.06)' : 'transparent'; }}
    >
      <div style={{ minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '11px', fontFamily: 'var(--mono)', color: 'var(--t4)' }}>
            {fmtDate(review.created_at)}
          </span>
          {review.venue && (
            <>
              <span style={{ color: 'var(--t4)', fontSize: '8px' }}>·</span>
              <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--accent)' }}>{review.venue}</span>
            </>
          )}
          <Stars rating={review.rating} />
          {!review.published && (
            <span style={{ fontSize: '10px', fontWeight: 600, color: '#eab308', padding: '1px 6px', border: '1px solid rgba(234,179,8,0.3)' }}>DRAFT</span>
          )}
        </div>
        <h3 style={{ fontSize: '17px', fontWeight: 700, letterSpacing: '-0.01em', lineHeight: 1.4, color: 'var(--t1)', marginBottom: '4px' }}>
          {review.title}
        </h3>
        {review.authors && (
          <p style={{ fontSize: '13px', color: 'var(--t3)', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {review.authors}
          </p>
        )}
        {review.tldr && (
          <p style={{
            fontSize: '13px', color: 'var(--t3)', lineHeight: 1.5,
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>
            {review.tldr}
          </p>
        )}
        {review.tags && review.tags.length > 0 && (
          <div style={{ display: 'flex', gap: '4px', marginTop: '8px', flexWrap: 'wrap' }}>
            {review.tags.map(tag => (
              <span key={tag} className="tag">{tag}</span>
            ))}
          </div>
        )}
      </div>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--t4)" strokeWidth="1.5" style={{ flexShrink: 0 }}>
        <path d="M9 18l6-6-6-6" />
      </svg>
    </button>
  );
}

/* ═══════════════════════════════════════════════════════
   Main Page
   ═══════════════════════════════════════════════════════ */
export default function PapersPage() {
  const router = useRouter();
  const [reviews, setReviews] = useState<PaperReview[]>([]);
  const [knowledgeNodes, setKnowledgeNodes] = useState<KnowledgeNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingViewAuth, setCheckingViewAuth] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [filterTag, setFilterTag] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [highlightNodeId, setHighlightNodeId] = useState<string | null>(null);
  const [tagDropdownOpen, setTagDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [pullProgress, setPullProgress] = useState(0);
  const touchStartY = useRef<number>(0);
  const currentPullY = useRef<number>(0);
  const isMobile = useMediaQuery('(max-width: 768px)');

  // 뷰 권한: 관리자만 실제 내용 확인 가능, 일반 방문자는 블러 + 안내 배너
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const role = await getCurrentUserRole();
        if (!active) return;
        setIsAdmin(role === 'admin');
      } catch {
        if (!active) return;
        setIsAdmin(false);
      } finally {
        if (active) setCheckingViewAuth(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const isBlurred = !checkingViewAuth && !isAdmin;

  useEffect(() => { loadReviews(); }, [showAll]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (isMobile && viewMode === 'split') setViewMode('list');
  }, [isMobile]);

  // 논문 리뷰 + 지식 노드 동시 로드
  const loadReviews = async () => {
    setLoading(true);
    try {
      const [data, nodes] = await Promise.all([
        getPaperReviews(!showAll),
        getKnowledgeNodes(),
      ]);
      setReviews(data);
      setKnowledgeNodes(nodes);
    } catch (err) {
      console.error('데이터 로드 실패:', err);
    } finally {
      setLoading(false);
    }
  };

  // 매핑: reviewId → nodeId, nodeId → reviewId
  const { reviewToNode, nodeToReview } = useMemo(() => {
    const r2n = new Map<string, string>();
    const n2r = new Map<string, string>();
    for (const node of knowledgeNodes) {
      const reviewId = (node.metadata as Record<string, unknown>)?.paper_review_id;
      if (typeof reviewId === 'string') {
        r2n.set(reviewId, node.id);
        n2r.set(node.id, reviewId);
      }
    }
    return { reviewToNode: r2n, nodeToReview: n2r };
  }, [knowledgeNodes]);

  const allTags = Array.from(new Set(reviews.flatMap(r => r.tags || []))).sort();
  const tagFiltered = filterTag ? reviews.filter(r => r.tags?.includes(filterTag)) : reviews;

  // 검색: reviews와 knowledge_nodes에서 검색어 매칭
  const { searchMatchNodeIds, searchMatchReviewIds, searchFiltered } = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) {
      return { searchMatchNodeIds: [] as string[], searchMatchReviewIds: new Set<string>(), searchFiltered: tagFiltered };
    }
    const nodeIds = new Set<string>();
    const reviewIds = new Set<string>();
    const matches = (text: string | null | undefined) =>
      text && String(text).toLowerCase().includes(q);
    const matchesAny = (arr: string[] | null | undefined) =>
      arr?.some((t) => String(t).toLowerCase().includes(q));

    knowledgeNodes.forEach((n) => {
      if (matches(n.label) || matches(n.description)) {
        nodeIds.add(n.id);
        const prId = (n.metadata as Record<string, unknown>)?.paper_review_id;
        if (typeof prId === 'string') reviewIds.add(prId);
      }
    });
    tagFiltered.forEach((r) => {
      if (matches(r.title) || matches(r.authors) || matches(r.tldr) || matches(r.content) || matchesAny(r.tags)) {
        reviewIds.add(r.id);
        const nid = reviewToNode.get(r.id);
        if (nid) nodeIds.add(nid);
      }
    });

    const filtered = tagFiltered.filter((r) => reviewIds.has(r.id));
    return { searchMatchNodeIds: Array.from(nodeIds), searchMatchReviewIds: reviewIds, searchFiltered: filtered };
  }, [searchQuery, tagFiltered, knowledgeNodes, reviewToNode]);

  const filtered = searchQuery.trim() ? searchFiltered : tagFiltered;

  // 검색 결과 중 하나를 클릭했을 때: 해당 노드와 직결된 것만 하이라이트
  const highlightNodeIdsForGraph = useMemo(() => {
    const hasSearch = !!searchQuery.trim();
    if (!hasSearch) return null;
    if (previewData) {
      const selectedNodeId = reviewToNode.get(previewData.id) ?? previewData.id;
      return [selectedNodeId];
    }
    return searchMatchNodeIds.length > 0 ? searchMatchNodeIds : null;
  }, [searchQuery, previewData, searchMatchNodeIds, reviewToNode]);

  // 미리보기 패널 닫기
  const closePreview = useCallback(() => {
    setPreviewData(null);
    setHighlightNodeId(null);
  }, []);

  // 논문 리스트에서 클릭 → 리뷰 선택 + 노드 하이라이트
  const handleSelectReview = useCallback((review: PaperReview) => {
    setPreviewData(prev => {
      if (prev?.id === review.id) {
        setHighlightNodeId(null);
        return null;
      }
      setHighlightNodeId(reviewToNode.get(review.id) ?? null);
      return reviewToPreview(review);
    });
  }, [reviewToNode]);

  // 그래프 노드 클릭 → 페이지 이동 없이 선택/미리보기만 (통일된 UI)
  const handleNodeClick = useCallback((nodeId: string, _nodeType: string, _metadata: Record<string, unknown>) => {
    const reviewId = nodeToReview.get(nodeId);
    if (reviewId) {
      const review = reviews.find(r => r.id === reviewId);
      if (review) {
        setPreviewData(prev => {
          if (prev?.id === review.id) { setHighlightNodeId(null); return null; }
          setHighlightNodeId(nodeId);
          return reviewToPreview(review);
        });
      }
    } else {
      const node = knowledgeNodes.find(n => n.id === nodeId);
      if (node) {
        setPreviewData(prev => {
          if (prev?.id === node.id) { setHighlightNodeId(null); return null; }
          setHighlightNodeId(nodeId);
          return nodeToPreview(node);
        });
      }
    }
  }, [nodeToReview, reviews, knowledgeNodes]);

  /* ─── View mode icons ─── */
  const viewModesAll: { mode: ViewMode; label: string; icon: React.ReactNode }[] = [
    {
      mode: 'split',
      label: '분할',
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="3" y="3" width="18" height="18" />
          <line x1="12" y1="3" x2="12" y2="21" />
        </svg>
      ),
    },
    {
      mode: 'list',
      label: '목록',
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <line x1="4" y1="6" x2="20" y2="6" />
          <line x1="4" y1="12" x2="20" y2="12" />
          <line x1="4" y1="18" x2="20" y2="18" />
        </svg>
      ),
    },
    {
      mode: 'graph',
      label: '그래프',
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="6" cy="6" r="2" />
          <circle cx="18" cy="8" r="2" />
          <circle cx="8" cy="18" r="2" />
          <circle cx="18" cy="18" r="2" />
          <path d="M8 6l8 2M7 8l1 8M16 10v6" />
        </svg>
      ),
    },
  ];
  const viewModes = isMobile ? viewModesAll.filter((m) => m.mode !== 'split') : viewModesAll;

  const effectiveViewMode = isMobile && viewMode === 'split' ? 'list' : viewMode;
  const showList = effectiveViewMode === 'split' || effectiveViewMode === 'list';
  const showGraph = effectiveViewMode === 'split' || effectiveViewMode === 'graph';

  const PULL_THRESHOLD = 48;
  const startPull = useCallback((clientY: number) => {
    touchStartY.current = clientY;
    currentPullY.current = 0;
    setPullProgress(0);
  }, []);
  const updatePull = useCallback((clientY: number) => {
    const dy = clientY - touchStartY.current;
    if (dy > 0) {
      currentPullY.current = dy;
      setPullProgress(Math.min(1, dy / PULL_THRESHOLD));
    }
  }, []);
  const endPull = useCallback(() => {
    if (currentPullY.current >= PULL_THRESHOLD) {
      setViewMode('graph');
      setPreviewData(null);
      setHighlightNodeId(null);
    }
    currentPullY.current = 0;
    setPullProgress(0);
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    startPull(e.clientY);
    const onMove = (ev: MouseEvent) => updatePull(ev.clientY);
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      endPull();
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, [startPull, updatePull, endPull]);

  const handlePullStart = useCallback((e: React.TouchEvent) => {
    startPull(e.touches[0].clientY);
  }, [startPull]);
  const handlePullMove = useCallback((e: React.TouchEvent) => {
    const dy = e.touches[0].clientY - touchStartY.current;
    if (dy > 0) {
      currentPullY.current = dy;
      setPullProgress(Math.min(1, dy / PULL_THRESHOLD));
      if (dy > 20) e.preventDefault();
    }
  }, []);
  const handlePullEnd = useCallback(() => {
    endPull();
  }, [endPull]);

  const toolbarBtnStyle = (active: boolean): React.CSSProperties => ({
    display: 'flex', alignItems: 'center', gap: '5px',
    padding: '6px 12px', fontSize: '11px', fontWeight: 500,
    fontFamily: 'var(--mono)',
    background: active ? 'var(--t1)' : 'transparent',
    color: active ? 'var(--bg)' : 'var(--t3)',
    borderTop: active ? '1px solid var(--t1)' : '1px solid var(--border)',
    borderBottom: active ? '1px solid var(--t1)' : '1px solid var(--border)',
    borderLeft: active ? '1px solid var(--t1)' : '1px solid var(--border)',
    borderRight: active ? '1px solid var(--t1)' : '1px solid var(--border)',
    cursor: 'pointer', transition: 'all .12s',
    letterSpacing: '0.02em',
    height: '32px',
  });

  return (
    <main
      data-papers-main
      style={{
        flex: 1,
        minHeight: 0,
        width: '100%',
        maxWidth: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxSizing: 'border-box',
        position: 'relative',
      }}
    >
      {/* Keyframes + viewport fitting */}
      <style>{`
        @keyframes panelSlideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>

      {/* 비공개 안내 배너 (관리자 외에만 표시) */}
      {isBlurred && !checkingViewAuth && (
        <div
          style={{
            position: 'absolute',
            top: 16,
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '10px 16px',
            borderRadius: 4,
            background: 'rgba(15,23,42,0.92)',
            color: 'rgba(248,250,252,0.96)',
            fontSize: '12px',
            lineHeight: 1.6,
            boxShadow: '0 12px 30px rgba(15,23,42,0.55)',
            border: '1px solid rgba(148,163,184,0.55)',
            zIndex: 20,
            maxWidth: 420,
            textAlign: 'center',
            pointerEvents: 'auto',
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: 4 }}>
            블로그 정리 중에 있습니다.
          </div>
          <div>현재는 요약본으로 대체되어 표시됩니다.</div>
        </div>
      )}

      {/* 실제 콘텐츠 영역은 필요 시 블러 처리 */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          minHeight: 0,
          minWidth: 0,
          filter: isBlurred ? 'blur(5px)' : 'none',
          pointerEvents: isBlurred ? 'none' : 'auto',
          userSelect: isBlurred ? 'none' : 'auto',
        }}
      >
        {/* ════════ TOOLBAR ════════ */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          flexWrap: isMobile ? 'wrap' : 'nowrap',
          gap: isMobile ? '6px' : '8px',
          padding: isMobile ? '10px 16px' : '10px 24px',
          borderBottom: '1px solid var(--border)',
          flexShrink: 0,
        }}>
          {/* Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginRight: '16px' }}>
            <h1 style={{ fontSize: '16px', fontWeight: 800, letterSpacing: '-0.02em' }}>
              논문 리뷰
            </h1>
            <span style={{ fontSize: '11px', fontFamily: 'var(--mono)', color: 'var(--t4)' }}>
              {filtered.length}편
            </span>
          </div>

          {/* Separator */}
          <div style={{ width: '1px', height: '20px', background: 'var(--border)', flexShrink: 0 }} />

          {/* View mode toggle */}
          <div style={{ display: 'flex', gap: '0px' }}>
            {viewModes.map(({ mode, label, icon }) => (
              <button
                key={mode}
                onClick={() => { setViewMode(mode); setPreviewData(null); setHighlightNodeId(null); }}
                style={{
                  ...toolbarBtnStyle(viewMode === mode),
                  borderRight: mode !== 'graph' ? 'none' : undefined,
                }}
                title={label}
              >
                {icon}
                <span>{label}</span>
              </button>
            ))}
          </div>

          {/* Separator */}
          <div style={{ width: '1px', height: '20px', background: 'var(--border)', flexShrink: 0 }} />

          {/* Tag filter */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setTagDropdownOpen(!tagDropdownOpen)}
              style={{
                ...toolbarBtnStyle(!!filterTag),
                gap: '4px',
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
              </svg>
              {filterTag || '태그'}
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>

            {tagDropdownOpen && (
              <>
                <div style={{ position: 'fixed', inset: 0, zIndex: 99 }} onClick={() => setTagDropdownOpen(false)} />
                <div style={{
                  position: 'absolute', top: '100%', right: 0, marginTop: '4px',
                  background: 'var(--bg)', border: '1px solid var(--border)',
                  minWidth: '160px', maxHeight: '240px', overflow: 'auto',
                  zIndex: 100,
                }}>
                  <button
                    onClick={() => { setFilterTag(null); setTagDropdownOpen(false); }}
                    style={{
                      display: 'block', width: '100%', textAlign: 'left',
                      padding: '8px 14px', fontSize: '12px',
                      background: !filterTag ? 'var(--bg-hover)' : 'transparent',
                      color: !filterTag ? 'var(--t1)' : 'var(--t3)',
                      border: 'none', cursor: 'pointer',
                      fontFamily: 'var(--mono)',
                      borderBottom: '1px solid var(--border)',
                    }}
                  >
                    전체
                  </button>
                  {allTags.map(tag => (
                    <button
                      key={tag}
                      onClick={() => { setFilterTag(tag); setTagDropdownOpen(false); }}
                      style={{
                        display: 'block', width: '100%', textAlign: 'left',
                        padding: '8px 14px', fontSize: '12px',
                        background: filterTag === tag ? 'var(--bg-hover)' : 'transparent',
                        color: filterTag === tag ? 'var(--accent)' : 'var(--t2)',
                        border: 'none', cursor: 'pointer',
                        borderBottom: '1px solid var(--border)',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-hover)'; }}
                      onMouseLeave={e => { if (filterTag !== tag) e.currentTarget.style.background = 'transparent'; }}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Search */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ position: 'absolute', left: '10px', color: 'var(--t4)', pointerEvents: 'none' }}>
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="검색"
              style={{
                width: isMobile ? '100px' : '140px',
                padding: '6px 10px 6px 28px',
                fontSize: '11px',
                fontFamily: 'var(--mono)',
                background: 'var(--bg-alt)',
                border: '1px solid var(--border)',
                color: 'var(--t1)',
                outline: 'none',
                transition: 'border-color .15s',
                height: '32px',
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--t3)'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{ position: 'absolute', right: '6px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--t4)', cursor: 'pointer', padding: '2px', display: 'flex' }}
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            )}
          </div>

          {/* Show all toggle */}
          <button
            onClick={() => setShowAll(!showAll)}
            style={{
              ...toolbarBtnStyle(showAll),
              gap: '4px',
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {showAll
                ? <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></>
                : <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></>
              }
            </svg>
            {showAll ? '전체' : '발행됨'}
          </button>

          {/* Spacer */}
          <div style={{ flex: 1 }} />

          {/* Write button */}
          <button
            className="btn-primary"
            onClick={() => router.push('/papers/write')}
            style={{ padding: '6px 16px', fontSize: '12px', height: '32px' }}
          >
            + 작성
          </button>
        </div>

        {/* ════════ CONTENT AREA ════════ */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0, minWidth: 0 }}>
        {/* ─── Paper List Panel ─── */}
        {showList && (
          <div style={{
            width: viewMode === 'list' ? '100%' : '340px',
            minWidth: viewMode === 'list' ? undefined : 260,
            maxWidth: viewMode === 'list' ? undefined : '400px',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            borderRight: viewMode === 'split' ? '1px solid var(--border)' : 'none',
            flexShrink: 0,
          }}>
            {isMobile && effectiveViewMode === 'list' && (
              <div
                onMouseDown={handleMouseDown}
                onTouchStart={handlePullStart}
                onTouchMove={handlePullMove}
                onTouchEnd={handlePullEnd}
                style={{
                  flexShrink: 0,
                  height: 24,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderBottom: '1px solid var(--border)',
                  touchAction: 'none',
                  cursor: 'ns-resize',
                  background: pullProgress > 0 ? 'var(--bg-hover)' : 'transparent',
                  transition: pullProgress > 0 ? 'none' : 'background .15s',
                }}
              >
                <span style={{
                  width: 20,
                  height: 3,
                  borderRadius: 2,
                  background: pullProgress >= 1 ? 'var(--accent)' : 'var(--t4)',
                  opacity: pullProgress > 0 ? 1 : 0.5,
                  transition: 'background .15s, opacity .15s',
                }} />
              </div>
            )}
            <div style={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} style={{
                  padding: '20px 24px', borderBottom: '1px solid var(--border)',
                  height: viewMode === 'list' ? '120px' : '90px',
                  animation: 'pulse 2s infinite', animationDelay: `${i * 0.08}s`,
                }} />
              ))
            ) : filtered.length === 0 ? (
              <div style={{ padding: '80px 24px', textAlign: 'center' }}>
                <p style={{ fontSize: '14px', color: 'var(--t3)', marginBottom: '16px' }}>
                  {filterTag ? `"${filterTag}" 태그의 리뷰가 없습니다` : '아직 논문 리뷰가 없습니다'}
                </p>
                {!filterTag && (
                  <button className="btn-primary" onClick={() => router.push('/papers/write')} style={{ fontSize: '13px' }}>
                    첫 리뷰 작성하기
                  </button>
                )}
              </div>
            ) : viewMode === 'list' ? (
              /* Full-width rows */
              <div style={{ maxWidth: '900px', margin: '0 auto' }}>
                {filtered.map(review => (
                  <PaperRow
                    key={review.id}
                    review={review}
                    isActive={previewData?.id === review.id}
                    isSearchHighlight={searchQuery.trim() ? searchMatchReviewIds.has(review.id) : false}
                    onClick={() => handleSelectReview(review)}
                  />
                ))}
              </div>
            ) : (
              /* Compact cards for split view */
              filtered.map(review => (
                <PaperCard
                  key={review.id}
                  review={review}
                  isActive={previewData?.id === review.id}
                  isSearchHighlight={searchQuery.trim() ? searchMatchReviewIds.has(review.id) : false}
                  onClick={() => handleSelectReview(review)}
                />
              ))
            )}
            </div>
          </div>
        )}

        {/* ─── Graph Panel ─── */}
        {showGraph && (
          <div style={{ flex: 1, minHeight: 0, minWidth: 0, position: 'relative', overflow: 'hidden' }}>
            <KnowledgeGraph
              showLegend={false}
              highlightNodeId={searchQuery.trim() ? null : highlightNodeId}
              highlightNodeIds={highlightNodeIdsForGraph}
              onNodeClick={handleNodeClick}
              onBackgroundClick={closePreview}
            />

            {/* Inline legend */}
            <div style={{
              position: 'absolute', bottom: '12px', right: '12px',
              display: 'flex', gap: '12px', zIndex: 10,
              background: 'var(--bg)', border: '1px solid var(--border)',
              padding: '6px 12px',
            }}>
              {[
                ['분야', '#f59e0b'],
                ['기술', '#3b82f6'],
                ['개념', '#14b8a6'],
                ['논문', '#a78bfa'],
              ].map(([label, color]) => (
                <span key={label} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: 'var(--t3)' }}>
                  <span style={{ width: '6px', height: '6px', background: color, display: 'inline-block' }} />
                  {label}
                </span>
              ))}
            </div>
          </div>
        )}

          {/* ─── Preview Panel (통일된 UI) ─── */}
          {previewData && (
            <div style={isMobile ? {
              position: 'fixed', top: 'var(--nav-h)', left: 0, right: 0, bottom: 0,
              zIndex: 1000, overflow: 'auto', background: 'var(--bg)',
              paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)',
              paddingLeft: 'env(safe-area-inset-left)', paddingRight: 'env(safe-area-inset-right)',
            } : undefined}>
              <PreviewPanel
                data={previewData}
                onClose={closePreview}
                onNavigate={(path) => router.push(path)}
                fullScreen={isMobile}
              />
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
