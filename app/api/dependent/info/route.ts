import { NextResponse } from "next/server";
import { prisma } from '@/lib/db/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing ID" }, { status: 400 });
    }

    const dependent = await prisma.dependentProfile.findUnique({
      where: { 
        id: parseInt(id) 
      },
      select: {
        firstName: true,
        lastName: true,
        phone: true,
        locations: {
          take: 1,
          orderBy: { timestamp: "desc" },
          select: {
            battery: true,
            timestamp: true
          }
        }
      }
    });

    if (!dependent) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({
      firstName: dependent.firstName,
      lastName: dependent.lastName,
      phone: dependent.phone,
      battery: dependent.locations[0]?.battery || 0,
      lastUpdated: dependent.locations[0]?.timestamp || new Date()
    });

  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}