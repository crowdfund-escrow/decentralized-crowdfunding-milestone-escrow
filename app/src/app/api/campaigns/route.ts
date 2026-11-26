import { NextResponse } from "next/server";
import { prisma } from "@lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await prisma.campaign.findMany({
      orderBy: { createdAt: "desc" },
      include: { milestones: true },
    });
    return NextResponse.json({ data, error: null });
  } catch (e: any) {
    return NextResponse.json({ data: [], error: e.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const b = await req.json();
    if (b.chainId === undefined || !b.creatorWallet || !b.txHash) {
      return NextResponse.json({ data: null, error: "chainId, creatorWallet and txHash are required" }, { status: 400 });
    }
    await prisma.user.upsert({
      where: { wallet: b.creatorWallet },
      update: {},
      create: { wallet: b.creatorWallet },
    });
    const campaign = await prisma.campaign.create({
      data: {
        chainId: Number(b.chainId),
        creatorWallet: b.creatorWallet,
        title: b.title ?? `Campaign #${b.chainId}`,
        description: b.description ?? "",
        imageUrl: b.imageUrl ?? null,
        goalWei: String(b.goalWei ?? "0"),
        deadline: new Date(b.deadline),
        txHash: b.txHash,
        milestones: {
          create: (b.milestones ?? []).map((m: any) => ({
            index: m.index,
            description: m.description ?? "",
            allocationBps: Number(m.allocationBps ?? 0),
          })),
        },
      },
      include: { milestones: true },
    });
    return NextResponse.json({ data: campaign, error: null }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ data: null, error: e.message }, { status: 500 });
  }
}
