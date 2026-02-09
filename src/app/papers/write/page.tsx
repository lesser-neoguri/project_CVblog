'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import MarkdownEditor from '@/components/MarkdownEditor';
import { createPaperReview } from '@/lib/papers';
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

export default function WritePaperReviewPage() {
  const router = useRouter();
  const { modalState, showAlert, closeModal } = useModal();

  const [title, setTitle] = useState('');
  const [authors, setAuthors] = useState('');
  const [venue, setVenue] = useState('');
  const [year, setYear] = useState(new Date().getFullYear());
  const [paperUrl, setPaperUrl] = useState('');
  const [tldr, setTldr] = useState('');
  const [content, setContent] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [nodeLabel, setNodeLabel] = useState('');
  const [rating, setRating] = useState(3);
  const [published, setPublished] = useState(false);
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
      const review = await createPaperReview({
        title: title.trim(),
        authors: authors.trim(),
        venue: venue.trim(),
        year,
        paper_url: paperUrl.trim() || undefined,
        tldr: tldr.trim(),
        content: content.trim(),
        tags,
        rating,
        published,
        node_label: nodeLabel.trim() || null,
      });

      showAlert('논문 리뷰가 저장되었습니다!');
      setTimeout(() => router.push(`/papers/${review.id}`), 1000);
    } catch (err: unknown) {
      console.error('저장 오류:', err);
      setError(err instanceof Error ? err.message : '논문 리뷰 저장 중 오류가 발생했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main>
      <section style={{ padding: '80px 32px 120px' }}>
        <div style={{ maxWidth: 'var(--content-w)', margin: '0 auto' }}>
          {/* Header */}
          <p className="mono accent" style={{ fontSize: '12px', fontWeight: 500, letterSpacing: '0.08em', marginBottom: '12px' }}>
            NEW PAPER REVIEW
          </p>
          <h1 style={{ fontSize: 'clamp(24px, 3.5vw, 36px)', fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1.2, marginBottom: '48px' }}>
            논문 리뷰 작성
          </h1>

          <form onSubmit={handleSubmit}>
            {/* 논문 제목 */}
            <div style={{ marginBottom: '24px' }}>
              <label htmlFor="title" style={labelStyle}>논문 제목 *</label>
              <input
                id="title" type="text" value={title} onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Attention Is All You Need"
                style={inputStyle}
                onFocus={e => { e.currentTarget.style.borderColor = 'var(--t3)'; }}
                onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)'; }}
              />
            </div>

            {/* 저자 + 학회/저널 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
              <div>
                <label htmlFor="authors" style={labelStyle}>저자 *</label>
                <input
                  id="authors" type="text" value={authors} onChange={e => setAuthors(e.target.value)}
                  placeholder="e.g. Vaswani et al."
                  style={inputStyle}
                  onFocus={e => { e.currentTarget.style.borderColor = 'var(--t3)'; }}
                  onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)'; }}
                />
              </div>
              <div>
                <label htmlFor="venue" style={labelStyle}>학회 / 저널 *</label>
                <input
                  id="venue" type="text" value={venue} onChange={e => setVenue(e.target.value)}
                  placeholder="e.g. NeurIPS 2024"
                  style={inputStyle}
                  onFocus={e => { e.currentTarget.style.borderColor = 'var(--t3)'; }}
                  onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)'; }}
                />
              </div>
            </div>

            {/* 연도 + 원문 링크 */}
            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '16px', marginBottom: '24px' }}>
              <div>
                <label htmlFor="year" style={labelStyle}>출판 연도</label>
                <input
                  id="year" type="number" value={year} onChange={e => setYear(Number(e.target.value))}
                  min={1990} max={2030}
                  style={inputStyle}
                  onFocus={e => { e.currentTarget.style.borderColor = 'var(--t3)'; }}
                  onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)'; }}
                />
              </div>
              <div>
                <label htmlFor="paperUrl" style={labelStyle}>원문 링크 (선택)</label>
                <input
                  id="paperUrl" type="url" value={paperUrl} onChange={e => setPaperUrl(e.target.value)}
                  placeholder="https://arxiv.org/abs/..."
                  style={inputStyle}
                  onFocus={e => { e.currentTarget.style.borderColor = 'var(--t3)'; }}
                  onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)'; }}
                />
              </div>
            </div>

            {/* 한 줄 요약 */}
            <div style={{ marginBottom: '24px' }}>
              <label htmlFor="tldr" style={labelStyle}>한 줄 요약 (TL;DR) *</label>
              <input
                id="tldr" type="text" value={tldr} onChange={e => setTldr(e.target.value)}
                placeholder="이 논문의 핵심 기여를 한 문장으로 요약"
                style={inputStyle}
                onFocus={e => { e.currentTarget.style.borderColor = 'var(--t3)'; }}
                onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)'; }}
              />
            </div>

            {/* 노드 이름 (지식 그래프) */}
            <div style={{ marginBottom: '24px' }}>
              <label htmlFor="nodeLabel" style={labelStyle}>지식 그래프 노드 이름 (선택)</label>
              <input
                id="nodeLabel" type="text" value={nodeLabel} onChange={e => setNodeLabel(e.target.value)}
                placeholder="미입력 시 논문 제목이 사용됩니다"
                style={inputStyle}
                onFocus={e => { e.currentTarget.style.borderColor = 'var(--t3)'; }}
                onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)'; }}
              />
            </div>

            {/* 태그 */}
            <div style={{ marginBottom: '24px' }}>
              <label htmlFor="tags" style={labelStyle}>태그 (콤마로 구분)</label>
              <input
                id="tags" type="text" value={tagsInput} onChange={e => setTagsInput(e.target.value)}
                placeholder="e.g. Transformer, NLP, Attention"
                style={inputStyle}
                onFocus={e => { e.currentTarget.style.borderColor = 'var(--t3)'; }}
                onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)'; }}
              />
              {tagsInput && (
                <div style={{ display: 'flex', gap: '4px', marginTop: '8px', flexWrap: 'wrap' }}>
                  {tagsInput.split(',').map(t => t.trim()).filter(Boolean).map(tag => (
                    <span key={tag} className="tag">{tag}</span>
                  ))}
                </div>
              )}
            </div>

            {/* 평점 */}
            <div style={{ marginBottom: '32px' }}>
              <label style={labelStyle}>평점</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                {[1, 2, 3, 4, 5].map(n => (
                  <button
                    key={n} type="button" onClick={() => setRating(n)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', display: 'flex' }}
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24"
                      fill={n <= rating ? 'var(--accent)' : 'none'}
                      stroke={n <= rating ? 'var(--accent)' : 'var(--t4)'}
                      strokeWidth="2"
                    >
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                  </button>
                ))}
                <span className="mono" style={{ fontSize: '13px', color: 'var(--t3)', marginLeft: '8px' }}>{rating}/5</span>
              </div>
            </div>

            {/* 마크다운 에디터 */}
            <div style={{ marginBottom: '24px' }}>
              <label style={labelStyle}>리뷰 내용 (마크다운) *</label>
              <MarkdownEditor
                value={content}
                onChange={setContent}
                placeholder="## 핵심 내용\n\n이 논문은...\n\n## 방법론\n\n## 실험 결과\n\n## 의견"
              />
            </div>

            {/* 발행 여부 */}
            <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input
                id="published" type="checkbox" checked={published} onChange={e => setPublished(e.target.checked)}
                style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: 'var(--accent)' }}
              />
              <label htmlFor="published" style={{ fontSize: '14px', fontWeight: 500, cursor: 'pointer' }}>바로 발행하기</label>
            </div>

            {/* Error */}
            {error && (
              <div style={{ padding: '12px 16px', marginBottom: '24px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', fontSize: '14px' }}>
                {error}
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <button type="submit" className="btn-primary" disabled={isSaving} style={{ opacity: isSaving ? .6 : 1, cursor: isSaving ? 'not-allowed' : 'pointer' }}>
                {isSaving ? '저장 중...' : '저장'}
              </button>
              <button type="button" className="btn-ghost" onClick={() => router.back()}>취소</button>
            </div>
          </form>
        </div>
      </section>

      <Modal isOpen={modalState.isOpen} onClose={closeModal} onConfirm={modalState.onConfirm} title={modalState.title} message={modalState.message} type={modalState.type} />
    </main>
  );
}
