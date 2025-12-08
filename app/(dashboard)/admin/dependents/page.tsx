import { prisma } from '@/lib/db/prisma';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DependentTable } from '@/components/features/dependents/dependent-table'; 

export const dynamic = 'force-dynamic';

async function getDependents() {
  const users = await prisma.user.findMany({
    where: { role: 'DEPENDENT' }, // 1. กรองเฉพาะผู้สูงอายุ
    include: {
      dependentProfile: {
        include: {
          // 2. ✅ ดึงข้อมูลผู้ดูแล (CaregiverProfile) ที่ผูกกันอยู่มาด้วย
          caregiver: true 
        }
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  // 3. แปลงข้อมูลให้ตรงกับ Interface ของตาราง
  return users.map((user) => {
    const profile = user.dependentProfile;

    return {
      id: user.id,       // User ID หลัก
      profileId: profile?.id || 0,
      firstName: profile?.firstName || '-',
      lastName: profile?.lastName || '-',
      phone: profile?.phone || '-',
      birthday: profile?.birthday || null,
      gender: profile?.gender || 'UNSPECIFIED',
      isActive: user.isActive,
      
      // 4. ปั้น Object ผู้ดูแลส่งไป
      caregiver: profile?.caregiver ? {
        firstName: profile.caregiver.firstName,
        lastName: profile.caregiver.lastName,
        phone: profile.caregiver.phone || '-'
      } : null
    };
  });
}

export default async function DependentsPage() {
  const dependents = await getDependents();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">จัดการผู้ที่มีภาวะพึ่งพิง</h1>
        <p className="text-gray-600 mt-1">รายชื่อผู้ที่มีภาวะพึ่งพิงทั้งหมดในระบบ</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>รายชื่อ ({dependents.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {/* ✅ ส่ง props ชื่อ data ให้ตรงกับ Component */}
          <DependentTable data={dependents} />
        </CardContent>
      </Card>
    </div>
  );
}