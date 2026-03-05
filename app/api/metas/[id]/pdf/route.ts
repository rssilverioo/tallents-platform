import { renderToBuffer, type DocumentProps } from "@react-pdf/renderer";
import React from "react";
import { prisma } from "@/app/lib/prisma";
import { MetasPDF, type MetaData } from "@/app/components/pdf/MetasPDF";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const meta = await prisma.meta.findUnique({
      where: { id },
      include: {
        athlete: { select: { id: true, name: true, team: true, position: true, photo: true } },
      },
    });

    if (!meta) {
      return new Response(JSON.stringify({ error: "Meta não encontrada" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const metaData: MetaData = {
      id: meta.id,
      title: meta.title,
      season: meta.season,
      description: meta.description,
      analystName: meta.analystName,
      createdAt: meta.createdAt.toISOString(),
      goals: meta.goals as MetaData["goals"],
      athlete: {
        name: meta.athlete.name,
        team: meta.athlete.team,
        position: meta.athlete.position,
        photo: meta.athlete.photo ?? undefined,
      },
    };

    const element = React.createElement(MetasPDF, { meta: metaData }) as React.ReactElement<DocumentProps>;
    const buffer = await renderToBuffer(element);

    const filename = `metas-${meta.athlete.name.replace(/\s+/g, "-")}-${meta.season.replace(/\//g, "-")}.pdf`;

    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    console.error("GET /api/metas/[id]/pdf error:", err);
    return new Response(JSON.stringify({ error: "Erro ao gerar PDF" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
