import { NextRequest, NextResponse } from 'next/server';
import { getCaregiversByUserId } from '@/services/caregiver.service';
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

    const userId = parseInt(params.id);
    const caregivers = await getCaregiversByUserId(userId);

    return NextResponse.json({ caregivers });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch caregivers' },
      { status: 500 }
    );
  }
}