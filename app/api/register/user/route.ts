import { NextRequest, NextResponse } from 'next/server';
import { registerUser } from '@/services/auth.service';
import { registerSchema } from '@/lib/validations/auth.schema';
import { sendLineNotification } from '@/lib/line/client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate
    const validated = registerSchema.parse(body);

    // Register
    const user = await registerUser(validated);

    // Send LINE confirmation
    if (user.lineId) {
      await sendLineNotification(
        user.lineId,
        `✅ ลงทะเบียนสำเร็จ\n\nยินดีต้อนรับคุณ ${user.firstName} ${user.lastName}\n\nคุณสามารถเริ่มใช้งานระบบได้แล้ว`
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'เกิดข้อผิดพลาด',
      },
      { status: 400 }
    );
  }
}