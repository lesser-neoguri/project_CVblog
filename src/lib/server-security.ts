import { timingSafeEqual, createHash } from 'node:crypto';
import type { NextRequest } from 'next/server';

type RateBucket = {
  windowStart: number;
  count: number;
};

const RATE_BUCKETS = new Map<string, RateBucket>();

export function getClientIp(req: NextRequest): string {
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    req.headers.get('cf-connecting-ip') ||
    'unknown';
  return ip;
}

export function isRateLimited(
  bucketPrefix: string,
  key: string,
  limit: number,
  windowMs: number
): { limited: boolean; retryAfterSec: number } {
  const now = Date.now();
  const bucketKey = `${bucketPrefix}:${key}`;
  const existing = RATE_BUCKETS.get(bucketKey);

  if (!existing || now - existing.windowStart >= windowMs) {
    RATE_BUCKETS.set(bucketKey, { windowStart: now, count: 1 });
    return { limited: false, retryAfterSec: 0 };
  }

  existing.count += 1;
  RATE_BUCKETS.set(bucketKey, existing);

  if (existing.count > limit) {
    const retryAfterMs = windowMs - (now - existing.windowStart);
    return {
      limited: true,
      retryAfterSec: Math.max(1, Math.ceil(retryAfterMs / 1000)),
    };
  }

  return { limited: false, retryAfterSec: 0 };
}

export function safeSecretEquals(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export function anonymizeIp(ip: string | null): string | null {
  if (!ip) return null;
  const hash = createHash('sha256').update(ip).digest('hex');
  return hash.slice(0, 16);
}
