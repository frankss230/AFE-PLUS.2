import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import liff from '@line/liff';

export async function GET(request: NextRequest) {
  try {
    // Get LINE user ID from request or session
    // This is a simplified example
    const lineId = request.headers.get('x-line-userid');

    if (!lineId) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findFirst({
      where: { lineId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true,
        lineId: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ user });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}