"use server"; 

import { loginSchema } from "@/lib/validations/auth.schema";
import { loginUser } from "@/services/auth.service";
import { createSession } from "@/lib/auth/session";
import { redirect } from 'next/navigation';
import type { AuthResponse } from "@/types/auth.types";

export async function loginAction(formData: FormData): Promise<AuthResponse> {
    const rawData = {
        username: formData.get('username'),
        password: formData.get('password'),
    };

    const validated = loginSchema.safeParse(rawData);

    if (!validated.success) {
        return { 
            success: false, 
            error: "ข้อมูลไม่ถูกต้อง กรุณาตรวจสอบชื่อผู้ใช้และรหัสผ่าน" 
        };
    }

    try {
        const { user, token } = await loginUser(
            validated.data.username, 
            validated.data.password
        );
        
        if (user.role !== "ADMIN") {
            throw new Error("คุณไม่มีสิทธิ์เข้าถึงส่วนผู้ดูแลระบบ");
        }

        if (!user.isActive) {
            throw new Error("บัญชีของคุณถูกระงับการใช้งาน");
        }

        await createSession(token);

    } catch (error) {
        const errorMessage = error instanceof Error 
            ? error.message 
            : "เกิดข้อผิดพลาดในการเข้าสู่ระบบ";

        return { 
            success: false, 
            error: errorMessage
        };
    }

    redirect('/admin/dashboard');
}
