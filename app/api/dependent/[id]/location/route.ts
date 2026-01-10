import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getSession } from '@/lib/auth/session';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const dependentId = parseInt(params.id);

    const location = await prisma.location.findFirst({
      where: {
        dependentId: dependentId
      },
      orderBy: {
        timestamp: 'desc'
      }
    });

    if (!location) {
      return NextResponse.json(
        { error: 'Location not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
        location: {
            lat: location.latitude,
            lng: location.longitude,
            battery: location.battery,
            status: location.status,
            updatedAt: location.timestamp
        } 
    });

  } catch (error) {
    console.error("Location API Error:", error);
    return NextResponse.json(
      { error: 'Failed to fetch location' },
      { status: 500 }
    );
  }
}