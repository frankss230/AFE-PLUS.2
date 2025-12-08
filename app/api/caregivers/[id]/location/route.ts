import { NextRequest, NextResponse } from 'next/server';
import { getLatestLocation } from '@/services/location.service';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const caregiverId = parseInt(params.id);
    const location = await getLatestLocation(caregiverId);

    if (!location) {
      return NextResponse.json(
        { error: 'Location not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ location });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch location' },
      { status: 500 }
    );
  }
}