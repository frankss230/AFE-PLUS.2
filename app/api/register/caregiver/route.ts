import { NextRequest, NextResponse } from 'next/server';
import { createCaregiver } from '@/services/caregiver.service';
import { caregiverSchema } from '@/lib/validations/caregiver.schema';
import { getSession } from '@/lib/auth/session';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Validate
    const validated = caregiverSchema.parse(body);

    const dataForService = {
        ...validated,
        birthday: validated.birthday as Date,
    };

    // Create caregiver
    const caregiver = await createCaregiver(session.userId, dataForService);

    return NextResponse.json({
      success: true,
      caregiver,
    });
  } catch (error) {
    console.error('Caregiver registration error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'เกิดข้อผิดพลาด',
      },
      { status: 400 }
    );
  }
}