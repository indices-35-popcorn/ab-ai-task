import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { transferAppeal } from "@/lib/transfer";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(_: Request, context: RouteContext) {
  const { id } = await context.params;

  try {
    const response = await prisma.$transaction((tx) => transferAppeal(tx, id));

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected transfer error";

    return NextResponse.json(
      {
        success: false,
        allTransferred: false,
        results: [],
        error: message,
      },
      { status: 400 },
    );
  }
}
