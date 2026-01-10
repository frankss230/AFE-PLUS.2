import { NextRequest, NextResponse } from 'next/server';
import { loginUser } from '@/services/auth.service';
import { createSession } from '@/lib/auth/session';
import { loginSchema } from '@/lib/validations/auth.schema';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const validated = loginSchema.parse(body);

    const { user, token } = await loginUser(validated.username, validated.password);

    await createSession(token);

    return NextResponse.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'เกิดข้อผิดพลาด' 
      },
      { status: 401 }
    );
  }
}