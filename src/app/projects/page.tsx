'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getProjects } from '@/lib/portfolio';
import { PortfolioProject } from '@/lib/supabase';

function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { el.classList.add('visible'); obs.unobserve(el); } },
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return ref;
}

function Reveal({ children, style, delay = 0 }: { children: React.ReactNode; style?: React.CSSProperties; delay?: number }) {
  const ref = useReveal();
  return <div ref={ref} className="reveal" style={{ ...style, transitionDelay: `${delay}s` }}>{children}</div>;
}

/* ═══ Project List (단일 열) ═══ */
function ProjectList({
  projects,
  delayStep = 0.04,
  onProjectClick,
}: {
  projects: PortfolioProject[];
  delayStep?: number;
  onProjectClick: (id: string) => void;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {projects.map((project, i) => (
        <Reveal key={project.id} delay={i * delayStep}>
          <ProjectCard project={project} onClick={() => onProjectClick(project.id)} layout="list" />
        </Reveal>
      ))}
    </div>
  );
}

/* ═══ Project Grid (선택 시에만) ═══ */
function ProjectGrid({
  projects,
  delayStep = 0.04,
  onProjectClick,
}: {
  projects: PortfolioProject[];
  delayStep?: number;
  onProjectClick: (id: string) => void;
}) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
        gap: '24px',
        alignItems: 'stretch',
      }}
    >
      {projects.map((project, i) => (
        <Reveal key={project.id} delay={i * delayStep} style={{ minWidth: 0, minHeight: 0, width: '100%', display: 'flex' }}>
          <ProjectCard project={project} onClick={() => onProjectClick(project.id)} layout="grid" />
        </Reveal>
      ))}
    </div>
  );
}

