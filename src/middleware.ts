import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// Giriş/kayıt gerektirmeyen sayfalar
const publicPaths = ["/login", "/register"];

// ALLOW_REGISTRATION=false ise /register -> /login yönlendir
const registrationDisabled = process.env.ALLOW_REGISTRATION === "false";

// Ana domain (subdomain tespiti için)
const ROOT_DOMAIN = process.env.ROOT_DOMAIN || "uzhanerp.com";

/**
 * Subdomain tespit et: firmaa.uzhanerp.com -> "firmaa"
 * localhost ve IP adreslerinde subdomain yok sayılır
 */
function getSubdomain(req: NextRequest): string | null {
  const host = req.headers.get("host") || "";
  
  // localhost veya IP -> subdomain yok
  if (host.includes("localhost") || host.includes("127.0.0.1") || host.match(/^\d+\.\d+\.\d+\.\d+/)) {
    return null;
  }

  // Vercel preview URL -> subdomain yok
  if (host.includes("vercel.app")) {
    return null;
  }

  // firmaa.uzhanerp.com -> "firmaa"
  const parts = host.split(".");
  if (parts.length >= 3) {
    const subdomain = parts[0];
    // www, app gibi reserved subdomain'ler
    if (["www", "app", "api", "admin"].includes(subdomain)) {
      return null;
    }
    return subdomain;
  }

  return null;
}

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  // Subdomain tespiti ve header'a ekleme (API'lar okuyabilsin)
  const subdomain = getSubdomain(req);
  const response = NextResponse.next();
  if (subdomain) {
    // Header olarak taşı, API route'ları bu header'dan okuyabilir
    response.headers.set("x-org-slug", subdomain);
  }

  // Kayıt kapalıysa /register -> /login
  if (registrationDisabled && (pathname === "/register" || pathname.startsWith("/register/"))) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Eski firma kayıt sayfası -> normal kayıta yönlendir
  if (pathname === "/kayit" || pathname.startsWith("/kayit/")) {
    return NextResponse.redirect(new URL("/register", req.url));
  }

  // Public sayfalara herkes girebilir
  if (publicPaths.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return response;
  }

  // API auth, register, payment webhook ve static dosyalar
  if (
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/register") ||
    pathname.startsWith("/api/payments/webhook") ||
    pathname.startsWith("/api/cron/") ||
    pathname.startsWith("/_next") ||
    pathname.includes("favicon") ||
    pathname.includes(".")
  ) {
    return response;
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

  // SUPPLIER rolü sadece /tedarikci (portal) sayfalarına erişebilir - /tedarikciler (liste) ayrı
  const isSupplier = token.role === "SUPPLIER";
  const isSupplierPath = pathname === "/tedarikci" || pathname.startsWith("/tedarikci/");
  const isApiPath = pathname.startsWith("/api/");

  if (isSupplier && !isSupplierPath && !isApiPath) {
    return NextResponse.redirect(new URL("/tedarikci", req.url));
  }

  // Normal kullanıcılar /tedarikci/* sayfalarına erişemez (kendi rolleri dışında)
  if (!isSupplier && isSupplierPath) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return response;
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
