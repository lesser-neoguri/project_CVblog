'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import MarkdownEditor from '@/components/MarkdownEditor';
import { getPaperReviewById, updatePaperReview } from '@/lib/papers';
import { getKnowledgeNodeById, updateKnowledgeNode, getConnectedNodes, deleteKnowledgeEdge, createKnowledgeEdge, getKnowledgeNodes } from '@/lib/knowledge';
import { PaperReview, KnowledgeNode, KnowledgeEdge } from '@/lib/supabase';
import Modal from '@/components/Modal';
import { useModal } from '@/hooks/useModal';

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  fontSize: '14px',
  fontFamily: 'var(--font)',
  background: 'var(--bg-alt)',
  border: '1px solid var(--border)',
  color: 'var(--t1)',
  outline: 'none',
  transition: 'border-color .15s',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '12px',
  fontWeight: 600,
  marginBottom: '6px',
  letterSpacing: '0.02em',
};

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  cursor: 'pointer',
  appearance: 'none' as const,
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 12px center',
  paddingRight: '36px',
};

const focusIn = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => { e.currentTarget.style.borderColor = 'var(--t3)'; };
const focusOut = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => { e.currentTarget.style.borderColor = 'var(--border)'; };

const TYPE_LABELS: Record<string, string> = { field: '분야', technology: '기술', concept: '개념', paper: '논문' };
const REL_LABELS: Record<string, string> = { proposes: '제안', uses: '사용', extends: '확장', part_of: '분야', contains: '포함', related: '관련', solves: '해결', produces: '생성' };

interface ExistingEdge {
  edge: KnowledgeEdge;
  connectedNode: KnowledgeNode;
  direction: 'from' | 'to';
  relationship: string;
}

/* ═══════════════════════════════════════════════════════
   Paper Review Edit Form
   ═══════════════════════════════════════════════════════ */
