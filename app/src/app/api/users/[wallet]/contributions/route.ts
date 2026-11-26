import { NextResponse } from "next/server";
import { prisma } from "@lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { wallet: string } }) {
  try {
    const data = await prisma.contribution.findMany({
      where: { wallet: params.wallet },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ data, error: null });
  } catch (e: any) {
    return NextResponse.json({ data: [], error: e.message }, { status: 500 });
  }
}
