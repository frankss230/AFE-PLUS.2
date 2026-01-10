import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { hash, genSalt } from 'bcryptjs';
import { UserRole } from '@prisma/client';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { username, password } = body;

        if (!username || !password) {
            return NextResponse.json(
                { message: 'กรุณาระบุ Username และ Password' },
                { status: 400 }
            );
        }

        const hashedPassword = await hash(password, await genSalt(10));

        const assignedRole = UserRole.CAREGIVER;

        const newUser = await prisma.user.create({
            data: {
                username,
                password: hashedPassword,
                role: assignedRole,
                isActive: true,
            }
        });

        return NextResponse.json({
            message: "สร้างบัญชีผู้ใช้สำเร็จ",
            user: { 
                id: newUser.id, 
                username: newUser.username, 
                role: newUser.role 
            }
        }, { status: 201 });

    } catch (err: any) {
        console.error("Error creating user:", err);

        if (err.code === "P2002") {
            return NextResponse.json(
                { message: "Username นี้ถูกใช้งานแล้ว" },
                { status: 409 }
            );
        }

        return NextResponse.json(
            { message: "เกิดข้อผิดพลาดในการสร้างผู้ใช้" },
            { status: 500 }
        );
    }
}