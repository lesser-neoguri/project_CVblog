'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import MarkdownEditor from '@/components/MarkdownEditor';
import { createProject } from '@/lib/portfolio';
import Modal from '@/components/Modal';
import { useModal } from '@/hooks/useModal';
import { getCurrentUser } from '@/lib/supabase';

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

export default function WriteProjectPage() {
  const router = useRouter();
  const { modalState, showAlert, closeModal } = useModal();

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
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [checkingAuth, setCheckingAuth] = useState(true);

  // 페이지 진입 시 로그인 여부 확인 후, 비로그인 상태면 로그인 페이지로 이동
  useEffect(() => {
    (async () => {
      try {
        const user = await getCurrentUser();
        if (!user) {
          router.push('/auth?redirect=/projects/write');
          return;
        }
        setCheckingAuth(false);
      } catch {
        router.push('/auth?redirect=/projects/write');
      }
    })();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError('');
    if (!title.trim()) { setError('프로젝트 이름을 입력해주세요.'); return; }

    setSaving(true);
    try {
      const tags = tagsInput.split(',').map(t => t.trim()).filter(Boolean);
      const project = await createProject({
        title: title.trim(),
        subtitle: subtitle.trim() || undefined,
        description: description.trim() || undefined,
        thumbnail_url: thumbnailUrl.trim() || undefined,
        tags, status,
        start_date: startDate.trim() || undefined,
        end_date: endDate.trim() || undefined,
        demo_url: demoUrl.trim() || undefined,
        github_url: githubUrl.trim() || undefined,
        featured, published,
      });
      showAlert('프로젝트가 저장되었습니다!');
      setTimeout(() => router.push(`/projects/${project.id}`), 1000);
    } catch (err: unknown) {
      console.error('저장 오류:', err);
      setError(err instanceof Error ? err.message : '프로젝트 저장 중 오류가 발생했습니다.');
    } finally { setSaving(false); }
  };

  if (checkingAuth) {
    return (
      <main>
        <section style={{ padding: '80px 32px', textAlign: 'center' }}>
          <p style={{ fontSize: '14px', color: 'var(--t3)' }}>로그인 상태를 확인하는 중입니다...</p>
        </section>
      </main>
    );
  }

  return (
    <main>
      {/* Hero: Projects 페이지와 톤 맞추기 */}
      <section style={{ padding: '80px 32px 40px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ maxWidth: 'var(--content-w)', margin: '0 auto' }}>
          <p className="mono accent" style={{ fontSize: '12px', fontWeight: 500, letterSpacing: '0.08em', marginBottom: '12px' }}>PROJECTS</p>
          <h1 style={{ fontSize: 'clamp(26px, 4vw, 40px)', fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1.2, marginBottom: '8px' }}>
            새 프로젝트 추가
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--t3)' }}>
            포트폴리오에 보여줄 프로젝트 정보를 입력하고, 필요하다면 바로 발행할 수 있습니다.
          </p>
        </div>
      </section>

      {/* Form section */}
      <section style={{ padding: '40px 32px 120px' }}>
        <div style={{ maxWidth: 'var(--content-w)', margin: '0 auto' }}>
          <form onSubmit={handleSubmit}>
            {/* Title */}
            <div style={{ marginBottom: '24px' }}>
              <label htmlFor="title" style={labelStyle}>프로젝트 이름 *</label>
              <input id="title" type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. AI-Powered Blog" style={inputStyle} onFocus={focus} onBlur={blur} />
            </div>

            {/* Subtitle */}
            <div style={{ marginBottom: '24px' }}>
              <label htmlFor="subtitle" style={labelStyle}>한 줄 소개</label>
              <input id="subtitle" type="text" value={subtitle} onChange={e => setSubtitle(e.target.value)} placeholder="프로젝트를 한 줄로 설명해주세요" style={inputStyle} onFocus={focus} onBlur={blur} />
            </div>

            {/* Status + Period */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '24px' }}>
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
                <input id="start" type="text" value={startDate} onChange={e => setStartDate(e.target.value)} placeholder="e.g. 2024-06" style={inputStyle} onFocus={focus} onBlur={blur} />
              </div>
              <div>
                <label htmlFor="end" style={labelStyle}>종료일</label>
                <input id="end" type="text" value={endDate} onChange={e => setEndDate(e.target.value)} placeholder="e.g. 2024-12 (비워두면 진행중)" style={inputStyle} onFocus={focus} onBlur={blur} />
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
              <input id="github" type="url" value={githubUrl} onChange={e => setGithubUrl(e.target.value)} placeholder="https://github.com/..." style={inputStyle} onFocus={focus} onBlur={blur} />
            </div>

            {/* Thumbnail */}
            <div style={{ marginBottom: '24px' }}>
              <label htmlFor="thumb" style={labelStyle}>썸네일 URL (선택)</label>
              <input id="thumb" type="url" value={thumbnailUrl} onChange={e => setThumbnailUrl(e.target.value)} placeholder="https://..." style={inputStyle} onFocus={focus} onBlur={blur} />
            </div>

            {/* Tags */}
            <div style={{ marginBottom: '24px' }}>
              <label htmlFor="tags" style={labelStyle}>기술 태그 (콤마로 구분)</label>
              <input id="tags" type="text" value={tagsInput} onChange={e => setTagsInput(e.target.value)} placeholder="e.g. Next.js, TypeScript, Supabase" style={inputStyle} onFocus={focus} onBlur={blur} />
              {tagsInput && (
                <div style={{ display: 'flex', gap: '4px', marginTop: '8px', flexWrap: 'wrap' }}>
                  {tagsInput.split(',').map(t => t.trim()).filter(Boolean).map(tag => (
                    <span key={tag} className="tag">{tag}</span>
                  ))}
                </div>
              )}
            </div>

            {/* Description */}
            <div style={{ marginBottom: '24px' }}>
              <label style={labelStyle}>상세 설명 (마크다운)</label>
              <MarkdownEditor value={description} onChange={setDescription} placeholder="## 프로젝트 소개\n\n이 프로젝트는...\n\n## 주요 기능\n\n## 기술 스택\n\n## 배운 점" />
            </div>

            {/* Checkboxes */}
            <div style={{ display: 'flex', gap: '24px', marginBottom: '32px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input id="published" type="checkbox" checked={published} onChange={e => setPublished(e.target.checked)}
                  style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: 'var(--accent)' }} />
                <label htmlFor="published" style={{ fontSize: '14px', fontWeight: 500, cursor: 'pointer' }}>바로 발행하기</label>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input id="featured" type="checkbox" checked={featured} onChange={e => setFeatured(e.target.checked)}
                  style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: 'var(--accent)' }} />
                <label htmlFor="featured" style={{ fontSize: '14px', fontWeight: 500, cursor: 'pointer' }}>Featured로 표시</label>
              </div>
            </div>

            {error && (
              <div style={{ padding: '12px 16px', marginBottom: '24px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', fontSize: '14px' }}>
                {error}
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px' }}>
              <button type="submit" className="btn-primary" disabled={saving} style={{ opacity: saving ? .6 : 1, cursor: saving ? 'not-allowed' : 'pointer' }}>
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