function PaperReviewEditForm({ initial }: { initial: PaperReview }) {
  const router = useRouter();
  const { modalState, showAlert, closeModal } = useModal();

  const [title, setTitle] = useState(initial.title);
  const [authors, setAuthors] = useState(initial.authors);
  const [venue, setVenue] = useState(initial.venue);
  const [year, setYear] = useState(initial.year);
  const [paperUrl, setPaperUrl] = useState(initial.paper_url || '');
  const [tldr, setTldr] = useState(initial.tldr);
  const [content, setContent] = useState(initial.content);
  const [tagsInput, setTagsInput] = useState((initial.tags || []).join(', '));
  const [nodeLabel, setNodeLabel] = useState(initial.node_label || '');
  const [rating, setRating] = useState(initial.rating);
  const [published, setPublished] = useState(initial.published);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!title.trim()) { setError('논문 제목을 입력해주세요.'); return; }
    if (!authors.trim()) { setError('저자를 입력해주세요.'); return; }
    if (!venue.trim()) { setError('학회/저널을 입력해주세요.'); return; }
    if (!tldr.trim()) { setError('한 줄 요약을 입력해주세요.'); return; }
    if (!content.trim()) { setError('리뷰 내용을 입력해주세요.'); return; }

    setIsSaving(true);
    try {
      const tags = tagsInput.split(',').map(t => t.trim()).filter(Boolean);
      await updatePaperReview(initial.id, {
        title: title.trim(), authors: authors.trim(), venue: venue.trim(), year,
        paper_url: paperUrl.trim() || null, tldr: tldr.trim(), content: content.trim(),
        tags, rating, published, node_label: nodeLabel.trim() || null,
      });
      showAlert('논문 리뷰가 수정되었습니다!');
      setTimeout(() => router.push(`/papers/${initial.id}`), 1000);
    } catch (err: unknown) {
      console.error('수정 오류:', err);
      setError(err instanceof Error ? err.message : '수정 중 오류가 발생했습니다.');
    } finally { setIsSaving(false); }
  };

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '48px' }}>
        <div>
          <p className="mono accent" style={{ fontSize: '12px', fontWeight: 500, letterSpacing: '0.08em', marginBottom: '12px' }}>EDIT PAPER REVIEW</p>
          <h1 style={{ fontSize: 'clamp(24px, 3.5vw, 36px)', fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1.2 }}>논문 리뷰 수정</h1>
        </div>
        <button className="btn-ghost" onClick={() => router.back()} style={{ padding: '6px 14px', fontSize: '12px' }}>← 돌아가기</button>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '24px' }}>
          <label htmlFor="title" style={labelStyle}>논문 제목 *</label>
          <input id="title" type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Attention Is All You Need" style={inputStyle} onFocus={focusIn} onBlur={focusOut} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
          <div><label htmlFor="authors" style={labelStyle}>저자 *</label><input id="authors" type="text" value={authors} onChange={e => setAuthors(e.target.value)} placeholder="e.g. Vaswani et al." style={inputStyle} onFocus={focusIn} onBlur={focusOut} /></div>
          <div><label htmlFor="venue" style={labelStyle}>학회 / 저널 *</label><input id="venue" type="text" value={venue} onChange={e => setVenue(e.target.value)} placeholder="e.g. NeurIPS 2024" style={inputStyle} onFocus={focusIn} onBlur={focusOut} /></div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '16px', marginBottom: '24px' }}>
          <div><label htmlFor="year" style={labelStyle}>출판 연도</label><input id="year" type="number" value={year} onChange={e => setYear(Number(e.target.value))} min={1990} max={2030} style={inputStyle} onFocus={focusIn} onBlur={focusOut} /></div>
          <div><label htmlFor="paperUrl" style={labelStyle}>원문 링크 (선택)</label><input id="paperUrl" type="url" value={paperUrl} onChange={e => setPaperUrl(e.target.value)} placeholder="https://arxiv.org/abs/..." style={inputStyle} onFocus={focusIn} onBlur={focusOut} /></div>
        </div>
        <div style={{ marginBottom: '24px' }}>
          <label htmlFor="tldr" style={labelStyle}>한 줄 요약 (TL;DR) *</label>
          <input id="tldr" type="text" value={tldr} onChange={e => setTldr(e.target.value)} placeholder="이 논문의 핵심 기여를 한 문장으로 요약" style={inputStyle} onFocus={focusIn} onBlur={focusOut} />
        </div>
        <div style={{ marginBottom: '24px' }}>
          <label htmlFor="nodeLabel" style={labelStyle}>지식 그래프 노드 이름 (선택)</label>
          <input id="nodeLabel" type="text" value={nodeLabel} onChange={e => setNodeLabel(e.target.value)} placeholder="미입력 시 논문 제목 사용" style={inputStyle} onFocus={focusIn} onBlur={focusOut} />
        </div>
        <div style={{ marginBottom: '24px' }}>
          <label htmlFor="tags" style={labelStyle}>태그 (콤마로 구분)</label>
          <input id="tags" type="text" value={tagsInput} onChange={e => setTagsInput(e.target.value)} placeholder="e.g. Transformer, NLP, Attention" style={inputStyle} onFocus={focusIn} onBlur={focusOut} />
          {tagsInput && (
            <div style={{ display: 'flex', gap: '4px', marginTop: '8px', flexWrap: 'wrap' }}>
              {tagsInput.split(',').map(t => t.trim()).filter(Boolean).map(tag => (<span key={tag} className="tag">{tag}</span>))}
            </div>
          )}
        </div>
        <div style={{ marginBottom: '32px' }}>
          <label style={labelStyle}>평점</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {[1,2,3,4,5].map(n => (
              <button key={n} type="button" onClick={() => setRating(n)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', display: 'flex' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill={n <= rating ? 'var(--accent)' : 'none'} stroke={n <= rating ? 'var(--accent)' : 'var(--t4)'} strokeWidth="2">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              </button>
            ))}
            <span className="mono" style={{ fontSize: '13px', color: 'var(--t3)', marginLeft: '8px' }}>{rating}/5</span>
          </div>
        </div>
        <div style={{ marginBottom: '24px' }}>
          <label style={labelStyle}>리뷰 내용 (마크다운) *</label>
          <MarkdownEditor value={content} onChange={setContent} placeholder="## 핵심 내용\n\n이 논문은...\n\n## 방법론\n\n## 실험 결과\n\n## 의견" />
        </div>
        <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <input id="published" type="checkbox" checked={published} onChange={e => setPublished(e.target.checked)} style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: 'var(--accent)' }} />
          <label htmlFor="published" style={{ fontSize: '14px', fontWeight: 500, cursor: 'pointer' }}>발행하기</label>
        </div>
        {error && (<div style={{ padding: '12px 16px', marginBottom: '24px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', fontSize: '14px' }}>{error}</div>)}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button type="submit" className="btn-primary" disabled={isSaving} style={{ opacity: isSaving ? .6 : 1, cursor: isSaving ? 'not-allowed' : 'pointer' }}>{isSaving ? '저장 중...' : '수정 저장'}</button>
          <button type="button" className="btn-ghost" onClick={() => router.back()}>취소</button>
        </div>
      </form>
      <Modal isOpen={modalState.isOpen} onClose={closeModal} onConfirm={modalState.onConfirm} title={modalState.title} message={modalState.message} type={modalState.type} />
    </>
  );
}

