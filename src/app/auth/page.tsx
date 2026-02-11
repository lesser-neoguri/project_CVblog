'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTheme } from '@/contexts/ThemeContext';
import { signIn, signUp } from '@/lib/supabase';

export default function AuthPage() {
  const { isLightTheme } = useTheme();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email || !password) {
      setError('이메일과 비밀번호를 입력해주세요.');
      return;
    }

    if (mode === 'signup' && password !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    if (password.length < 6) {
      setError('비밀번호는 최소 6자 이상이어야 합니다.');
      return;
    }

    setLoading(true);

    try {
      if (mode === 'signin') {
        await signIn(email, password);
        setSuccess('로그인 성공!');
        const redirect = searchParams.get('redirect') || '/';
        setTimeout(() => router.push(redirect), 800);
      } else {
        await signUp(email, password);
        setSuccess('회원가입 성공! 이메일을 확인해주세요.');
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('알 수 없는 오류가 발생했습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main>
      {/* Hero 영역: 다른 페이지와 톤 맞추기 */}
      <section style={{ padding: '80px 32px 40px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ maxWidth: 'var(--content-w)', margin: '0 auto' }}>
          <p className="mono accent" style={{ fontSize: '12px', fontWeight: 500, letterSpacing: '0.08em', marginBottom: '12px' }}>
            AUTH
          </p>
          <h1 style={{ fontSize: 'clamp(26px, 4vw, 40px)', fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1.2, marginBottom: '8px' }}>
            {mode === 'signin' ? '로그인' : '회원가입'}
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--t3)' }}>
            {mode === 'signin'
              ? '글쓰기 · 프로젝트 추가 등 주요 기능을 사용하려면 로그인해주세요.'
              : '새 계정을 만들어 CV Blog의 모든 기능을 사용해보세요.'}
          </p>
        </div>
      </section>

      {/* 폼 카드 */}
      <section style={{ padding: '40px 32px 120px' }}>
      <div style={{ maxWidth: '480px', margin: '0 auto' }}>
          <div
            style={{
            padding: '24px 0',
            borderTop: '1px solid var(--border)',
            borderBottom: '1px solid var(--border)',
            }}
          >
        <form onSubmit={handleSubmit}>
          {/* 이메일 */}
          <div style={{ marginBottom: '20px' }}>
            <label
              htmlFor="email"
              style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: 600,
                marginBottom: '8px',
              }}
            >
              이메일
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              style={{
                width: '100%',
                padding: '10px 12px',
                fontSize: '14px',
                border: '1px solid var(--border)',
                borderRadius: '4px',
                background: 'var(--bg-alt)',
                color: 'var(--t1)',
                outline: 'none',
              }}
            />
          </div>

          {/* 비밀번호 */}
          <div style={{ marginBottom: mode === 'signup' ? '20px' : '24px' }}>
            <label
              htmlFor="password"
              style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: 600,
                marginBottom: '8px',
              }}
            >
              비밀번호
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="최소 6자 이상"
              style={{
                width: '100%',
                padding: '10px 12px',
                fontSize: '14px',
                border: '1px solid var(--border)',
                borderRadius: '4px',
                background: 'var(--bg-alt)',
                color: 'var(--t1)',
                outline: 'none',
              }}
            />
          </div>

          {/* 비밀번호 확인 (회원가입 시) */}
          {mode === 'signup' && (
            <div style={{ marginBottom: '24px' }}>
              <label
                htmlFor="confirmPassword"
                style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: 600,
                  marginBottom: '8px',
                }}
              >
                비밀번호 확인
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="비밀번호를 다시 입력하세요"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  fontSize: '14px',
                  border: '1px solid var(--border)',
                  borderRadius: '4px',
                  background: 'var(--bg-alt)',
                  color: 'var(--t1)',
                  outline: 'none',
                }}
              />
            </div>
          )}

          {/* 에러/성공 메시지 */}
          {error && (
            <div
              style={{
                padding: '12px 16px',
                marginBottom: '20px',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '8px',
                color: '#ef4444',
                fontSize: '14px',
              }}
            >
              {error}
            </div>
          )}

          {success && (
            <div
              style={{
                padding: '12px 16px',
                marginBottom: '20px',
                background: 'rgba(34, 197, 94, 0.1)',
                border: '1px solid rgba(34, 197, 94, 0.3)',
                borderRadius: '8px',
                color: '#22c55e',
                fontSize: '14px',
              }}
            >
              {success}
            </div>
          )}

          {/* 제출 버튼 */}
          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{
              width: '100%',
              justifyContent: 'center',
              opacity: loading ? 0.7 : 1,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading
              ? '처리 중...'
              : mode === 'signin'
              ? '로그인'
              : '회원가입'}
          </button>
        </form>

        {/* 모드 전환 */}
        <div
          style={{
            marginTop: '20px',
            textAlign: 'center',
            fontSize: '14px',
          }}
        >
          <span style={{ color: 'var(--t3)' }}>
            {mode === 'signin'
              ? '계정이 없으신가요?'
              : '이미 계정이 있으신가요?'}
          </span>{' '}
          <button
            type="button"
            onClick={() => {
              setMode(mode === 'signin' ? 'signup' : 'signin');
              setError('');
              setSuccess('');
            }}
            className="btn-link"
            style={{ fontSize: '14px', padding: 0 }}
          >
            {mode === 'signin' ? '회원가입' : '로그인'}
          </button>
        </div>
      </div>
      </div>
      </section>
    </main>
  );
}
