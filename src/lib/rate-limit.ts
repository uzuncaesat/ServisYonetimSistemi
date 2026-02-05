/**
 * Rate limiting for auth endpoints. Uses Upstash Redis when configured.
 * UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN required.
 * When not set, rate limiting is skipped (fail-open).
 */
import { NextResponse } from "next/server";

async function getRateLimitChecker() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;

  const { Ratelimit } = await import("@upstash/ratelimit");
  const { Redis } = await import("@upstash/redis");

  const redis = new Redis({ url, token });
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, "1 m"), // 5 requests per minute per identifier
  });
}

export async function checkRateLimit(
  identifier: string
): Promise<NextResponse | null> {
  const ratelimit = await getRateLimitChecker();
  if (!ratelimit) return null;

  const result = await ratelimit.limit(identifier);
  if (!result.success) {
    return NextResponse.json(
      { error: "Çok fazla deneme. Lütfen bir dakika bekleyin." },
      { status: 429 }
    );
  }
  return null;
}
