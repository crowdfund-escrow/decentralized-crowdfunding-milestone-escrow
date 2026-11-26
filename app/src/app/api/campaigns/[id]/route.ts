import { NextResponse } from "next/server";
import { prisma } from "@lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const data = await prisma.campaign.findUnique({
      where: { chainId: Number(params.id) },
      include: { milestones: { orderBy: { index: "asc" } } },
    });
    if (!data) return NextResponse.json({ data: null, error: "not found" }, { status: 404 });
    return NextResponse.json({ data, error: null });
  } catch (e: any) {
    return NextResponse.json({ data: null, error: e.message }, { status: 500 });
  }
}
