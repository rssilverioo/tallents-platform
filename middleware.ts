import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const token = req.cookies.get("tallents_session")?.value;

  // se não tiver sessão, manda pro login
  if (!token) {
    const url = req.nextUrl.clone();
    url.pathname = "/loginAnalista";
    url.searchParams.set("next", req.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

// 🔒 Protege apenas rotas privadas
export const config = {
  matcher: ["/dashboard/:path*", "/painel/:path*"],
};
