'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/contexts/ThemeContext';
import { signIn, signUp } from '@/lib/supabase';

export default function AuthPage() {
  const { isLightTheme } = useTheme();
  const router = useRouter();
  
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
        setTimeout(() => router.push('/'), 1000);
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
    <main
      style={{
        minHeight: '100vh',
        background: isLightTheme ? '#FAF8F3' : '#1a1a1a',
        color: isLightTheme ? '#111' : '#fafafa',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 20px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '440px',
          padding: '40px',
          borderRadius: '20px',
          background: isLightTheme
            ? 'rgba(255, 255, 255, 0.8)'
            : 'rgba(255, 255, 255, 0.08)',
          border: isLightTheme
            ? '1px solid rgba(0, 0, 0, 0.08)'
            : '1px solid rgba(255, 255, 255, 0.14)',
          boxShadow: isLightTheme
            ? '0 12px 30px rgba(0,0,0,0.08)'
            : '0 12px 30px rgba(0,0,0,0.35)',
          backdropFilter: 'blur(12px)',
        }}
      >
        <h1
          style={{
            fontSize: '32px',
            fontWeight: 700,
            marginBottom: '8px',
            textAlign: 'center',
          }}
        >
          {mode === 'signin' ? '로그인' : '회원가입'}
        </h1>
        <p
          style={{
            fontSize: '14px',
            opacity: 0.7,
            textAlign: 'center',
            marginBottom: '32px',
          }}
        >
          {mode === 'signin'
            ? 'CV Blog에 오신 것을 환영합니다!'
            : '새 계정을 만들어보세요!'}
        </p>

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
                padding: '12px 16px',
                fontSize: '16px',
                border: isLightTheme
                  ? '1px solid rgba(0, 0, 0, 0.1)'
                  : '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '8px',
                background: isLightTheme
                  ? 'rgba(255, 255, 255, 0.9)'
                  : 'rgba(0, 0, 0, 0.2)',
                color: isLightTheme ? '#111' : '#fafafa',
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
                padding: '12px 16px',
                fontSize: '16px',
                border: isLightTheme
                  ? '1px solid rgba(0, 0, 0, 0.1)'
                  : '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '8px',
                background: isLightTheme
                  ? 'rgba(255, 255, 255, 0.9)'
                  : 'rgba(0, 0, 0, 0.2)',
                color: isLightTheme ? '#111' : '#fafafa',
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
                  padding: '12px 16px',
                  fontSize: '16px',
                  border: isLightTheme
                    ? '1px solid rgba(0, 0, 0, 0.1)'
                    : '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px',
                  background: isLightTheme
                    ? 'rgba(255, 255, 255, 0.9)'
                    : 'rgba(0, 0, 0, 0.2)',
                  color: isLightTheme ? '#111' : '#fafafa',
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
            style={{
              width: '100%',
              padding: '14px',
              fontSize: '16px',
              fontWeight: 600,
              background: isLightTheme ? '#111' : '#fafafa',
              color: isLightTheme ? '#fafafa' : '#111',
              border: 'none',
              borderRadius: '8px',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
              transition: 'opacity 0.2s ease',
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
            marginTop: '24px',
            textAlign: 'center',
            fontSize: '14px',
          }}
        >
          <span style={{ opacity: 0.7 }}>
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
            style={{
              background: 'none',
              border: 'none',
              color: isLightTheme ? '#111' : '#fafafa',
              fontWeight: 600,
              cursor: 'pointer',
              textDecoration: 'underline',
            }}
          >
            {mode === 'signin' ? '회원가입' : '로그인'}
          </button>
        </div>
      </div>
    </main>
  );
}
