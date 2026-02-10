import { getSupabaseAdmin } from './supabase-server';

export const API_KEY_NAMES = [
  'OPENAI_API_KEY',
  'UPSTAGE_API_KEY',
  'UPSTAGE_BASE_URL',
  'UPSTAGE_CHAT_MODEL',
] as const;

export type ApiKeyName = (typeof API_KEY_NAMES)[number];

export interface AppApiKeys {
  OPENAI_API_KEY?: string | null;
  UPSTAGE_API_KEY?: string | null;
  UPSTAGE_BASE_URL?: string | null;
  UPSTAGE_CHAT_MODEL?: string | null;
}

/**
 * DB에 저장된 API 키 조회 (서버 전용). 값이 없으면 null 반환.
 */
export async function getApiKeysFromDb(): Promise<AppApiKeys | null> {
  const admin = getSupabaseAdmin();
  if (!admin) return null;

  const { data, error } = await admin
    .from('app_api_keys')
    .select('key_name, value');

  if (error || !data?.length) return null;

  const out: AppApiKeys = {};
  for (const row of data) {
    if (row.key_name && API_KEY_NAMES.includes(row.key_name as ApiKeyName)) {
      (out as Record<string, string | null>)[row.key_name] = row.value ?? null;
    }
  }
  return out;
}

/**
 * DB에 API 키 저장 (서버 전용). 기존 행은 upsert.
 */
export async function setApiKeysInDb(keys: Partial<AppApiKeys>): Promise<{ ok: boolean; error?: string }> {
  const admin = getSupabaseAdmin();
  if (!admin) return { ok: false, error: 'SUPABASE_SERVICE_ROLE_KEY not configured' };

  const now = new Date().toISOString();
  const rows = Object.entries(keys)
    .filter(([k, v]) => API_KEY_NAMES.includes(k as ApiKeyName) && v != null && String(v).trim() !== '')
    .map(([key_name, value]) => ({ key_name, value: String(value).trim(), updated_at: now }));

  if (rows.length === 0) return { ok: true };

  const { error } = await admin.from('app_api_keys').upsert(rows, {
    onConflict: 'key_name',
    ignoreDuplicates: false,
  });

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

/**
 * 채팅 API에서 사용할 키 결정: env 우선, 없으면 DB.
 */
export function resolveChatApiKeys(env: NodeJS.ProcessEnv, fromDb: AppApiKeys | null): {
  openaiApiKey: string | null;
  upstageApiKey: string | null;
  upstageBaseUrl: string | null;
  upstageChatModel: string | null;
} {
  return {
    openaiApiKey: env.OPENAI_API_KEY?.trim() || fromDb?.OPENAI_API_KEY?.trim() || null,
    upstageApiKey: env.UPSTAGE_API_KEY?.trim() || fromDb?.UPSTAGE_API_KEY?.trim() || null,
    upstageBaseUrl:
      env.UPSTAGE_BASE_URL?.trim() || fromDb?.UPSTAGE_BASE_URL?.trim() || 'https://api.upstage.ai/v1/solar',
    upstageChatModel:
      env.UPSTAGE_CHAT_MODEL?.trim() || fromDb?.UPSTAGE_CHAT_MODEL?.trim() || 'solar-mini',
  };
}
