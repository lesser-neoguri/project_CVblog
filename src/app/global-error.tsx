'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="ko">
      <body>
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px 20px',
            background: '#1a1a1a',
            color: '#fafafa',
          }}
        >
          <div
            style={{
              maxWidth: '600px',
              textAlign: 'center',
            }}
          >
            <h1
              style={{
                fontSize: '48px',
                fontWeight: 700,
                marginBottom: '16px',
                color: '#ef4444',
              }}
            >
              심각한 오류가 발생했습니다
            </h1>
            <p
              style={{
                fontSize: '18px',
                opacity: 0.8,
                marginBottom: '32px',
              }}
            >
              죄송합니다. 애플리케이션에 심각한 오류가 발생했습니다.
            </p>
            {error && (
              <details
                style={{
                  marginBottom: '32px',
                  padding: '20px',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '8px',
                  textAlign: 'left',
                }}
              >
                <summary
                  style={{
                    cursor: 'pointer',
                    fontWeight: 600,
                    marginBottom: '12px',
                  }}
                >
                  오류 상세 정보
                </summary>
                <pre
                  style={{
                    fontSize: '14px',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    opacity: 0.8,
                  }}
                >
                  {error.message}
                  {error.digest && `\nDigest: ${error.digest}`}
                </pre>
              </details>
            )}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={reset}
                style={{
                  padding: '14px 32px',
                  fontSize: '16px',
                  fontWeight: 600,
                  background: '#fafafa',
                  color: '#111',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'opacity 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = '0.8';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = '1';
                }}
              >
                다시 시도
              </button>
              <button
                onClick={() => {
                  window.location.href = '/';
                }}
                style={{
                  padding: '14px 32px',
                  fontSize: '16px',
                  fontWeight: 600,
                  background: 'transparent',
                  color: '#fafafa',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'opacity 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = '0.8';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = '1';
                }}
              >
                홈으로 돌아가기
              </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
