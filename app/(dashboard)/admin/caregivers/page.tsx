import { prisma } from '@/lib/db/prisma';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// ✅ ตรวจสอบว่าไฟล์นี้มีอยู่จริงที่ path นี้
import { CaregiverTable } from '@/components/features/caregivers/caregiver-table';

export const dynamic = 'force-dynamic';

async function getCaregivers() {
  const users = await prisma.user.findMany({
    where: { role: 'CAREGIVER' }, // 1. เอาเฉพาะผู้ดูแล
    include: {
      caregiverProfile: {
        include: {
          dependents: true, // 2. ดึงรายการผู้สูงอายุที่ดูแล (เพื่อนับจำนวน)
        }
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  // 3. แปลงข้อมูลให้ตรงกับ Interface CaregiverData
  return users.map((user) => {
    const profile = user.caregiverProfile;
    
    // คำนวณอายุ
    let age: number | string = '-';
    if (profile?.birthday) {
        const today = new Date();
        const birthDate = new Date(profile.birthday);
        let years = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            years--;
        }
        age = years;
    }

    return {
      id: user.id,
      firstName: profile?.firstName || '-',
      lastName: profile?.lastName || '-',
      phone: profile?.phone || '-',
      age: age,
      gender: profile?.gender || 'UNSPECIFIED',
      dependentCount: profile?.dependents.length || 0, // นับจำนวน
      isActive: user.isActive,
    };
  });
}

export default async function CaregiversPage() {
  // ✅ ตั้งชื่อตัวแปรว่า caregivers
  const caregivers = await getCaregivers();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">จัดการผู้ดูแล</h1>
        <p className="text-gray-600 mt-1">รายชื่อญาติหรือผู้ดูแลทั้งหมดในระบบ</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>รายชื่อ ({caregivers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {/* ✅ ส่งตัวแปร caregivers เข้าไป (ชื่อต้องตรงกัน) */}
          <CaregiverTable data={caregivers} />
        </CardContent>
      </Card>
    </div>
  );
}