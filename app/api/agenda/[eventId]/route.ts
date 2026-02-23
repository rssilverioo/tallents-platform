import { NextResponse } from "next/server";
import { getAnalystFromRequest } from "@/app/lib/auth";
import { getCalendarForAnalyst } from "@/app/lib/google";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const analyst = await getAnalystFromRequest(req);
  if (!analyst) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { eventId } = await params;

  try {
    const calendar = await getCalendarForAnalyst(analyst);

    await calendar.events.delete({
      calendarId: "primary",
      eventId,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[DELETE /api/agenda/[eventId]]", err);
    return NextResponse.json(
      { error: "Erro ao excluir evento" },
      { status: 500 }
    );
  }
}
