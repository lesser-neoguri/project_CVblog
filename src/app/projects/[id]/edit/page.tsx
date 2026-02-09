'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import MarkdownEditor from '@/components/MarkdownEditor';
import { getProjectById, updateProject } from '@/lib/portfolio';
import { ImplementationSection } from '@/lib/supabase';
import { WEBTOON_DEMO_IMPL_SECTIONS } from '@/lib/webtoon-demo-impl-sections';
import Modal from '@/components/Modal';
import { useModal } from '@/hooks/useModal';

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px', fontSize: '14px', fontFamily: 'var(--font)',
  background: 'var(--bg-alt)', border: '1px solid var(--border)', color: 'var(--t1)',
  outline: 'none', transition: 'border-color .15s',
};
const labelStyle: React.CSSProperties = { display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px', letterSpacing: '0.02em' };
const selectStyle: React.CSSProperties = {
  ...inputStyle, cursor: 'pointer', appearance: 'none' as const,
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', paddingRight: '36px',
};
const focus = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => { e.currentTarget.style.borderColor = 'var(--t3)'; };
const blur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => { e.currentTarget.style.borderColor = 'var(--border)'; };

export default function EditProjectPage() {
  const params = useParams();
  const router = useRouter();
  const { modalState, showAlert, closeModal } = useModal();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [description, setDescription] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [status, setStatus] = useState('in_progress');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [demoUrl, setDemoUrl] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [featured, setFeatured] = useState(false);
  const [published, setPublished] = useState(false);
  const [sortOrder, setSortOrder] = useState(0);
  const [implementationSections, setImplementationSections] = useState<ImplementationSection[]>([]);

  const projectId = params.id as string;
  const isWebtoonDemo = demoUrl.includes('webtoon-chatbot');

  useEffect(() => {
    if (projectId) loadProject();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const loadProject = async () => {
    setLoading(true);
    try {
      const p = await getProjectById(projectId);
      setTitle(p.title);
      setSubtitle(p.subtitle || '');
      setDescription(p.description || '');
      setTagsInput((p.tags || []).join(', '));
      setStatus(p.status);
      setStartDate(p.start_date || '');
      setEndDate(p.end_date || '');
      setDemoUrl(p.demo_url || '');
      setGithubUrl(p.github_url || '');
      setThumbnailUrl(p.thumbnail_url || '');
      setFeatured(p.featured);
      setPublished(p.published);
      setSortOrder(p.sort_order);
      setImplementationSections(
        p.implementation_sections?.length ? p.implementation_sections : WEBTOON_DEMO_IMPL_SECTIONS
      );
    } catch (err: unknown) {
      console.error('로딩 오류:', err);
      setError('프로젝트를 불러오는데 실패했습니다.');
    } finally { setLoading(false); }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault(); setError('');
    if (!title.trim()) { setError('프로젝트 이름을 입력해주세요.'); return; }

    setSaving(true);
    try {
      const tags = tagsInput.split(',').map(t => t.trim()).filter(Boolean);
      const updates: Parameters<typeof updateProject>[1] = {
        title: title.trim(),
        subtitle: subtitle.trim() || null,
        description: description.trim() || null,
        thumbnail_url: thumbnailUrl.trim() || null,
        tags, status: status as 'completed' | 'in_progress' | 'planned',
        start_date: startDate.trim() || null,
        end_date: endDate.trim() || null,
        demo_url: demoUrl.trim() || null,
        github_url: githubUrl.trim() || null,
        featured, published, sort_order: sortOrder,
      };
      if (isWebtoonDemo) updates.implementation_sections = implementationSections;
      await updateProject(projectId, updates);
      showAlert('프로젝트가 수정되었습니다!');
      setTimeout(() => router.push(`/projects/${projectId}`), 800);
    } catch (err: unknown) {
      console.error('저장 오류:', err);
      setError(err instanceof Error ? err.message : '수정 중 오류가 발생했습니다.');
    } finally { setSaving(false); }
  };

  if (loading) {
    return (
      <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span className="mono" style={{ fontSize: '13px', color: 'var(--t3)' }}>loading...</span>
      </main>
    );
  }

  return (
    <main>
      <section style={{ padding: '80px 32px 120px' }}>
        <div style={{ maxWidth: 'var(--content-w)', margin: '0 auto' }}>
          <p className="mono accent" style={{ fontSize: '12px', fontWeight: 500, letterSpacing: '0.08em', marginBottom: '12px' }}>EDIT PROJECT</p>
          <h1 style={{ fontSize: 'clamp(24px, 3.5vw, 36px)', fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1.2, marginBottom: '48px' }}>
            프로젝트 수정
          </h1>

          <form onSubmit={handleSave}>
            <div style={{ marginBottom: '24px' }}>
              <label htmlFor="title" style={labelStyle}>프로젝트 이름 *</label>
              <input id="title" type="text" value={title} onChange={e => setTitle(e.target.value)} style={inputStyle} onFocus={focus} onBlur={blur} />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label htmlFor="subtitle" style={labelStyle}>한 줄 소개</label>
              <input id="subtitle" type="text" value={subtitle} onChange={e => setSubtitle(e.target.value)} style={inputStyle} onFocus={focus} onBlur={blur} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 80px', gap: '16px', marginBottom: '24px' }}>
              <div>
                <label htmlFor="status" style={labelStyle}>상태</label>
                <select id="status" value={status} onChange={e => setStatus(e.target.value)} style={selectStyle} onFocus={focus} onBlur={blur}>
                  <option value="in_progress">진행 중</option>
                  <option value="completed">완료</option>
                  <option value="planned">계획 중</option>
                </select>
              </div>
              <div>
                <label htmlFor="start" style={labelStyle}>시작일</label>
                <input id="start" type="text" value={startDate} onChange={e => setStartDate(e.target.value)} placeholder="YYYY-MM" style={inputStyle} onFocus={focus} onBlur={blur} />
              </div>
              <div>
                <label htmlFor="end" style={labelStyle}>종료일</label>
                <input id="end" type="text" value={endDate} onChange={e => setEndDate(e.target.value)} placeholder="YYYY-MM" style={inputStyle} onFocus={focus} onBlur={blur} />
              </div>
              <div>
                <label htmlFor="order" style={labelStyle}>정렬</label>
                <input id="order" type="number" value={sortOrder} onChange={e => setSortOrder(Number(e.target.value))} style={inputStyle} onFocus={focus} onBlur={blur} />
              </div>
            </div>

            {/* 데모 박스: 데모 URL이 있으면 상세 페이지에서 오른쪽에 라이브 데모 영역이 표시됩니다 */}
            <div style={{ marginBottom: '24px', padding: '20px', background: 'var(--bg-section)', border: '1px solid var(--border)', borderRadius: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <span className="mono" style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.06em', color: 'var(--accent)' }}>데모</span>
                <span style={{ fontSize: '12px', color: 'var(--t3)' }}>URL을 입력하면 프로젝트 상세 페이지 오른쪽에 라이브 데모가 표시됩니다</span>
              </div>
              <input id="demo" type="url" value={demoUrl} onChange={e => setDemoUrl(e.target.value)} placeholder="https://your-demo.example.com" style={inputStyle} onFocus={focus} onBlur={blur} />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label htmlFor="github" style={labelStyle}>GitHub URL</label>
              <input id="github" type="url" value={githubUrl} onChange={e => setGithubUrl(e.target.value)} style={inputStyle} onFocus={focus} onBlur={blur} />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label htmlFor="thumb" style={labelStyle}>썸네일 URL (선택)</label>
              <input id="thumb" type="url" value={thumbnailUrl} onChange={e => setThumbnailUrl(e.target.value)} style={inputStyle} onFocus={focus} onBlur={blur} />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label htmlFor="tags" style={labelStyle}>기술 태그 (콤마로 구분)</label>
              <input id="tags" type="text" value={tagsInput} onChange={e => setTagsInput(e.target.value)} style={inputStyle} onFocus={focus} onBlur={blur} />
              {tagsInput && (
                <div style={{ display: 'flex', gap: '4px', marginTop: '8px', flexWrap: 'wrap' }}>
                  {tagsInput.split(',').map(t => t.trim()).filter(Boolean).map(tag => (
                    <span key={tag} className="tag">{tag}</span>
                  ))}
                </div>
              )}
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={labelStyle}>상세 설명 (마크다운)</label>
              <MarkdownEditor value={description} onChange={setDescription} placeholder="프로젝트 상세 설명..." />
            </div>

            {isWebtoonDemo && (
              <div style={{ marginBottom: '24px', padding: '20px', background: 'var(--bg-section)', border: '1px solid var(--border)', borderRadius: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                  <label style={labelStyle}>지금까지 구현한 내용 (토글 섹션)</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      className="btn-ghost"
                      style={{ fontSize: '12px', padding: '4px 10px' }}
                      onClick={() => setImplementationSections(WEBTOON_DEMO_IMPL_SECTIONS)}
                    >
                      정적 기본값 불러오기
                    </button>
                    <button
                      type="button"
                      className="btn-ghost"
                      style={{ fontSize: '12px', padding: '4px 10px' }}
                      onClick={() => setImplementationSections((prev) => [...prev, { id: `sec-${Date.now()}`, title: '새 섹션', content: '' }])}
                    >
                      + 섹션 추가
                    </button>
                  </div>
                </div>
                <p style={{ fontSize: '12px', color: 'var(--t3)', marginBottom: '16px' }}>
                  상세 페이지 본문 아래에 토글로 표시됩니다. 제목과 내용(마크다운)을 입력하세요.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {implementationSections.map((sec, idx) => (
                    <div key={sec.id} style={{ padding: '14px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '6px' }}>
                      <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                        <input
                          type="text"
                          value={sec.title}
                          onChange={(e) => setImplementationSections((prev) => prev.map((s, i) => (i === idx ? { ...s, title: e.target.value } : s)))}
                          placeholder="섹션 제목"
                          style={{ ...inputStyle, flex: 1 }}
                          onFocus={focus}
                          onBlur={blur}
                        />
                        <button
                          type="button"
                          className="btn-ghost"
                          style={{ fontSize: '12px', color: '#ef4444', padding: '6px 12px', flexShrink: 0 }}
                          onClick={() => setImplementationSections((prev) => prev.filter((_, i) => i !== idx))}
                        >
                          삭제
                        </button>
                      </div>
                      <textarea
                        value={sec.content}
                        onChange={(e) => setImplementationSections((prev) => prev.map((s, i) => (i === idx ? { ...s, content: e.target.value } : s)))}
                        placeholder="마크다운 내용..."
                        rows={4}
                        style={{ ...inputStyle, width: '100%', resize: 'vertical', fontFamily: 'var(--mono)', fontSize: '13px' }}
                        onFocus={focus}
                        onBlur={blur}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '24px', marginBottom: '32px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input id="published" type="checkbox" checked={published} onChange={e => setPublished(e.target.checked)}
                  style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: 'var(--accent)' }} />
                <label htmlFor="published" style={{ fontSize: '14px', fontWeight: 500, cursor: 'pointer' }}>발행됨</label>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input id="featured" type="checkbox" checked={featured} onChange={e => setFeatured(e.target.checked)}
                  style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: 'var(--accent)' }} />
                <label htmlFor="featured" style={{ fontSize: '14px', fontWeight: 500, cursor: 'pointer' }}>Featured</label>
              </div>
            </div>

            {error && (
              <div style={{ padding: '12px 16px', marginBottom: '24px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', fontSize: '14px' }}>
                {error}
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px' }}>
              <button type="submit" className="btn-primary" disabled={saving} style={{ opacity: saving ? .6 : 1 }}>
                {saving ? '저장 중...' : '저장'}
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
