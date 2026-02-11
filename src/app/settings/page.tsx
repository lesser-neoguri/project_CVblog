'use client';

import { useState, useEffect } from 'react';

export default function SettingsPage() {
  const [adminSecret, setAdminSecret] = useState('');
  const [openaiApiKey, setOpenaiApiKey] = useState('');
  const [upstageApiKey, setUpstageApiKey] = useState('');
  const [upstageBaseUrl, setUpstageBaseUrl] = useState('https://api.upstage.ai/v1/solar');
  const [upstageChatModel, setUpstageChatModel] = useState('solar-mini');
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  useEffect(() => {
    fetch('/api/settings/api-keys')
      .then((r) => r.json())
      .then((d) => setConfigured(d.configured === true))
      .catch(() => setConfigured(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    if (!adminSecret.trim()) {
      setMessage({ type: 'err', text: '관리자 비밀번호를 입력하세요.' });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/settings/api-keys', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-secret': adminSecret.trim(),
        },
        body: JSON.stringify({
          adminSecret: adminSecret.trim(),
          openaiApiKey: openaiApiKey.trim() || undefined,
          upstageApiKey: upstageApiKey.trim() || undefined,
          upstageBaseUrl: upstageBaseUrl.trim() || undefined,
          upstageChatModel: upstageChatModel.trim() || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage({ type: 'err', text: data.error || '저장에 실패했습니다.' });
        setSaving(false);
        return;
      }
      setMessage({ type: 'ok', text: '저장되었습니다. 이제 프로젝트 데모 채팅이 어디서든 사용 가능합니다.' });
      setConfigured(true);
      setOpenaiApiKey('');
      setUpstageApiKey('');
    } finally {
      setSaving(false);
    }
  };

  return (
    <main
      className="content"
      style={{
        minHeight: '100vh',
        padding: '24px 16px',
        maxWidth: 560,
        margin: '0 auto',
      }}
    >
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 8 }}>
        API 키 설정
      </h1>
      <p style={{ color: 'var(--t3)', fontSize: '0.9rem', marginBottom: 24 }}>
        채팅 데모(웹툰 챗봇 등)에서 사용할 API 키를 DB에 저장합니다. 저장하면 배포 환경(Vercel)을 포함해
        어디서든 누구나 채팅을 사용할 수 있습니다. 키는 서버에서만 사용되며 클라이언트에 노출되지 않습니다.
      </p>

      {configured === true && (
        <div
          style={{
            padding: '12px 14px',
            marginBottom: 24,
            background: 'var(--accent-dim)',
            border: '1px solid var(--accent)',
            borderRadius: 0,
            fontSize: '0.9rem',
            color: 'var(--t1)',
          }}
        >
          ✓ 저장된 API 키가 있습니다. 채팅이 동작하는 환경에서는 이미 사용 중입니다.
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>
            관리자 비밀번호 (ADMIN_SECRET)
          </label>
          <input
            type="password"
            value={adminSecret}
            onChange={(e) => setAdminSecret(e.target.value)}
            placeholder="서버에 설정한 ADMIN_SECRET 입력"
            style={{
              width: '100%',
              padding: '10px 12px',
              fontFamily: 'var(--font)',
              border: '1px solid var(--border)',
              background: 'var(--bg)',
              color: 'var(--t1)',
              borderRadius: 0,
            }}
          />
          <p style={{ fontSize: '0.75rem', color: 'var(--t4)', marginTop: 4 }}>
            Vercel 또는 .env.local에 ADMIN_SECRET을 설정한 뒤, 여기서 같은 값을 입력해야 저장할 수 있습니다.
          </p>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>
            OpenAI API Key (선택)
          </label>
          <input
            type="password"
            value={openaiApiKey}
            onChange={(e) => setOpenaiApiKey(e.target.value)}
            placeholder="sk-..."
            autoComplete="off"
            style={{
              width: '100%',
              padding: '10px 12px',
              fontFamily: 'var(--font)',
              border: '1px solid var(--border)',
              background: 'var(--bg)',
              color: 'var(--t1)',
              borderRadius: 0,
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>
            Upstage API Key (선택)
          </label>
          <input
            type="password"
            value={upstageApiKey}
            onChange={(e) => setUpstageApiKey(e.target.value)}
            placeholder="Upstage API 키"
            autoComplete="off"
            style={{
              width: '100%',
              padding: '10px 12px',
              fontFamily: 'var(--font)',
              border: '1px solid var(--border)',
              background: 'var(--bg)',
              color: 'var(--t1)',
              borderRadius: 0,
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>
            Upstage Base URL
          </label>
          <input
            type="url"
            value={upstageBaseUrl}
            onChange={(e) => setUpstageBaseUrl(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px',
              fontFamily: 'var(--font)',
              border: '1px solid var(--border)',
              background: 'var(--bg)',
              color: 'var(--t1)',
              borderRadius: 0,
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>
            Upstage Chat Model
          </label>
          <input
            type="text"
            value={upstageChatModel}
            onChange={(e) => setUpstageChatModel(e.target.value)}
            placeholder="solar-mini"
            style={{
              width: '100%',
              padding: '10px 12px',
              fontFamily: 'var(--font)',
              border: '1px solid var(--border)',
              background: 'var(--bg)',
              color: 'var(--t1)',
              borderRadius: 0,
            }}
          />
        </div>

        {message && (
          <div
            style={{
              padding: '10px 12px',
              background: message.type === 'ok' ? 'var(--accent-dim)' : 'rgba(200,80,80,0.15)',
              border: `1px solid ${message.type === 'ok' ? 'var(--accent)' : 'rgba(200,80,80,0.5)'}`,
              borderRadius: 0,
              color: 'var(--t1)',
              fontSize: '0.9rem',
            }}
          >
            {message.text}
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          style={{
            padding: '12px 16px',
            fontWeight: 600,
            background: 'var(--accent)',
            color: 'var(--on-accent)',
            border: 'none',
            borderRadius: 0,
            cursor: saving ? 'default' : 'pointer',
            opacity: saving ? 0.8 : 1,
          }}
        >
          {saving ? '저장 중…' : 'API 키 저장'}
        </button>
      </form>

      <p style={{ marginTop: 24, fontSize: '0.8rem', color: 'var(--t4)' }}>
        OpenAI 또는 Upstage 중 하나 이상을 저장하면 됩니다. 환경 변수(OPENAI_API_KEY, UPSTAGE_API_KEY)가
        이미 있으면 그걸 우선 사용하고, 없을 때만 DB에 저장된 키를 사용합니다.
      </p>
    </main>
  );
}
