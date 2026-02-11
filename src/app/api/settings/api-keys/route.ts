import { NextRequest, NextResponse } from 'next/server';
import { getApiKeysFromDb, setApiKeysInDb, type AppApiKeys } from '@/lib/api-keys';
import { getClientIp, isRateLimited, safeSecretEquals } from '@/lib/server-security';

/** DB-stored API key presence only (values are never returned). */
export async function GET() {
  const limited = isRateLimited('settings-api-keys-get', 'global', 60, 60_000);
  if (limited.limited) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: { 'Retry-After': String(limited.retryAfterSec) } }
    );
  }

  const keys = await getApiKeysFromDb();
  const configured = !!(keys?.OPENAI_API_KEY?.trim() || keys?.UPSTAGE_API_KEY?.trim());
  return NextResponse.json({ configured });
}

/**
 * Save API keys to DB.
 * Accepts `x-admin-secret` header (preferred) and `adminSecret` in body (backward compatible).
 * body: { adminSecret?: string, openaiApiKey?: string, upstageApiKey?: string, upstageBaseUrl?: string, upstageChatModel?: string }
 */
export async function PUT(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const limited = isRateLimited('settings-api-keys-put', ip, 10, 60_000);
    if (limited.limited) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429, headers: { 'Retry-After': String(limited.retryAfterSec) } }
      );
    }

    const adminSecret = process.env.ADMIN_SECRET?.trim();
    if (!adminSecret) {
      return NextResponse.json(
        { error: 'ADMIN_SECRET is not configured on the server.' },
        { status: 503 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const sentFromHeader = req.headers.get('x-admin-secret')?.trim();
    const sentFromBody = typeof body.adminSecret === 'string' ? body.adminSecret.trim() : '';
    const sent = sentFromHeader || sentFromBody;

    if (!sent || !safeSecretEquals(sent, adminSecret)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const updates: Partial<AppApiKeys> = {};
    if (typeof body.openaiApiKey === 'string') updates.OPENAI_API_KEY = body.openaiApiKey.trim() || null;
    if (typeof body.upstageApiKey === 'string') updates.UPSTAGE_API_KEY = body.upstageApiKey.trim() || null;
    if (typeof body.upstageBaseUrl === 'string') updates.UPSTAGE_BASE_URL = body.upstageBaseUrl.trim() || null;
    if (typeof body.upstageChatModel === 'string') updates.UPSTAGE_CHAT_MODEL = body.upstageChatModel.trim() || null;

    const result = await setApiKeysInDb(updates);
    if (!result.ok) {
      return NextResponse.json(
        { error: result.error || 'Failed to save API keys' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('API keys save error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
