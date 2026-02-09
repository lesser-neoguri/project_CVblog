'use client';

import { useEffect, useRef } from 'react';

function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { el.classList.add('visible'); observer.unobserve(el); } },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return ref;
}

function Section({ children, style, delay = 0 }: { children: React.ReactNode; style?: React.CSSProperties; delay?: number }) {
  const ref = useReveal();
  return <div ref={ref} className="reveal" style={{ ...style, transitionDelay: `${delay}s` }}>{children}</div>;
}

export default function AboutPage() {
  const techStack = [
    { category: 'FRONTEND', items: ['React', 'Next.js', 'TypeScript', 'Tailwind CSS'] },
    { category: 'BACKEND', items: ['Node.js', 'Supabase', 'PostgreSQL'] },
    { category: 'TOOLS', items: ['Git', 'VS Code', 'Docker', 'Figma'] },
  ];

  const values = [
    { title: '깊이있는 탐구', desc: '표면적인 사용법이 아닌, 기술의 원리와 동작 방식을 이해하고자 합니다.' },
    { title: '명확한 기록', desc: '배운 것을 정리하고 공유하여, 다른 개발자에게도 도움이 되는 글을 작성합니다.' },
    { title: '지속적 성장', desc: '매일 조금씩 더 나은 코드를 작성하고, 더 나은 설계를 고민합니다.' },
  ];

  return (
    <main>
      {/* Hero */}
      <section style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', padding: '0 32px', position: 'relative' }}>
        <div style={{ position: 'absolute', bottom: '10%', left: '-5%', width: '30vw', height: '30vw', background: 'radial-gradient(circle, rgba(0,199,60,0.03) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: 'var(--max-w)', margin: '0 auto', width: '100%' }}>
          <p className="mono accent" style={{ fontSize: '12px', fontWeight: 500, letterSpacing: '0.08em', marginBottom: '24px', animation: 'fadeIn .6s ease-out' }}>
            ABOUT
          </p>
          <h1 style={{ fontSize: 'clamp(32px, 5vw, 64px)', fontWeight: 900, lineHeight: 1.15, letterSpacing: '-0.04em', marginBottom: '24px', animation: 'fadeUp .8s cubic-bezier(0.16,1,0.3,1)' }}>
            코드로 문제를<br />
            해결하는 <span style={{ color: 'var(--t3)' }}>사람</span>
          </h1>
          <p style={{ fontSize: 'clamp(16px, 2vw, 20px)', fontWeight: 300, color: 'var(--t2)', lineHeight: 1.7, maxWidth: '520px', animation: 'fadeUp .8s cubic-bezier(0.16,1,0.3,1) .1s backwards' }}>
            새로운 기술을 배우고, 그 과정을 기록합니다.<br />
            이 블로그는 개발하면서 겪은 경험과 생각을 정리하는 공간입니다.
          </p>
        </div>
      </section>

      {/* Values */}
      <section style={{ background: 'var(--bg-alt)', borderTop: '1px solid var(--border)', padding: '120px 32px' }}>
        <div style={{ maxWidth: 'var(--max-w)', margin: '0 auto' }}>
          <Section>
            <p className="mono accent" style={{ fontSize: '12px', fontWeight: 500, letterSpacing: '0.08em', marginBottom: '12px' }}>VALUES</p>
            <h2 style={{ fontSize: 'clamp(24px, 3.5vw, 44px)', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.2, marginBottom: '64px' }}>
              개발에 대한 <span style={{ color: 'var(--t3)' }}>생각</span>
            </h2>
          </Section>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1px', background: 'var(--border)' }}>
            {values.map((v, i) => (
              <Section key={i} delay={i * 0.08}>
                <div style={{ background: 'var(--bg-alt)', padding: '48px 36px', height: '100%' }}>
                  <span className="mono accent" style={{ fontSize: '12px', fontWeight: 500, display: 'block', marginBottom: '20px' }}>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <h3 style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '12px' }}>
                    {v.title}
                  </h3>
                  <p style={{ fontSize: '14px', color: 'var(--t3)', lineHeight: 1.7 }}>
                    {v.desc}
                  </p>
                </div>
              </Section>
            ))}
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section style={{ borderTop: '1px solid var(--border)', padding: '120px 32px' }}>
        <div style={{ maxWidth: 'var(--max-w)', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '80px', alignItems: 'start' }}>
          <Section>
            <p className="mono accent" style={{ fontSize: '12px', fontWeight: 500, letterSpacing: '0.08em', marginBottom: '12px' }}>TECH STACK</p>
            <h2 style={{ fontSize: 'clamp(24px, 3.5vw, 44px)', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.2, marginBottom: '20px' }}>
              사용하는 <span style={{ color: 'var(--t3)' }}>기술</span>
            </h2>
            <p style={{ fontSize: '15px', color: 'var(--t2)', lineHeight: 1.7 }}>
              프론트엔드를 중심으로, 서비스를 만드는 데 필요한 기술들을 다루고 있습니다.
            </p>
          </Section>

          <Section delay={0.1}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
              {techStack.map((group) => (
                <div key={group.category}>
                  <h3 className="mono" style={{ fontSize: '11px', fontWeight: 600, color: 'var(--t4)', letterSpacing: '0.06em', marginBottom: '12px' }}>
                    {group.category}
                  </h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {group.items.map(item => (
                      <span key={item} className="tag">{item}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Section>
        </div>
      </section>

      {/* Contact */}
      <section style={{ background: 'var(--bg-alt)', borderTop: '1px solid var(--border)', padding: '120px 32px' }}>
        <div style={{ maxWidth: 'var(--max-w)', margin: '0 auto', textAlign: 'center' }}>
          <Section>
            <p className="mono accent" style={{ fontSize: '12px', fontWeight: 500, letterSpacing: '0.08em', marginBottom: '12px' }}>CONTACT</p>
            <h2 style={{ fontSize: 'clamp(24px, 3.5vw, 44px)', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.2, marginBottom: '24px' }}>
              함께 <span style={{ color: 'var(--t3)' }}>이야기해요</span>
            </h2>
            <p style={{ fontSize: '15px', color: 'var(--t2)', lineHeight: 1.7, marginBottom: '40px' }}>
              기술에 대한 이야기, 협업 제안 모두 환영합니다.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="btn-ghost" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 24px', fontSize: '14px' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                GitHub
              </a>
              <a href="mailto:hello@example.com" className="btn-ghost" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 24px', fontSize: '14px' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                Email
              </a>
            </div>
          </Section>
        </div>
      </section>

      {/* Responsive */}
      <style jsx global>{`
        @media (max-width: 768px) {
          section > div[style*="grid-template-columns: repeat(3"] { grid-template-columns: 1fr !important; }
          section > div[style*="grid-template-columns: 1fr 1fr"] { grid-template-columns: 1fr !important; gap: 48px !important; }
        }
      `}</style>
    </main>
  );
}
