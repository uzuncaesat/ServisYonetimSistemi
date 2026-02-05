import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";

const handler = NextAuth(authOptions);

export const GET = handler;

export async function POST(
  req: Request,
  context: { params: Promise<{ nextauth: string[] }> }
) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || req.headers.get("x-real-ip") || "anonymous";
  const rateLimitError = await checkRateLimit(`login:${ip}`);
  if (rateLimitError) return rateLimitError;
  return handler(req, context);
}
