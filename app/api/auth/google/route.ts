import { NextResponse } from "next/server";
import { getAnalystFromRequest } from "@/app/lib/auth";
import { getGoogleAuthUrl } from "@/app/lib/google";

export async function GET(req: Request) {
  const analyst = await getAnalystFromRequest(req);

  if (!analyst) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const url = getGoogleAuthUrl();
  return NextResponse.redirect(url);
}
