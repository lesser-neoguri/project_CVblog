import Link from 'next/link';

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 20px',
        background: 'var(--bg-primary)',
        color: 'var(--text-primary)',
      }}
    >
      <div style={{ maxWidth: '600px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '64px', fontWeight: 700, marginBottom: '16px' }}>
          404
        </h1>
        <h2 style={{ fontSize: '28px', fontWeight: 600, marginBottom: '16px' }}>
          프로필을 찾을 수 없습니다
        </h2>
        <p style={{ fontSize: '16px', color: 'var(--text-tertiary)', marginBottom: '32px' }}>
          요청하신 프로필 페이지가 존재하지 않거나 삭제되었습니다.
        </p>
        <Link
          href="/"
          style={{
            display: 'inline-block',
            padding: '12px 28px',
            fontSize: '15px',
            fontWeight: 600,
            background: 'var(--accent-gradient)',
            color: 'white',
            borderRadius: 'var(--radius-md)',
            textDecoration: 'none',
          }}
        >
          홈으로 돌아가기
        </Link>
      </div>
    </div>
  );
}