const STATUS_LABEL: Record<string, { text: string; color: string; bg: string }> = {
  completed: { text: '완료', color: '#00c73c', bg: 'rgba(0,199,60,0.1)' },
  in_progress: { text: '진행 중', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
  planned: { text: '계획 중', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
};

export default function ProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<PortfolioProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAll, setShowAll] = useState(false);
  const [filterTag, setFilterTag] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [layout, setLayout] = useState<'list' | 'grid'>('list');

  useEffect(() => { loadProjects(); }, [showAll]);

  const loadProjects = async () => {
    setLoading(true); setError('');
    try {
      // 목록은 항상 발행 여부와 상관없이 전체 프로젝트를 보여준다.
      setProjects(await getProjects(false));
    } catch {
      setError('프로젝트를 불러오는데 실패했습니다.');
    } finally { setLoading(false); }
  };

  const allTags = Array.from(new Set(projects.flatMap(p => p.tags || []))).sort();

  const filtered = projects.filter(p => {
    if (filterTag && !p.tags?.includes(filterTag)) return false;
    if (filterStatus && p.status !== filterStatus) return false;
    return true;
  });

  return (
    <main>
      {/* Hero */}
      <section style={{ padding: '80px 32px 0' }}>
        <div style={{ maxWidth: 'var(--max-w)', margin: '0 auto' }}>
          <p className="mono accent" style={{ fontSize: '12px', fontWeight: 500, letterSpacing: '0.08em', marginBottom: '12px', animation: 'fadeIn .6s ease-out' }}>
            PROJECTS
          </p>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '16px', flexWrap: 'wrap', marginBottom: '16px' }}>
            <div>
              <h1 style={{ fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1.2, marginBottom: '8px', animation: 'fadeUp .8s cubic-bezier(0.16,1,0.3,1)' }}>
                프로젝트
              </h1>
              <p style={{ fontSize: '15px', color: 'var(--t2)', lineHeight: 1.6, animation: 'fadeUp .8s cubic-bezier(0.16,1,0.3,1) .05s backwards' }}>
                직접 만든 프로젝트와 사이드 프로젝트를 모아둔 공간입니다
              </p>
            </div>
            <div style={{ display: 'flex', gap: '8px', animation: 'fadeUp .8s cubic-bezier(0.16,1,0.3,1) .1s backwards' }}>
              <button className="btn-ghost" onClick={() => setShowAll(!showAll)} style={{ padding: '6px 14px', fontSize: '12px' }}>
                {showAll ? '발행된 것만' : '전체 보기'}
              </button>
              <button className="btn-primary" onClick={() => router.push('/projects/write')} style={{ padding: '7px 18px', fontSize: '13px' }}>
                프로젝트 추가
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Filters */}
      <section style={{ padding: '24px 32px 0' }}>
        <div style={{ maxWidth: 'var(--max-w)', margin: '0 auto' }}>
          {/* Status filter */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px', animation: 'fadeIn .6s ease-out .1s backwards' }}>
            <button
              onClick={() => setFilterStatus(null)}
              style={{
                padding: '4px 12px', fontSize: '12px', fontFamily: 'var(--mono)',
                background: !filterStatus ? 'var(--t1)' : 'transparent',
                color: !filterStatus ? 'var(--bg)' : 'var(--t3)',
                border: !filterStatus ? 'none' : '1px solid var(--border)',
                cursor: 'pointer', transition: 'all .15s',
              }}
            >ALL</button>
            {Object.entries(STATUS_LABEL).map(([key, { text, color }]) => (
              <button
                key={key}
                onClick={() => setFilterStatus(filterStatus === key ? null : key)}
                style={{
                  padding: '4px 12px', fontSize: '12px', fontFamily: 'var(--mono)',
                  background: filterStatus === key ? color : 'transparent',
                  color: filterStatus === key ? '#fff' : 'var(--t3)',
                  border: filterStatus === key ? 'none' : '1px solid var(--border)',
                  cursor: 'pointer', transition: 'all .15s',
                }}
              >{text}</button>
            ))}
          </div>

          {/* Layout toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', animation: 'fadeIn .6s ease-out .12s backwards' }}>
            <span className="mono" style={{ fontSize: '11px', color: 'var(--t4)' }}>레이아웃</span>
            <div style={{ display: 'flex', gap: '2px' }}>
              <button
                onClick={() => setLayout('list')}
                style={{
                  padding: '4px 12px', fontSize: '12px', fontFamily: 'var(--mono)',
                  background: layout === 'list' ? 'var(--t1)' : 'transparent',
                  color: layout === 'list' ? 'var(--bg)' : 'var(--t3)',
                  border: layout === 'list' ? 'none' : '1px solid var(--border)',
                  cursor: 'pointer', transition: 'all .15s',
                }}
              >리스트</button>
              <button
                onClick={() => setLayout('grid')}
                style={{
                  padding: '4px 12px', fontSize: '12px', fontFamily: 'var(--mono)',
                  background: layout === 'grid' ? 'var(--t1)' : 'transparent',
                  color: layout === 'grid' ? 'var(--bg)' : 'var(--t3)',
                  border: layout === 'grid' ? 'none' : '1px solid var(--border)',
                  cursor: 'pointer', transition: 'all .15s',
                }}
              >그리드</button>
            </div>
          </div>

          {/* Tag filter */}
          {allTags.length > 0 && (
            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', animation: 'fadeIn .6s ease-out .15s backwards' }}>
              {allTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => setFilterTag(filterTag === tag ? null : tag)}
                  style={{
                    padding: '3px 10px', fontSize: '11px', fontFamily: 'var(--mono)',
                    background: filterTag === tag ? 'var(--accent)' : 'transparent',
                    color: filterTag === tag ? '#fff' : 'var(--t4)',
                    border: filterTag === tag ? 'none' : '1px solid var(--border)',
                    cursor: 'pointer', transition: 'all .15s',
                  }}
                >{tag}</button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Divider */}
      <section style={{ padding: '24px 32px 0' }}>
        <div style={{ maxWidth: 'var(--max-w)', margin: '0 auto', borderTop: '1px solid var(--border)' }} />
      </section>

      {/* Project list/grid */}
      <section style={{ padding: '0 40px 120px' }}>
        <div style={{ maxWidth: 'var(--max-w)', margin: '0 auto' }}>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginTop: '32px' }}>
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} style={{ background: 'var(--bg)', height: '140px', borderRadius: '8px', animation: 'pulse 2s infinite', animationDelay: `${i * .1}s` }} />
              ))}
            </div>
          ) : error ? (
            <div style={{ padding: '24px 0', color: '#ef4444', fontSize: '14px' }}>{error}</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: '120px 0', textAlign: 'center' }}>
              <p style={{ fontSize: '15px', color: 'var(--t3)', marginBottom: '8px' }}>
                {filterTag || filterStatus ? '조건에 맞는 프로젝트가 없습니다' : '아직 프로젝트가 없습니다'}
              </p>
              {!filterTag && !filterStatus && (
                <button className="btn-primary" onClick={() => router.push('/projects/write')} style={{ marginTop: '16px' }}>
                  첫 프로젝트 추가하기
                </button>
              )}
            </div>
          ) : (
            <>
              <p className="mono" style={{ fontSize: '12px', color: 'var(--t4)', padding: '20px 0 0' }}>
                {filtered.length}개의 프로젝트
              </p>

              <div style={{ marginTop: '20px' }}>
                {layout === 'list' ? (
                  <ProjectList projects={filtered} delayStep={0.04} onProjectClick={(id) => router.push(`/projects/${id}`)} />
                ) : (
                  <ProjectGrid projects={filtered} delayStep={0.04} onProjectClick={(id) => router.push(`/projects/${id}`)} />
                )}
              </div>
            </>
          )}
        </div>
      </section>
    </main>
  );
}

