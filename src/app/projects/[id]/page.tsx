'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import { getProjectById, deleteProject, updateProject } from '@/lib/portfolio';
import { PortfolioProject } from '@/lib/supabase';
import { WEBTOON_DEMO_IMPL_SECTIONS } from '@/lib/webtoon-demo-impl-sections';
import Modal from '@/components/Modal';
import { useModal } from '@/hooks/useModal';

const STATUS_LABEL: Record<string, { text: string; color: string; bg: string }> = {
  completed: { text: '완료', color: '#00c73c', bg: 'rgba(0,199,60,0.1)' },
  in_progress: { text: '진행 중', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
  planned: { text: '계획 중', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
};

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { modalState, showAlert, showConfirm, closeModal } = useModal();

  const [project, setProject] = useState<PortfolioProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  const toggleSection = (id: string) =>
    setOpenSections((prev) => ({ ...prev, [id]: !prev[id] }));

  useEffect(() => {
    if (params.id) load(params.id as string);
  }, [params.id]);

  useEffect(() => {
    if (!project) return;
    window.scrollTo(0, 0);
  }, [project?.id]);

  const load = async (id: string) => {
    setLoading(true); setError('');
    try { setProject(await getProjectById(id)); }
    catch (err: unknown) { console.error('프로젝트 로딩 오류:', err); setError('프로젝트를 불러오는데 실패했습니다.'); }
    finally { setLoading(false); }
  };

  const handleDelete = () => {
    if (!project) return;
    showConfirm('정말로 이 프로젝트를 삭제하시겠습니까?', async () => {
      setIsDeleting(true);
      try { await deleteProject(project.id); showAlert('프로젝트가 삭제되었습니다.'); setTimeout(() => router.push('/projects'), 1000); }
      catch (err: unknown) { console.error('삭제 오류:', err); showAlert('프로젝트 삭제 중 오류가 발생했습니다.'); }
      finally { setIsDeleting(false); }
    }, '프로젝트 삭제');
  };

  const handlePublish = () => {
    if (!project) return;
    showConfirm('이 프로젝트를 발행하시겠습니까?', async () => {
      setIsPublishing(true);
      try { setProject(await updateProject(project.id, { published: true })); showAlert('프로젝트가 발행되었습니다!'); }
      catch (err: unknown) { console.error('발행 오류:', err); showAlert('발행 중 오류가 발생했습니다.'); }
      finally { setIsPublishing(false); }
    });
  };

  const fmtDate = (s: string) => {
    const d = new Date(s);
    return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
  };

  if (loading) {
    return (
      <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span className="mono" style={{ fontSize: '13px', color: 'var(--t3)' }}>loading...</span>
      </main>
    );
  }

  if (error || !project) {
    return (
      <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 32px' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '14px', color: '#ef4444', marginBottom: '20px' }}>{error || '프로젝트를 찾을 수 없습니다.'}</p>
          <button className="btn-ghost" onClick={() => router.push('/projects')}>목록으로</button>
        </div>
      </main>
    );
  }

  const status = STATUS_LABEL[project.status] || STATUS_LABEL.in_progress;
  const hasDemo = Boolean(project.demo_url?.trim());

  const contentArea = (
    <>
      {/* Header */}
      <section style={{ padding: hasDemo ? '80px 32px 0' : '80px 32px 0', maxWidth: hasDemo ? 'none' : 'var(--content-w)', margin: hasDemo ? '0' : '0 auto' }}>
        {/* Nav */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '48px' }}>
          <button className="btn-ghost" onClick={() => router.push('/projects')} style={{ padding: '5px 14px', fontSize: '12px' }}>
            ← 프로젝트
          </button>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button className="btn-ghost" onClick={() => router.push(`/projects/${project.id}/edit`)} style={{ padding: '5px 14px', fontSize: '12px' }}>
              수정
            </button>
            {!project.published && (
              <button className="btn-ghost" onClick={handlePublish} disabled={isPublishing}
                style={{ padding: '5px 14px', fontSize: '12px', color: 'var(--accent)', borderColor: 'var(--accent-dim)', opacity: isPublishing ? .5 : 1 }}>
                {isPublishing ? '발행 중...' : '발행'}
              </button>
            )}
            <button className="btn-ghost" onClick={handleDelete} disabled={isDeleting}
              style={{ padding: '5px 14px', fontSize: '12px', color: '#ef4444', borderColor: 'rgba(239,68,68,0.15)', opacity: isDeleting ? .5 : 1 }}>
              {isDeleting ? '삭제 중...' : '삭제'}
            </button>
          </div>
        </div>

        <header style={{ animation: 'fadeUp .6s cubic-bezier(0.16,1,0.3,1)' }}>
          {!project.published && (
            <span style={{ display: 'inline-block', padding: '2px 8px', fontSize: '11px', fontWeight: 600, background: 'rgba(234,179,8,0.1)', color: '#eab308', marginBottom: '14px' }}>
              비공개
            </span>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
            <span style={{
              padding: '3px 12px', fontSize: '12px', fontFamily: 'var(--mono)', fontWeight: 700,
              background: status.bg, color: status.color, letterSpacing: '0.04em',
            }}>
              {status.text}
            </span>
            {project.start_date && (
              <span className="mono" style={{ fontSize: '12px', color: 'var(--t3)' }}>
                {project.start_date}{project.end_date ? ` → ${project.end_date}` : ' → 현재'}
              </span>
            )}
          </div>

          <h1 style={{ fontSize: 'clamp(24px, 3.5vw, 40px)', fontWeight: 900, lineHeight: 1.25, letterSpacing: '-0.03em', marginBottom: '8px', wordBreak: 'keep-all' }}>
            {project.title}
          </h1>

          {project.subtitle && (
            <p style={{ fontSize: '16px', color: 'var(--t2)', lineHeight: 1.6, marginBottom: '20px', wordBreak: 'keep-all' }}>
              {project.subtitle}
            </p>
          )}

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '20px' }}>
            {project.demo_url && (
              <a href={project.demo_url} target="_blank" rel="noopener noreferrer"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  padding: '8px 20px', fontSize: '13px', fontWeight: 600,
                  background: 'var(--t1)', color: 'var(--bg)',
                  textDecoration: 'none', transition: 'opacity .15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.opacity = '0.85'; }}
                onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                Live Demo
              </a>
            )}
            {project.github_url && (
              <a href={project.github_url} target="_blank" rel="noopener noreferrer"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  padding: '8px 20px', fontSize: '13px', fontWeight: 500,
                  background: 'transparent', color: 'var(--t2)',
                  border: '1px solid var(--border)',
                  textDecoration: 'none', transition: 'all .15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-strong)'; e.currentTarget.style.color = 'var(--t1)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--t2)'; }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                GitHub
              </a>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span className="mono" style={{ fontSize: '12px', color: 'var(--t3)' }}>등록: {fmtDate(project.created_at)}</span>
          </div>

          {project.tags && project.tags.length > 0 && (
            <div style={{ display: 'flex', gap: '4px', marginTop: '16px', flexWrap: 'wrap' }}>
              {project.tags.map(tag => (
                <span key={tag} className="tag">{tag}</span>
              ))}
            </div>
          )}
        </header>
      </section>

      <div style={{ maxWidth: hasDemo ? 'none' : 'var(--content-w)', margin: hasDemo ? '0' : '40px auto', padding: hasDemo ? '0 32px' : '0 32px' }}>
        <div style={{ borderTop: '1px solid var(--border)' }} />
      </div>

      <section style={{ padding: hasDemo ? '0 32px 100px' : '0 32px 100px', maxWidth: hasDemo ? 'none' : 'var(--content-w)', margin: hasDemo ? '0' : '0 auto' }}>
        {project.description ? (
          <div className="markdown-content" style={{ animation: 'fadeIn .6s ease-out .1s backwards' }}>
            <MarkdownRenderer content={project.description} />
          </div>
        ) : (
          <p style={{ fontSize: '14px', color: 'var(--t3)', fontStyle: 'italic' }}>
            아직 상세 설명이 작성되지 않았습니다.
          </p>
        )}

        {project.demo_url?.includes('webtoon-chatbot') && (() => {
            const sectionsToShow = project.implementation_sections != null
              ? project.implementation_sections
              : WEBTOON_DEMO_IMPL_SECTIONS;
            if (sectionsToShow.length === 0) return null;
            return (
          <div style={{ marginTop: '48px', animation: 'fadeIn .6s ease-out .15s backwards' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px', color: 'var(--t1)' }}>
              지금까지 구현한 내용
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--t3)', marginBottom: '20px' }}>
              아래 항목을 클릭하면 해당 내용을 펼쳐 볼 수 있습니다.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {sectionsToShow.map((sec) => {
                const isOpen = openSections[sec.id];
                return (
                  <div
                    key={sec.id}
                    style={{
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      background: isOpen ? 'var(--bg-section)' : 'transparent',
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => toggleSection(sec.id)}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '14px 18px',
                        fontSize: '14px',
                        fontWeight: 600,
                        color: 'var(--t1)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'background .15s',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-section)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = isOpen ? 'var(--bg-section)' : 'none'; }}
                    >
                      <span>{sec.title}</span>
                      <span style={{ flexShrink: 0, marginLeft: '12px', transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
                      </span>
                    </button>
                    {isOpen && (
                      <div className="markdown-content" style={{ padding: '0 18px 18px', borderTop: '1px solid var(--border)' }}>
                        <div style={{ paddingTop: '12px', fontSize: '13px', lineHeight: 1.7, color: 'var(--t2)' }}>
                          <MarkdownRenderer content={sec.content} />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
            );
          })()}
      </section>

      <div style={{ borderTop: '1px solid var(--border)', padding: '24px 32px', maxWidth: hasDemo ? 'none' : 'var(--content-w)', margin: hasDemo ? '0' : '0 auto' }}>
        <button className="btn-ghost" onClick={() => router.push('/projects')} style={{ padding: '6px 16px', fontSize: '13px' }}>
          ← 전체 프로젝트 보기
        </button>
      </div>
    </>
  );

  return (
    <main style={{ minHeight: '100vh' }}>
      {hasDemo ? (
        <div style={{ display: 'flex', flexWrap: 'nowrap', alignItems: 'stretch', minHeight: '100vh' }}>
          <div style={{ flex: '1 1 0', minWidth: 0, maxWidth: 'var(--content-w)', margin: '0 auto' }}>
            {contentArea}
          </div>
          <aside
            style={{
              flex: '0 0 420px',
              width: '420px',
              minHeight: '100vh',
              position: 'sticky',
              top: 0,
              alignSelf: 'flex-start',
              background: 'var(--bg-section)',
              borderLeft: '1px solid var(--border)',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg)', color: 'var(--t1)' }}>
              <span className="mono" style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.06em', color: 'var(--t3)' }}>LIVE DEMO</span>
              <a href={project.demo_url!} target="_blank" rel="noopener noreferrer"
                style={{ fontSize: '12px', color: 'var(--accent)', textDecoration: 'none', fontWeight: 500, transition: 'opacity .15s' }}
                onMouseEnter={e => { e.currentTarget.style.opacity = '0.85'; }}
                onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
              >
                새 탭에서 열기 →
              </a>
            </div>
            <div style={{ flex: 1, minHeight: '400px', position: 'relative', background: 'var(--bg)' }}>
              <iframe
                src={project.demo_url!}
                title="프로젝트 데모"
                style={{
                  position: 'absolute',
                  top: 0, left: 0, right: 0, bottom: 0,
                  width: '100%', height: '100%',
                  border: 'none',
                  background: 'var(--bg)',
                }}
              />
            </div>
          </aside>
        </div>
      ) : (
        <div style={{ maxWidth: 'var(--content-w)', margin: '0 auto' }}>
          {contentArea}
        </div>
      )}

      <Modal isOpen={modalState.isOpen} onClose={closeModal} onConfirm={modalState.onConfirm} title={modalState.title} message={modalState.message} type={modalState.type} />
    </main>
  );
}
