import { renderToBuffer, type DocumentProps } from "@react-pdf/renderer";
import React from "react";
import { prisma } from "@/app/lib/prisma";
import { ReportPDF, type ReportData } from "@/app/components/pdf/ReportPDF";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const report = await prisma.analystReport.findUnique({
      where: { id },
      include: {
        athlete: {
          select: { id: true, name: true, team: true, position: true, photo: true },
        },
      },
    });

    if (!report) {
      return new Response(JSON.stringify({ error: "Relatório não encontrado" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const reportData: ReportData = {
      id: report.id,
      title: report.title,
      summary: report.summary,
      tags: Array.isArray(report.tags) ? (report.tags as string[]) : [],
      rating: report.rating,
      intensity: report.intensity,
      decision: report.decision,
      positioning: report.positioning,
      analystName: report.analystName ?? "Analista",
      createdAt: report.createdAt.toISOString(),
      clips: Array.isArray(report.clips) ? (report.clips as ReportData["clips"]) : [],
      counts: report.counts as ReportData["counts"],
      athlete: {
        name: report.athlete.name,
        team: report.athlete.team,
        position: report.athlete.position,
        photo: report.athlete.photo ?? undefined,
      },
    };

    const element = React.createElement(ReportPDF, { report: reportData }) as React.ReactElement<DocumentProps>;
    const buffer = await renderToBuffer(element);
    const filename = `scout-${report.athlete.name.replace(/\s+/g, "-")}.pdf`;

    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    console.error("GET /api/analyst-reports/[id]/pdf error:", err);
    return new Response(JSON.stringify({ error: "Erro ao gerar PDF" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
