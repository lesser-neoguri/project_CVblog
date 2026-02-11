import { NextRequest, NextResponse } from 'next/server';
import { getClientIp, isRateLimited } from '@/lib/server-security';

/**
 * HyperCLOVA X SEED (HyperCLOVAX-SEED-Text-Instruct-1.5B) 데모용 Chat API
 *
 * - 로컬에서 띄운 Python/FastAPI 모델 서버를 호출합니다.
 * - 환경 변수:
 *   - LOCAL_HYPERCLOVA_URL: 로컬 모델 서버 엔드포인트 (기본: http://localhost:8000/generate)
 *
 *   예: FastAPI 서버는 다음과 같은 스펙을 가진다고 가정합니다.
 *     POST /generate
 *     {
 *       "messages": [{ "role": "user" | "assistant", "content": "..." }, ...],
 *       "max_length": 1024
 *     }
 *     → { "text": "생성된 전체 응답 문자열" }
 */

const LOCAL_MODEL_URL =
  process.env.LOCAL_HYPERCLOVA_URL || 'http://localhost:8000/generate';

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const limited = isRateLimited('hyperclovax-chat', ip, 40, 60_000);
    if (limited.limited) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429, headers: { 'Retry-After': String(limited.retryAfterSec) } },
      );
    }

    const body = await req.json().catch(() => ({}));
    const messages: ChatMessage[] = Array.isArray(body.messages)
      ? body.messages.filter((m: unknown): m is ChatMessage => {
          if (!m || typeof m !== 'object') return false;
          const msg = m as { role?: unknown; content?: unknown };
          const isValidRole =
            msg.role === 'user' || msg.role === 'assistant';
          const isValidContent = typeof msg.content === 'string';
          return isValidRole && isValidContent;
        })
      : [];

    if (!messages.length) {
      return NextResponse.json(
        { error: '대화 메시지가 필요합니다.' },
        { status: 400 },
      );
    }

    const lastUser = messages.filter((m) => m.role === 'user').pop();
    if (!lastUser || !lastUser.content.trim()) {
      return NextResponse.json(
        { error: '사용자 메시지가 비어 있습니다.' },
        { status: 400 },
      );
    }

    if (!LOCAL_MODEL_URL) {
      return NextResponse.json(
        {
          message:
            'LOCAL_HYPERCLOVA_URL 이 설정되어 있지 않습니다. 로컬 HyperCLOVA X 모델 서버를 실행한 뒤 .env.local 에 LOCAL_HYPERCLOVA_URL 을 추가해 주세요.',
          useFallback: true,
        },
        { status: 503 },
      );
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(LOCAL_MODEL_URL);
    } catch {
      return NextResponse.json(
        { error: 'LOCAL_HYPERCLOVA_URL is invalid.' },
        { status: 500 },
      );
    }
    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      return NextResponse.json(
        { error: 'LOCAL_HYPERCLOVA_URL must use http or https.' },
        { status: 500 },
      );
    }

    const modelRes = await fetch(parsedUrl.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages,
        max_length: 1024,
      }),
    });

    if (!modelRes.ok) {
      const text = await modelRes.text().catch(() => '');
      console.error('Local HyperCLOVA server error:', modelRes.status, text);
      const isModelBooting = modelRes.status === 503;
      return NextResponse.json(
        {
          error:
            '로컬 HyperCLOVA X 모델 서버 호출에 실패했습니다. Python 서버가 실행 중인지, 포트/URL 이 맞는지 확인해 주세요.',
          useFallback: isModelBooting,
        },
        { status: modelRes.status },
      );
    }

    const data = (await modelRes.json().catch(() => null)) as
      | { text?: string }
      | null;

    const generated = (data && data.text && data.text.trim()) || '';

    if (!generated) {
      return NextResponse.json({
        message:
          '응답을 생성하지 못했어요. 로컬 모델 서버의 로그와 프롬프트 구성을 다시 한 번 확인해 주세요.',
      });
    }

    return NextResponse.json({ message: generated });
  } catch (err) {
    console.error('HyperCLOVA X demo chat error:', err);
    const message = err instanceof Error ? err.message : '알 수 없는 오류';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

