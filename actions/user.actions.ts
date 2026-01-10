'use server';

import { revalidatePath } from 'next/cache';
import prisma from '@/lib/db/prisma';
import { hashPassword } from '@/lib/auth/password';
import { UserRole } from '@prisma/client';
import { userFormSchema, UserFormInput } from '@/lib/validations/user.schema';
import { caregiverRegisterSchema, CaregiverRegisterInput } from '@/lib/validations/caregiver-register.schema';

export async function checkUserExists(lineId: string) {
  try {
    const user = await prisma.user.findFirst({
      where: { lineId: lineId },
      select: { id: true, role: true }
    });
    return { exists: !!user, role: user?.role };
  } catch (error) {
    console.error('Check User Error:', error);
    return { exists: false };
  }
}

export async function registerUser(data: CaregiverRegisterInput) {
  try {
    const validated = caregiverRegisterSchema.parse(data);

    const existingUser = await prisma.user.findFirst({
      where: { lineId: validated.lineId },
    });

    if (existingUser) {
      return { success: false, error: 'บัญชี LINE นี้ลงทะเบียนไปแล้ว' };
    }

    const randomPassword = Math.random().toString(36).slice(-10);
    const hashedPassword = await hashPassword(randomPassword);

    await prisma.user.create({
      data: {
        username: validated.lineId,
        password: hashedPassword,
        lineId: validated.lineId,
        role: UserRole.CAREGIVER,
        isActive: true,

        caregiverProfile: {
            create: {
                firstName: validated.firstName,
                lastName: validated.lastName,
                phone: validated.phone || '',
                gender: validated.gender,
                marital: validated.marital,
                birthday: new Date(validated.birthday), 
                houseNumber: validated.houseNumber || '',
                village: validated.village || '',
                road: validated.road || '',
                subDistrict: validated.subDistrict || '',
                district: validated.district || '',
                province: validated.province || '',
                postalCode: validated.postalCode || '',
            }
        }
      },
    });

    return { success: true };

  } catch (error) {
    console.error('Register User Error:', error);
    return { success: false, error: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล' };
  }
}

export async function updateUser(userId: number, data: UserFormInput) {
  try {
    const validated = userFormSchema.parse(data);

    const coreUpdateData: any = {
      isActive: validated.isActive,
    };

    if (validated.password && validated.password.length > 0) {
      coreUpdateData.password = await hashPassword(validated.password);
    }

    const currentUser = await prisma.user.findUnique({ where: { id: userId } });

    if (currentUser?.role === 'ADMIN') {
        await prisma.user.update({
            where: { id: userId },
            data: {
                ...coreUpdateData,
                adminProfile: {
                    update: {
                        firstName: validated.firstName,
                        lastName: validated.lastName,
                        phone: validated.phone || '',
                    }
                }
            }
        });
    } else {
        await prisma.user.update({
            where: { id: userId },
            data: {
                ...coreUpdateData,
                caregiverProfile: {
                    update: {
                        firstName: validated.firstName,
                        lastName: validated.lastName,
                        phone: validated.phone || '',
                    }
                }
            },
        });
    }

    revalidatePath('/admin/users');
    revalidatePath(`/admin/users/${userId}`);
    revalidatePath('/admin/settings');

    return { success: true };
    
  } catch (error) {
    console.error('Update User Error:', error);
    return { success: false, error: 'เกิดข้อผิดพลาดในการอัปเดตข้อมูล' };
  }
}

export async function deleteUser(userId: number) {
  try {
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      include: { adminProfile: true }
    });

    if (!targetUser) return { success: false, error: 'ไม่พบข้อมูลผู้ใช้' };

    if (targetUser.role === UserRole.ADMIN) {
      return { success: false, error: `ไม่สามารถลบผู้ดูแลระบบได้` };
    }

    await prisma.user.delete({ where: { id: userId } });

    revalidatePath('/admin/users');
    return { success: true };

  } catch (error: any) {
    console.error('Delete User Error:', error);
    return { success: false, error: 'เกิดข้อผิดพลาดในการลบข้อมูล' };
  }
}

export async function createAdmin(data: any) {
    try {
      const existing = await prisma.user.findUnique({ where: { username: data.username } });
      if (existing) return { success: false, error: 'Username นี้ถูกใช้แล้ว' };
  
      const hashedPassword = await hashPassword(data.password);
  
      await prisma.user.create({
        data: {
          username: data.username,
          password: hashedPassword,
          role: UserRole.ADMIN,
          isActive: true,
          adminProfile: {
            create: {
              firstName: data.firstName,
              lastName: data.lastName,
              phone: data.phone || '',
              position: 'Administrator'
            }
          }
        }
      });
  
      revalidatePath('/admin/settings');
      return { success: true };
    } catch (error) {
      return { success: false, error: 'สร้าง Admin ไม่สำเร็จ' };
    }
}

export async function getCaregiverByLineId(lineId: string) {
    try {
        const user = await prisma.user.findFirst({
            where: { lineId: lineId },
            include: {
                caregiverProfile: true
            }
        });

        if (!user || !user.caregiverProfile) {
            return { success: false, error: 'ไม่พบข้อมูลผู้ใช้' };
        }

        return { success: true, data: user.caregiverProfile };

    } catch (error) {
        console.error('Get Caregiver Error:', error);
        return { success: false, error: 'เกิดข้อผิดพลาดในการดึงข้อมูล' };
    }
}

export async function updateCaregiverProfile(lineId: string, data: CaregiverRegisterInput) {
    try {
        const validated = caregiverRegisterSchema.parse(data);

        const user = await prisma.user.findFirst({
            where: { lineId: lineId }
        });

        if (!user) {
            return { success: false, error: 'ไม่พบผู้ใช้งาน' };
        }

        await prisma.caregiverProfile.update({
            where: { userId: user.id },
            data: {
                firstName: validated.firstName,
                lastName: validated.lastName,
                phone: validated.phone || '',
                gender: validated.gender,
                marital: validated.marital,
                birthday: new Date(validated.birthday),
                houseNumber: validated.houseNumber || '',
                village: validated.village || '',
                road: validated.road || '',
                subDistrict: validated.subDistrict || '',
                district: validated.district || '',
                province: validated.province || '',
                postalCode: validated.postalCode || '',
            }
        });

        return { success: true };

    } catch (error) {
        console.error('Update Caregiver Error:', error);
        return { success: false, error: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล' };
    }
}