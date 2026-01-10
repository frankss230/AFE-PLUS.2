'use server';

import { prisma } from "@/lib/db/prisma";
import { cookies } from "next/headers";

export async function setAuthCookie(lineUserId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { lineId: lineUserId },
      select: { id: true }
    });

    if (user) {
      (await cookies()).set('userId', user.id.toString(), {
        path: '/',
        maxAge: 86400,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
      });
      return true;
    }
    return false;
  } catch (error) {
    console.error("Set Cookie Error:", error);
    return false;
  }
}