/* ═══ Project Card ═══ */
function ProjectCard({ project, onClick, layout = 'list' }: { project: PortfolioProject; onClick: () => void; layout?: 'list' | 'grid' }) {
  const status = STATUS_LABEL[project.status] || STATUS_LABEL.in_progress;
  const isList = layout === 'list';

  return (
    <article
      onClick={onClick}
      style={{
        width: '100%',
        minWidth: 0,
        flex: isList ? undefined : 1,
        minHeight: isList ? undefined : '180px',
        padding: isList ? '28px 40px' : '24px',
        background: 'var(--bg)',
        cursor: 'pointer',
        transition: 'background .15s',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        boxSizing: 'border-box',
      }}
      onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-hover)'; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg)'; }}
    >
      {/* Top row: status + dates + 비공개 태그 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        <span style={{
          padding: '2px 8px', fontSize: '10px', fontFamily: 'var(--mono)', fontWeight: 600,
          background: status.bg, color: status.color, letterSpacing: '0.04em',
        }}>
          {status.text}
        </span>
        {!project.published && (
          <span style={{
            padding: '2px 8px',
            fontSize: '10px',
            fontFamily: 'var(--mono)',
            fontWeight: 600,
            background: 'rgba(234,179,8,0.12)',
            color: '#eab308',
            letterSpacing: '0.04em',
          }}>
            비공개
          </span>
        )}
        {project.start_date && (
          <span className="mono" style={{ fontSize: '11px', color: 'var(--t4)' }}>
            {project.start_date}{project.end_date ? ` → ${project.end_date}` : ' → 현재'}
          </span>
        )}
        {project.featured && (
          <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--accent)' }}>★</span>
        )}
      </div>

      {/* Title + subtitle */}
      <div>
        <h3 style={{
          fontSize: isList ? '20px' : '18px',
          fontWeight: 800,
          letterSpacing: '-0.02em',
          lineHeight: 1.3,
          marginBottom: '12px',
          wordBreak: 'keep-all',
        }}>
          {project.title}
        </h3>
        {project.subtitle && (
          <p style={{ fontSize: '14px', color: 'var(--t2)', lineHeight: 1.5, wordBreak: 'keep-all' }}>
            {project.subtitle}
          </p>
        )}
      </div>

      {/* Tags */}
      {project.tags && project.tags.length > 0 && (
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: isList ? undefined : 'auto' }}>
          {project.tags.slice(0, 6).map(tag => (
            <span key={tag} className="tag">{tag}</span>
          ))}
          {project.tags.length > 6 && (
            <span style={{ fontSize: '11px', color: 'var(--t4)' }}>+{project.tags.length - 6}</span>
          )}
        </div>
      )}

      {/* Links indicator */}
      <div style={{ display: 'flex', gap: '12px' }}>
        {project.demo_url && (
          <span style={{ fontSize: '11px', color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '3px' }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
            Demo
          </span>
        )}
        {project.github_url && (
          <span style={{ fontSize: '11px', color: 'var(--t3)', display: 'flex', alignItems: 'center', gap: '3px' }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
            GitHub
          </span>
        )}
      </div>
    </article>
  );
}