/* ═══════════════════════════════════════════════════════
   Knowledge Node Edit Form
   ═══════════════════════════════════════════════════════ */
function KnowledgeNodeEditForm({ initial }: { initial: KnowledgeNode }) {
  const router = useRouter();
  const { modalState, showAlert, closeModal } = useModal();
  const nodeId = initial.id;

  const [label, setLabel] = useState(initial.label);
  const [type, setType] = useState<string>(initial.type);
  const [description, setDescription] = useState(initial.description || '');
  const [url, setUrl] = useState(initial.url || '');
  const [color, setColor] = useState(initial.color || '#888888');
  const [knVenue, setKnVenue] = useState(typeof initial.metadata?.venue === 'string' ? initial.metadata.venue : '');
  const [knAuthors, setKnAuthors] = useState(typeof initial.metadata?.authors === 'string' ? initial.metadata.authors : '');

  const [existingEdges, setExistingEdges] = useState<ExistingEdge[]>([]);
  const [allNodes, setAllNodes] = useState<KnowledgeNode[]>([]);
  const [showAddConn, setShowAddConn] = useState(false);
  const [newConnNodeId, setNewConnNodeId] = useState('');
  const [newConnRel, setNewConnRel] = useState('related');
  const [newConnDir, setNewConnDir] = useState<'from' | 'to'>('from');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { loadConnections(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadConnections = async () => {
    try {
      const [connData, nodesData] = await Promise.all([getConnectedNodes(nodeId), getKnowledgeNodes()]);
      const edges: ExistingEdge[] = connData.edges.map(edge => {
        const isSource = edge.source_id === nodeId;
        const cId = isSource ? edge.target_id : edge.source_id;
        const cNode = connData.nodes.find(n => n.id === cId);
        if (!cNode) return null;
        return { edge, connectedNode: cNode, direction: isSource ? 'from' : 'to', relationship: edge.relationship || 'related' } as ExistingEdge;
      }).filter(Boolean) as ExistingEdge[];
      setExistingEdges(edges);
      setAllNodes(nodesData.filter(n => n.id !== nodeId));
    } catch (err: unknown) { console.error('연결 로딩 오류:', err); }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!label.trim()) { setError('이름을 입력해주세요.'); return; }
    setSaving(true);
    try {
      const metadata: Record<string, unknown> = { ...(initial.metadata as Record<string, unknown> || {}) };
      if (type === 'paper') {
        if (knVenue.trim()) metadata.venue = knVenue.trim();
        if (knAuthors.trim()) metadata.authors = knAuthors.trim();
      }
      await updateKnowledgeNode(nodeId, {
        label: label.trim(), type: type as KnowledgeNode['type'],
        description: description.trim() || null, url: url.trim() || null,
        color: color || null, metadata,
      });
      showAlert('노드가 수정되었습니다!');
      setTimeout(() => router.push(`/papers/${nodeId}`), 800);
    } catch (err: unknown) {
      console.error('저장 오류:', err);
      setError(err instanceof Error ? err.message : '수정 중 오류가 발생했습니다.');
    } finally { setSaving(false); }
  };

  const handleRemoveEdge = async (edgeId: string) => {
    try { await deleteKnowledgeEdge(edgeId); setExistingEdges(prev => prev.filter(e => e.edge.id !== edgeId)); }
    catch { showAlert('연결 삭제 중 오류가 발생했습니다.'); }
  };

  const handleAddEdge = async () => {
    if (!newConnNodeId) return;
    try {
      const edgeData = newConnDir === 'from' ? { source_id: nodeId, target_id: newConnNodeId, relationship: newConnRel } : { source_id: newConnNodeId, target_id: nodeId, relationship: newConnRel };
      await createKnowledgeEdge(edgeData);
      setShowAddConn(false); setNewConnNodeId(''); setNewConnRel('related');
      await loadConnections();
    } catch { showAlert('연결 추가 중 오류가 발생했습니다.'); }
  };

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '48px' }}>
        <div>
          <p className="mono accent" style={{ fontSize: '12px', fontWeight: 500, letterSpacing: '0.08em', marginBottom: '12px' }}>EDIT NODE</p>
          <h1 style={{ fontSize: 'clamp(24px, 3.5vw, 36px)', fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1.2 }}>노드 수정</h1>
        </div>
        <button className="btn-ghost" onClick={() => router.back()} style={{ padding: '6px 14px', fontSize: '12px' }}>← 돌아가기</button>
      </div>

      <form onSubmit={handleSave}>
        <div style={{ marginBottom: '24px' }}>
          <label htmlFor="label" style={labelStyle}>이름 *</label>
          <input id="label" type="text" value={label} onChange={e => setLabel(e.target.value)} placeholder="e.g. Transformer" style={inputStyle} onFocus={focusIn} onBlur={focusOut} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: '16px', marginBottom: '24px' }}>
          <div>
            <label htmlFor="type" style={labelStyle}>타입 *</label>
            <select id="type" value={type} onChange={e => setType(e.target.value)} style={selectStyle}>
              <option value="field">분야 (Field)</option><option value="technology">기술 (Technology)</option><option value="concept">개념 (Concept)</option><option value="paper">논문 (Paper)</option>
            </select>
          </div>
          <div>
            <label htmlFor="color" style={labelStyle}>색상</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input id="color" type="color" value={color} onChange={e => setColor(e.target.value)} style={{ width: '40px', height: '40px', border: '1px solid var(--border)', cursor: 'pointer', padding: 0, background: 'none' }} />
              <input type="text" value={color} onChange={e => setColor(e.target.value)} style={{ ...inputStyle, width: '100%', fontFamily: 'var(--mono)', fontSize: '12px' }} onFocus={focusIn} onBlur={focusOut} />
            </div>
          </div>
        </div>
        {type === 'paper' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
            <div><label htmlFor="knVenue" style={labelStyle}>학회/저널</label><input id="knVenue" type="text" value={knVenue} onChange={e => setKnVenue(e.target.value)} placeholder="e.g. NeurIPS 2024" style={inputStyle} onFocus={focusIn} onBlur={focusOut} /></div>
            <div><label htmlFor="knAuthors" style={labelStyle}>저자</label><input id="knAuthors" type="text" value={knAuthors} onChange={e => setKnAuthors(e.target.value)} placeholder="e.g. Vaswani et al." style={inputStyle} onFocus={focusIn} onBlur={focusOut} /></div>
          </div>
        )}
        <div style={{ marginBottom: '24px' }}>
          <label htmlFor="url" style={labelStyle}>외부 링크 (선택)</label>
          <input id="url" type="url" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://..." style={inputStyle} onFocus={focusIn} onBlur={focusOut} />
        </div>
        <div style={{ marginBottom: '32px' }}>
          <label style={labelStyle}>설명 (마크다운)</label>
          <MarkdownEditor value={description} onChange={setDescription} placeholder="이 노드에 대한 상세 설명을 마크다운으로 작성하세요..." />
        </div>

        {/* ═══ Connections ═══ */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <label style={{ ...labelStyle, marginBottom: 0 }}>연결 ({existingEdges.length})</label>
            <button type="button" onClick={() => setShowAddConn(!showAddConn)}
              style={{ padding: '4px 12px', fontSize: '11px', fontFamily: 'var(--mono)', background: showAddConn ? 'var(--t1)' : 'transparent', color: showAddConn ? 'var(--bg)' : 'var(--t2)', border: '1px solid var(--border)', cursor: 'pointer', transition: 'all .15s' }}>
              {showAddConn ? '취소' : '+ 연결 추가'}
            </button>
          </div>
          {showAddConn && (
            <div style={{ padding: '16px', background: 'var(--bg-alt)', border: '1px solid var(--border)', marginBottom: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 100px', gap: '8px', marginBottom: '10px' }}>
                <select value={newConnNodeId} onChange={e => setNewConnNodeId(e.target.value)} style={{ ...selectStyle, fontSize: '12px', padding: '8px 12px' }}>
                  <option value="">노드 선택...</option>
                  {allNodes.filter(n => !existingEdges.some(e => e.connectedNode.id === n.id)).map(n => (
                    <option key={n.id} value={n.id}>[{TYPE_LABELS[n.type] || n.type}] {n.label}</option>
                  ))}
                </select>
                <select value={newConnRel} onChange={e => setNewConnRel(e.target.value)} style={{ ...selectStyle, fontSize: '12px', padding: '8px 12px' }}>
                  {Object.entries(REL_LABELS).map(([key, val]) => (<option key={key} value={key}>{val} ({key})</option>))}
                </select>
                <select value={newConnDir} onChange={e => setNewConnDir(e.target.value as 'from' | 'to')} style={{ ...selectStyle, fontSize: '12px', padding: '8px 12px' }}>
                  <option value="from">→ (발신)</option><option value="to">← (수신)</option>
                </select>
              </div>
              <button type="button" onClick={handleAddEdge} disabled={!newConnNodeId} className="btn-primary" style={{ padding: '6px 16px', fontSize: '12px', opacity: newConnNodeId ? 1 : 0.4 }}>추가</button>
            </div>
          )}
          {existingEdges.length === 0 ? (
            <p style={{ fontSize: '13px', color: 'var(--t4)' }}>연결된 노드가 없습니다.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {existingEdges.map(({ edge, connectedNode, direction, relationship }) => (
                <div key={edge.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', background: 'var(--bg-alt)', border: '1px solid var(--border)' }}>
                  <span style={{ width: '6px', height: '6px', background: connectedNode.color || 'var(--t3)', flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--t1)' }}>{connectedNode.label}</span>
                    <span style={{ fontSize: '10px', color: 'var(--t4)', fontFamily: 'var(--mono)', marginLeft: '8px' }}>
                      {TYPE_LABELS[connectedNode.type] || connectedNode.type} · {direction === 'from' ? `→ ${REL_LABELS[relationship] || relationship}` : `← ${REL_LABELS[relationship] || relationship}`}
                    </span>
                  </div>
                  <button type="button" onClick={() => handleRemoveEdge(edge.id)}
                    style={{ padding: '4px 8px', fontSize: '10px', fontFamily: 'var(--mono)', background: 'transparent', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', cursor: 'pointer', flexShrink: 0, transition: 'all .15s' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
                    삭제
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {error && (<div style={{ padding: '12px 16px', marginBottom: '24px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', fontSize: '14px' }}>{error}</div>)}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button type="submit" className="btn-primary" disabled={saving} style={{ opacity: saving ? .6 : 1, cursor: saving ? 'not-allowed' : 'pointer' }}>{saving ? '저장 중...' : '저장'}</button>
          <button type="button" className="btn-ghost" onClick={() => router.back()}>취소</button>
        </div>
      </form>
      <Modal isOpen={modalState.isOpen} onClose={closeModal} onConfirm={modalState.onConfirm} title={modalState.title} message={modalState.message} type={modalState.type} />
    </>
  );
}

/* ═══════════════════════════════════════════════════════
   Main Page — detect type and render appropriate form
   ═══════════════════════════════════════════════════════ */
export default function EditPage() {
  const params = useParams();
  const router = useRouter();

  const [review, setReview] = useState<PaperReview | null>(null);
  const [node, setNode] = useState<KnowledgeNode | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (params.id) loadData(params.id as string);
  }, [params.id]);

  const loadData = async (id: string) => {
    setLoading(true);
    // 1) paper_review 시도
    try {
      const r = await getPaperReviewById(id);
      setReview(r);
      setLoading(false);
      return;
    } catch { /* not a paper review */ }
    // 2) knowledge_node 시도
    try {
      const n = await getKnowledgeNodeById(id);
      setNode(n);
    } catch {
      setError('해당 콘텐츠를 찾을 수 없습니다.');
    } finally { setLoading(false); }
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
    <main>
      <section style={{ padding: '80px 32px 120px' }}>
        <div style={{ maxWidth: 'var(--content-w)', margin: '0 auto' }}>
          {review ? <PaperReviewEditForm initial={review} /> : node ? <KnowledgeNodeEditForm initial={node} /> : null}
        </div>
      </section>
    </main>
  );
}
