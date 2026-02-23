import { google } from "googleapis";
import { prisma } from "@/app/lib/prisma";

const SCOPES = ["https://www.googleapis.com/auth/calendar.events"];

export function createOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
}

export function getGoogleAuthUrl(): string {
  const client = createOAuth2Client();
  return client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    prompt: "consent",
  });
}

export async function getCalendarForAnalyst(analyst: {
  id: string;
  googleAccessToken: string | null;
  googleRefreshToken: string | null;
  googleTokenExpiry: Date | null;
}) {
  if (!analyst.googleAccessToken || !analyst.googleRefreshToken) {
    throw new Error("NOT_CONNECTED");
  }

  const client = createOAuth2Client();
  client.setCredentials({
    access_token: analyst.googleAccessToken,
    refresh_token: analyst.googleRefreshToken,
    expiry_date: analyst.googleTokenExpiry
      ? analyst.googleTokenExpiry.getTime()
      : undefined,
  });

  const isExpired =
    analyst.googleTokenExpiry !== null &&
    analyst.googleTokenExpiry.getTime() - 60_000 < Date.now();

  if (isExpired) {
    const { credentials } = await client.refreshAccessToken();
    client.setCredentials(credentials);

    await prisma.analyst.update({
      where: { id: analyst.id },
      data: {
        googleAccessToken: credentials.access_token ?? analyst.googleAccessToken,
        googleTokenExpiry: credentials.expiry_date
          ? new Date(credentials.expiry_date)
          : analyst.googleTokenExpiry,
      },
    });
  }

  return google.calendar({ version: "v3", auth: client });
}
