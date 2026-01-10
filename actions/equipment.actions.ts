'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db/prisma';
import { messagingApi } from "@line/bot-sdk"; 
import { createBorrowSuccessBubble, createReturnSuccessBubble } from '@/lib/line/flex-messages';
import { getSession } from '@/lib/auth/session';

export async function getEquipments() {
  try {
    const equipments = await prisma.equipment.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
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

export async function addEquipment(data: { name: string; code: string }) {
  try {
    const existing = await prisma.equipment.findUnique({ where: { code: data.code } });
    if (existing) return { success: false, error: 'รหัสครุภัณฑ์นี้มีอยู่แล้ว' };

    await prisma.equipment.create({
      data: {
        name: data.name,
        code: data.code,
        isActive: true,
        status: 'AVAILABLE' 
      }
    });
    
    revalidatePath('/admin/equipment');
    return { success: true };
  } catch (error) {
    return { success: false, error: 'เพิ่มข้อมูลไม่สำเร็จ' };
  }
}

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

export async function deleteEquipment(id: number) {
  try {
    await prisma.equipment.delete({ where: { id } });
    revalidatePath('/admin/equipment');
    return { success: true };
  } catch (error) {
    return { success: false, error: 'ไม่สามารถลบได้' };
  }
}

export async function addBulkEquipment(items: { name: string; code: string }[]) {
  try {
    const codes = items.map(i => i.code);
    const existing = await prisma.equipment.findMany({
        where: { code: { in: codes } },
        select: { code: true }
    });

    if (existing.length > 0) {
        const existingCodes = existing.map(e => e.code).join(', ');
        return { success: false, error: `รหัสครุภัณฑ์เหล่านี้มีอยู่แล้ว: ${existingCodes}` };
    }

    await prisma.equipment.createMany({
      data: items.map(item => ({
        name: item.name,
        code: item.code,
        isActive: true,
        status: 'AVAILABLE'
      })),
      skipDuplicates: true,
    });
    
    revalidatePath('/admin/equipment');
    return { success: true };

  } catch (error) {
    console.error("Bulk create error:", error);
    return { success: false, error: 'เพิ่มข้อมูลไม่สำเร็จ อาจมีรหัสซ้ำ' };
  }
}

export async function getAvailableEquipments() {
  try {
    const equipments = await prisma.equipment.findMany({
      where: { 
        status: 'AVAILABLE',
        isActive: true       
      },
      orderBy: { name: 'asc' },
    });
    return { success: true, data: equipments };
  } catch (error) {
    return { success: false, error: 'ดึงข้อมูลอุปกรณ์ไม่สำเร็จ' };
  }
}

export async function createBorrowRequest(data: {
  caregiverId: number;
  dependentId: number;
  objective: string;
  borrowDate: Date;
  equipmentIds: number[];
}) {
  try {
    const caregiverUser = await prisma.user.findFirst({
        where: { caregiverProfile: { id: data.caregiverId } },
        include: { caregiverProfile: true }
    });
    
    const dependentProfile = await prisma.dependentProfile.findUnique({
        where: { id: data.dependentId }
    });

    const equipments = await prisma.equipment.findMany({
        where: { id: { in: data.equipmentIds } }
    });
    const equipmentNames = equipments.map(e => e.name).join(", ");

    if (!caregiverUser) return { success: false, error: 'ไม่พบข้อมูลผู้ยืม' };

    await prisma.$transaction(async (tx) => {
      const request = await tx.borrowEquipment.create({
        data: {
          borrowerId: data.caregiverId,
          dependentId: data.dependentId,
          objective: data.objective,
          borrowDate: data.borrowDate,
          status: 'PENDING',
        },
      });

      for (const eqId of data.equipmentIds) {
        await tx.borrowEquipmentItem.create({
          data: {
            borrowId: request.id,
            equipmentId: eqId,
          },
        });
      }
    });

    const lineIdToSend = caregiverUser.lineId;
    if (lineIdToSend) {
        try {
            const { MessagingApiClient } = messagingApi;
            const client = new MessagingApiClient({
                channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN || process.env.CHANNEL_ACCESS_TOKEN || '',
            });
            const flexMsg = createBorrowSuccessBubble(
                `${caregiverUser.caregiverProfile?.firstName} ${caregiverUser.caregiverProfile?.lastName}`,
                dependentProfile ? `${dependentProfile.firstName} ${dependentProfile.lastName}` : "-",
                equipmentNames,
                data.borrowDate
            );
            await client.pushMessage({
                to: lineIdToSend,
                messages: [{ type: "flex", altText: "ได้รับคำขอยืมแล้ว", contents: flexMsg as any }]
            });
        } catch (lineError) {
            console.error("️ บันทึกสำเร็จ แต่ส่ง LINE ไม่ผ่าน:", lineError);
        }
    }

    revalidatePath('/admin/borrow-requests');
    return { success: true };

  } catch (error) {
    console.error('Create Borrow Error:', error);
    return { success: false, error: 'บันทึกคำขอไม่สำเร็จ' };
  }
}

export async function getMyBorrowedEquipments(lineId: string) {
  try {
    const user = await prisma.user.findFirst({
        where: { lineId: lineId },
        include: { caregiverProfile: true }
    });

    if (!user || !user.caregiverProfile) return { success: false, error: 'ไม่พบผู้ใช้' };

    const borrows = await prisma.borrowEquipment.findMany({
        where: {
            borrowerId: user.caregiverProfile.id,
            status: { in: ['APPROVED', 'RETURN_PENDING'] }
        },
        include: {
            dependent: true,
            items: {
                include: { equipment: true }
            }
        },
        orderBy: { borrowDate: 'desc' }
    });

    return { success: true, data: borrows };

  } catch (error) {
    console.error(error);
    return { success: false, error: 'ดึงข้อมูลไม่สำเร็จ' };
  }
}

export async function createReturnRequest(borrowId: number) {
    try {
        const updatedBorrow = await prisma.borrowEquipment.update({
            where: { id: borrowId },
            data: { status: 'RETURN_PENDING' },
            include: {
                borrower: { include: { user: true } },
                items: { include: { equipment: true } }
            }
        });

        const lineId = updatedBorrow.borrower?.user?.lineId;
        const equipmentName = updatedBorrow.items.length > 0 
            ? updatedBorrow.items[0].equipment.name 
            : "อุปกรณ์";

        if (lineId) {
            try {
                const { MessagingApiClient } = messagingApi;
                const client = new MessagingApiClient({
                    channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN || process.env.CHANNEL_ACCESS_TOKEN || '',
                });
                const flexMsg = createReturnSuccessBubble(equipmentName, new Date());
                await client.pushMessage({
                    to: lineId,
                    messages: [{ type: "flex", altText: "แจ้งคืนอุปกรณ์เรียบร้อย", contents: flexMsg as any }]
                });
            } catch (err) {
                console.error("️ แจ้งคืนสำเร็จ แต่ส่ง LINE ไม่ผ่าน:", err);
            }
        }

        revalidatePath('/admin/borrow-requests');
        return { success: true };
    } catch (error) {
        console.error("Return Request Error:", error);
        return { success: false, error: 'ทำรายการไม่สำเร็จ' };
    }
}

export async function getTransactionById(id: number) {
  try {
    const transaction = await prisma.borrowEquipment.findUnique({
      where: { id },
      include: {
        borrower: true,
        dependent: true,
        items: { include: { equipment: true } },
        approver: {
          include: { adminProfile: true } 
        },
        history: {
          include: { 
            actor: { include: { adminProfile: true } } 
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!transaction) return { success: false, error: "ไม่พบรายการ" };
    return { success: true, data: transaction };

  } catch (error) {
    console.error(error);
    return { success: false, error: "เกิดข้อผิดพลาดในการดึงข้อมูล" };
  }
}

export async function updateTransactionStatus(transactionId: number, status: string, reason?: string) {
  try {
    const session = await getSession();
    if (!session || !session.userId) {
        return { success: false, error: "Unauthorized: กรุณาเข้าสู่ระบบ" };
    }

    const transaction = await prisma.borrowEquipment.findUnique({
      where: { id: transactionId },
      include: { items: true }
    });

    if (!transaction) return { success: false, error: "ไม่พบรายการ" };

    let updateData: any = { 
        status,
        approverId: session.userId,
        approvedAt: new Date(),
        isEdited: transaction.status !== 'PENDING' && transaction.status !== 'RETURN_PENDING'
    };

    let equipmentUpdateStatus = "";

    if (status === 'APPROVED') {
        updateData.borrowApprovedAt = new Date();
        equipmentUpdateStatus = 'UNAVAILABLE'; 
    } else if (status === 'RETURNED') {
        updateData.returnApprovedAt = new Date();
        equipmentUpdateStatus = 'AVAILABLE';
    } else if (status === 'REJECTED') {
        equipmentUpdateStatus = 'AVAILABLE';
    }

    await prisma.$transaction(async (tx) => {
        
        await tx.borrowEquipment.update({
            where: { id: transactionId },
            data: updateData
        });

        await tx.transactionHistory.create({
            data: {
                borrowId: transactionId,
                actorId: session.userId as number,
                action: status,
                reason: reason || null
            }
        });

        if (equipmentUpdateStatus) {
            const equipmentIds = transaction.items.map(i => i.equipmentId);
            const isActive = equipmentUpdateStatus === 'AVAILABLE';
            
            await tx.equipment.updateMany({
                where: { id: { in: equipmentIds } },
                data: { isActive: isActive }
            });
        }
    });

    revalidatePath('/admin/transactions');
    return { success: true };

  } catch (error) {
    console.error("Update Status Error:", error);
    return { success: false, error: "เกิดข้อผิดพลาดในการอัปเดต" };
  }
}