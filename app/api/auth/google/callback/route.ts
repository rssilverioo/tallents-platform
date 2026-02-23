import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { getAnalystFromRequest } from "@/app/lib/auth";
import { createOAuth2Client } from "@/app/lib/google";

export async function GET(req: Request) {
  const analyst = await getAnalystFromRequest(req);

  if (!analyst) {
    return NextResponse.redirect(new URL("/loginAnalista", req.url));
  }

  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error || !code) {
    return NextResponse.redirect(
      new URL("/dashboard/agenda?error=google_denied", req.url)
    );
  }

  try {
    const client = createOAuth2Client();
    const { tokens } = await client.getToken(code);

    await prisma.analyst.update({
      where: { id: analyst.id },
      data: {
        googleAccessToken: tokens.access_token ?? null,
        googleRefreshToken: tokens.refresh_token ?? null,
        googleTokenExpiry: tokens.expiry_date
          ? new Date(tokens.expiry_date)
          : null,
      },
    });

    return NextResponse.redirect(
      new URL("/dashboard/agenda?connected=1", req.url)
    );
  } catch (err) {
    console.error("[Google OAuth callback]", err);
    return NextResponse.redirect(
      new URL("/dashboard/agenda?error=token_exchange", req.url)
    );
  }
}
