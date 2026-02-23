import { NextResponse } from "next/server";
import { getAnalystFromRequest } from "@/app/lib/auth";
import { getCalendarForAnalyst } from "@/app/lib/google";

// GET /api/agenda — lista eventos próximos
export async function GET(req: Request) {
  const analyst = await getAnalystFromRequest(req);
  if (!analyst) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  if (!analyst.googleAccessToken) {
    return NextResponse.json({ connected: false, events: [] });
  }

  try {
    const calendar = await getCalendarForAnalyst(analyst);

    const response = await calendar.events.list({
      calendarId: "primary",
      timeMin: new Date().toISOString(),
      maxResults: 50,
      singleEvents: true,
      orderBy: "startTime",
    });

    const events = (response.data.items ?? []).map((e) => ({
      id: e.id,
      summary: e.summary,
      description: e.description,
      start: e.start?.dateTime ?? e.start?.date,
      end: e.end?.dateTime ?? e.end?.date,
      htmlLink: e.htmlLink,
    }));

    return NextResponse.json({ connected: true, events });
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "NOT_CONNECTED") {
      return NextResponse.json({ connected: false, events: [] });
    }
    console.error("[GET /api/agenda]", err);
    return NextResponse.json(
      { error: "Erro ao buscar eventos do Google Calendar" },
      { status: 500 }
    );
  }
}

// POST /api/agenda — cria evento
export async function POST(req: Request) {
  const analyst = await getAnalystFromRequest(req);
  if (!analyst) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  if (!analyst.googleAccessToken) {
    return NextResponse.json(
      { error: "Google Calendar não conectado" },
      { status: 400 }
    );
  }

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const { title, description, startDateTime, endDateTime } = body;

  if (!title || !startDateTime || !endDateTime) {
    return NextResponse.json(
      { error: "title, startDateTime e endDateTime são obrigatórios" },
      { status: 400 }
    );
  }

  try {
    const calendar = await getCalendarForAnalyst(analyst);

    const event = await calendar.events.insert({
      calendarId: "primary",
      requestBody: {
        summary: title,
        description: description ?? "",
        start: { dateTime: startDateTime, timeZone: "America/Sao_Paulo" },
        end: { dateTime: endDateTime, timeZone: "America/Sao_Paulo" },
      },
    });

    return NextResponse.json({ ok: true, event: event.data }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/agenda]", err);
    return NextResponse.json(
      { error: "Erro ao criar evento no Google Calendar" },
      { status: 500 }
    );
  }
}
