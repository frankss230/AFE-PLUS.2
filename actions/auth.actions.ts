// actions/auth.actions.ts

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

    // 1. Validation
    const validated = loginSchema.safeParse(rawData);

    if (!validated.success) {
        return { 
            success: false, 
            error: "ข้อมูลไม่ถูกต้อง กรุณาตรวจสอบชื่อผู้ใช้และรหัสผ่าน" 
        };
    }

    try {
        // 2. Login & Create Session
        const { user, token } = await loginUser(validated.data.username, validated.data.password);
        
        if (user.statusId !== 1) { 
            throw new Error("คุณไม่มีสิทธิ์เข้าถึงส่วนผู้ดูแลระบบ");
        }

        await createSession(token);

        // ✅ จุดสำคัญ: อย่าเพิ่ง Redirect ในนี้ เพราะจะโดน Catch จับ
        
    } catch (error) {
        // ถ้าเกิด Error จริงๆ ให้ return error response กลับไป
        const errorMessage = error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการเข้าสู่ระบบ";
        return { 
            success: false, 
            error: errorMessage
        };
    }

    // 3. ✅ Redirect นอก Try/Catch
    // ถ้าโค้ดรันมาถึงตรงนี้ได้ แปลว่า Login สำเร็จ (เพราะถ้าไม่สำเร็จจะติด return ใน catch ไปแล้ว)
    redirect('/admin/dashboard');
}