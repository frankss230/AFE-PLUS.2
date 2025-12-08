import { NextRequest, NextResponse } from 'next/server';
import { getCaregiverById, updateCaregiver, deleteCaregiver } from '@/services/caregiver.service';
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

    if (session.statusId !== 1) {
        return NextResponse.json({ errror: 'Forbidden' }, { status: 403 });
    }

    const caregiverId = parseInt(params.id);
    const caregiver = await getCaregiverById(caregiverId);

    if (!caregiver) {
      return NextResponse.json(
        { error: 'Caregiver not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ caregiver });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch caregiver' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.statusId !== 1) {
        return NextResponse.json({ errror: 'Forbidden' }, { status: 403 });
    }

    const caregiverId = parseInt(params.id);
    const body = await request.json();

    const caregiver = await updateCaregiver(caregiverId, body);

    return NextResponse.json({ success: true, caregiver });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update caregiver' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.statusId !== 1) {
        return NextResponse.json({ errror: 'Forbidden' }, { status: 403 });
    }

    const caregiverId = parseInt(params.id);
    await deleteCaregiver(caregiverId);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete caregiver' },
      { status: 500 }
    );
  }
}