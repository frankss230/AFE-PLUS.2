'use server';

import { revalidatePath } from 'next/cache';
import prisma from '@/lib/db/prisma';

// 1. ดึงข้อมูลอุปกรณ์ทั้งหมด
export async function getEquipments() {
  try {
    const equipments = await prisma.equipment.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        // เช็คว่าตอนนี้ถูกยืมอยู่ไหม (Status = PENDING หรือ APPROVED)
        borrowItems: {
            where: {
                borrow: {
                    status: { in: ['PENDING', 'APPROVED'] }
                }
            },
            include: { borrow: true }
        }
      }
    });
    return { success: true, data: equipments };
  } catch (error) {
    return { success: false, error: 'ดึงข้อมูลไม่สำเร็จ' };
  }
}

// 2. เพิ่มอุปกรณ์ใหม่ (Add Stock)
export async function addEquipment(data: { name: string; code: string }) {
  try {
    // เช็ค Code ซ้ำ
    const existing = await prisma.equipment.findUnique({ where: { code: data.code } });
    if (existing) return { success: false, error: 'รหัสครุภัณฑ์นี้มีอยู่แล้ว' };

    await prisma.equipment.create({
      data: {
        name: data.name,
        code: data.code,
        isActive: true
      }
    });
    
    revalidatePath('/admin/equipment');
    return { success: true };
  } catch (error) {
    return { success: false, error: 'เพิ่มข้อมูลไม่สำเร็จ' };
  }
}

// 3. แก้ไขข้อมูล
export async function updateEquipment(id: number, data: { name: string; code: string; isActive: boolean }) {
  try {
    await prisma.equipment.update({
      where: { id },
      data: {
        name: data.name,
        code: data.code,
        isActive: data.isActive
      }
    });
    
    revalidatePath('/admin/equipment');
    return { success: true };
  } catch (error) {
    return { success: false, error: 'แก้ไขไม่สำเร็จ' };
  }
}

// 4. ลบอุปกรณ์
export async function deleteEquipment(id: number) {
  try {
    await prisma.equipment.delete({ where: { id } });
    revalidatePath('/admin/equipment');
    return { success: true };
  } catch (error) {
    return { success: false, error: 'ไม่สามารถลบได้ (อาจมีการใช้งานอยู่)' };
  }
}