'use client';

import { useEffect, useRef, useState } from 'react';

type Message = {
  role: 'user' | 'assistant';
  content: string;
  source?: 'api' | 'mock';
};

type HyperclovaChatResponse = {
  message?: string;
  error?: string;
  useFallback?: boolean;
};

async function callHyperclovaChat(
  messages: Message[],
): Promise<HyperclovaChatResponse> {
  const res = await fetch('/api/demo/hyperclovax-chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    }),
  });
  const data: HyperclovaChatResponse = await res
    .json()
    .catch(() => ({} as HyperclovaChatResponse));
  if (!res.ok) {
    return {
      error: data.error || data.message || `오류 ${res.status}`,
      useFallback: Boolean(data.useFallback),
    };
  }
  return { message: data.message ?? '' };
}

const MOCK_REPLIES: string[] = [
  '지금 화면은 HyperCLOVA X SEED 파인튜닝 실험용 데모예요. 실제 파인튜닝 전, 데이터/하이퍼파라미터를 점검하는 느낌으로 사용해 보세요.',
  '좋아요. 이 질문을 그대로 instruction 데이터 한 줄로 넣어도 괜찮을 것 같아요.',
  '학습 데이터는 instruction / input / output 세 칸으로 쪼개서 JSONL로 만드는 걸 추천해요.',
];

function pickMockReply(): string {
  return MOCK_REPLIES[Math.floor(Math.random() * MOCK_REPLIES.length)];
}

export default function HyperclovaFinetuneDemoPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content:
        'HyperCLOVA X 도메인 파인튜닝 실험 데모입니다. 파인튜닝 아이디어, 데이터 설계, 하이퍼파라미터에 대해 편하게 물어보세요.',
      source: 'mock',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [useApi, setUseApi] = useState(true);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [messages, loading]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: text }]);
    setLoading(true);
    setApiError(null);

    if (!useApi) {
      await new Promise((r) => setTimeout(r, 400));
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: pickMockReply(), source: 'mock' },
      ]);
      setLoading(false);
      return;
    }

    const history: Message[] = [...messages, { role: 'user', content: text }];
    const result = await callHyperclovaChat(history);

    if (result.error) {
      setApiError(result.error);
      if (result.useFallback) {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: pickMockReply(), source: 'mock' },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: '응답을 불러오지 못했어요. 설정을 확인한 뒤 다시 시도해 주세요.',
            source: 'api',
          },
        ]);
      }
    } else if (result.message) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: result.message!, source: 'api' },
      ]);
    }

    setLoading(false);
  };

  return (
    <main
      style={{
        minHeight: '100vh',
        maxHeight: '100dvh',
        background: 'var(--bg)',
        color: 'var(--t1)',
        fontFamily: 'var(--font)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* 상단 설명 + 토글 */}
      <header
        style={{
          padding: '12px 16px 8px',
          borderBottom: '1px solid var(--border)',
          background: 'var(--bg-section)',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <div style={{ minWidth: 0 }}>
            <p
              className="mono accent"
              style={{
                fontSize: '10px',
                letterSpacing: '0.08em',
                marginBottom: '4px',
              }}
            >
              HYPERCLOVA X · FINE-TUNING DEMO
            </p>
            <h1
              style={{
                fontSize: '14px',
                fontWeight: 700,
                letterSpacing: '-0.02em',
                marginBottom: '4px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              HyperCLOVA X 튜닝 코치
            </h1>
            <p
              style={{
                fontSize: '11px',
                color: 'var(--t3)',
                lineHeight: 1.5,
              }}
            >
              HyperCLOVAX-SEED-Text-Instruct-1.5B 기반 도메인 파인튜닝 아이디어를 시험해 보는
              미니 챗봇입니다.
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                justifyContent: 'flex-end',
              }}
            >
              <span style={{ fontSize: '11px', color: 'var(--t4)' }}>
                {useApi ? '실제 모델' : '목업'}
              </span>
              <button
                type="button"
                onClick={() => setUseApi((v) => !v)}
                style={{
                  width: 40,
                  height: 20,
                  border: '1px solid var(--border)',
                  background: useApi ? 'var(--accent)' : 'var(--bg)',
                  position: 'relative',
                  cursor: 'pointer',
                }}
              >
                <span
                  style={{
                    position: 'absolute',
                    top: 2,
                    left: useApi ? 20 : 2,
                    width: 15,
                    height: 15,
                    background: 'var(--bg)',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.25)',
                    transition: 'left .18s ease',
                  }}
                />
              </button>
            </div>
            <p
              style={{
                fontSize: '10px',
                color: 'var(--t4)',
                maxWidth: 220,
                lineHeight: 1.4,
                textAlign: 'right',
              }}
            >
              <code>HUGGINGFACE_API_TOKEN</code> 을 <code>.env.local</code> 에 넣으면
              HyperCLOVAX-SEED 모델이 실제로 호출됩니다.
            </p>
          </div>
        </div>
      </header>

      {/* 설명 박스 */}
      <section
        style={{
          padding: '8px 16px 4px',
          borderBottom: '1px solid var(--border)',
          background: 'var(--bg)',
          fontSize: '11px',
          lineHeight: 1.5,
          flexShrink: 0,
        }}
      >
        <div
          style={{
            padding: '8px 10px',
            background: 'var(--bg-section)',
            border: '1px solid var(--border)',
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 1.4fr)',
              columnGap: 8,
              rowGap: 4,
            }}
          >
            <div>
              <div style={{ fontWeight: 600, marginBottom: 2 }}>데이터 포맷</div>
              <p style={{ margin: 0, color: 'var(--t3)' }}>
                instruction / input / output JSONL 한 줄로 정리해서, 여기서 만든 Q&A를 그대로
                옮겨 담는 것을 가정합니다.
              </p>
            </div>
            <div>
              <div style={{ fontWeight: 600, marginBottom: 2 }}>튜닝 가정</div>
              <p style={{ margin: 0, color: 'var(--t3)' }}>
                LoRA, lr≈1e-4, batch≈32, max_steps≈3k 수준으로 베이스 능력은 유지하고 도메인
                표현·말투만 강화하는 방향을 상정합니다.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 중앙: 메시지 리스트 */}
      <div
        ref={scrollRef}
        style={{
          flex: 1,
          minHeight: 0,
          padding: '12px 14px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        {messages.map((m, idx) => (
          <div
            key={idx}
            style={{
              display: 'flex',
              justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start',
            }}
          >
            <div
              style={{
                maxWidth: '88%',
                padding: '9px 12px',
                borderRadius:
                  m.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                background:
                  m.role === 'user' ? 'var(--accent)' : 'var(--bg-section)',
                color: m.role === 'user' ? 'var(--on-accent)' : 'var(--t1)',
                fontSize: '13px',
                lineHeight: 1.6,
                border:
                  m.role === 'assistant' ? '1px solid var(--border)' : 'none',
              }}
            >
              {m.role === 'assistant' && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    marginBottom: 3,
                    fontSize: 10,
                    color: 'var(--t4)',
                  }}
                >
                  <span>HyperCLOVA X</span>
                  {m.source && (
                    <span
                      style={{
                        padding: '1px 5px',
                        borderRadius: 0,
                        border: '1px solid var(--border)',
                        background:
                          m.source === 'api' ? 'var(--accent-dim)' : 'var(--bg)',
                        color:
                          m.source === 'api' ? 'var(--accent)' : 'var(--t4)',
                        fontWeight: 600,
                      }}
                    >
                      {m.source === 'api' ? 'API' : 'MOCK'}
                    </span>
                  )}
                </div>
              )}
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div
              style={{
                padding: '6px 10px',
                borderRadius: '14px 14px 14px 4px',
                background: 'var(--bg-section)',
                border: '1px solid var(--border)',
                fontSize: 12,
                color: 'var(--t3)',
              }}
            >
              생성 중...
            </div>
          </div>
        )}
      </div>

      {/* 하단 입력창 */}
      <footer
        style={{
          padding: '10px 14px 14px',
          borderTop: '1px solid var(--border)',
          background: 'var(--bg-section)',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder="예: 이 데이터를 instruction/input/output으로 나눠서 튜닝해도 될까?"
            style={{
              flex: 1,
              padding: '9px 12px',
              fontSize: 13,
              fontFamily: 'var(--font)',
              border: '1px solid var(--border)',
              background: 'var(--bg)',
              color: 'var(--t1)',
            }}
          />
          <button
            type="button"
            onClick={send}
            disabled={loading}
            style={{
              padding: '9px 14px',
              fontSize: 13,
              fontWeight: 600,
              background: 'var(--accent)',
              color: 'var(--on-accent)',
              border: 'none',
              cursor: loading ? 'default' : 'pointer',
              opacity: loading ? 0.7 : 1,
              whiteSpace: 'nowrap',
            }}
          >
            전송
          </button>
        </div>
        {apiError && (
          <div
            style={{
              marginTop: 8,
              padding: '8px 10px',
              background: 'var(--accent-dim)',
              border: '1px solid var(--accent)',
              fontSize: 11,
              color: 'var(--t1)',
            }}
          >
            <strong style={{ color: 'var(--accent)' }}>모델 호출 오류</strong>
            <p style={{ margin: '4px 0 0' }}>{apiError}</p>
          </div>
        )}
      </footer>
    </main>
  );
}
