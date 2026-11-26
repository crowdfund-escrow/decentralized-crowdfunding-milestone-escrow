import { NextResponse } from "next/server";
import { prisma } from "@lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const campaign = await prisma.campaign.findUnique({ where: { chainId: Number(params.id) } });
    if (!campaign) return NextResponse.json({ data: [], error: "not found" }, { status: 404 });
    const data = await prisma.milestone.findMany({
      where: { campaignId: campaign.id },
      orderBy: { index: "asc" },
    });
    return NextResponse.json({ data, error: null });
  } catch (e: any) {
    return NextResponse.json({ data: [], error: e.message }, { status: 500 });
  }
}
