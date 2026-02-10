import { NextRequest, NextResponse } from 'next/server';
import { getApiKeysFromDb, setApiKeysInDb, type AppApiKeys } from '@/lib/api-keys';

/** DB에 저장된 API 키 존재 여부만 반환 (값은 노출하지 않음) */
export async function GET() {
  const keys = await getApiKeysFromDb();
  const configured =
    !!(keys?.OPENAI_API_KEY?.trim() || keys?.UPSTAGE_API_KEY?.trim());
  return NextResponse.json({ configured });
}

/**
 * API 키 저장. ADMIN_SECRET 헤더와 일치해야 함.
 * body: { adminSecret: string, openaiApiKey?: string, upstageApiKey?: string, upstageBaseUrl?: string, upstageChatModel?: string }
 */
export async function PUT(req: NextRequest) {
  try {
    const adminSecret = process.env.ADMIN_SECRET;
    if (!adminSecret?.trim()) {
      return NextResponse.json(
        { error: 'ADMIN_SECRET이 서버에 설정되어 있지 않습니다. Vercel/.env.local에 ADMIN_SECRET을 추가한 뒤 다시 시도하세요.' },
        { status: 503 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const sent = typeof body.adminSecret === 'string' ? body.adminSecret.trim() : '';
    if (sent !== adminSecret) {
      return NextResponse.json({ error: '인증에 실패했습니다.' }, { status: 401 });
    }

    const updates: Partial<AppApiKeys> = {};
    if (typeof body.openaiApiKey === 'string') updates.OPENAI_API_KEY = body.openaiApiKey.trim() || null;
    if (typeof body.upstageApiKey === 'string') updates.UPSTAGE_API_KEY = body.upstageApiKey.trim() || null;
    if (typeof body.upstageBaseUrl === 'string') updates.UPSTAGE_BASE_URL = body.upstageBaseUrl.trim() || null;
    if (typeof body.upstageChatModel === 'string') updates.UPSTAGE_CHAT_MODEL = body.upstageChatModel.trim() || null;

    const result = await setApiKeysInDb(updates);
    if (!result.ok) {
      return NextResponse.json(
        { error: result.error || '저장 실패' },
        { status: 500 }
      );
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('API keys save error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : '알 수 없는 오류' },
      { status: 500 }
    );
  }
}
