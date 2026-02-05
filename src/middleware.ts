import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// Giriş/kayıt gerektirmeyen sayfalar
const publicPaths = ["/login", "/register"];

// ALLOW_REGISTRATION=false ise /register -> /login yönlendir
const registrationDisabled = process.env.ALLOW_REGISTRATION === "false";

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  // Kayıt kapalıysa /register -> /login
  if (registrationDisabled && (pathname === "/register" || pathname.startsWith("/register/"))) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Public sayfalara herkes girebilir
  if (publicPaths.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return NextResponse.next();
  }

  // API auth ve static dosyalar
  if (
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/_next") ||
    pathname.includes("favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Giriş kontrolü
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token) {
    // API çağrıları için 401 JSON; sayfa istekleri için login'e yönlendir
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }
    const loginUrl = new URL("/login", req.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api/auth (NextAuth)
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     */
    "/((?!api/auth|_next/static|_next/image|favicon.ico).*)",
  ],
};
