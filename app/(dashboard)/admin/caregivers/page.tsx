import { prisma } from '@/lib/db/prisma';
import CaregiverPageClient from '@/components/features/caregivers/caregiver-page-client'; 

export const dynamic = 'force-dynamic';

async function getCaregivers() {
  const users = await prisma.user.findMany({
    where: { role: 'CAREGIVER' },
    include: {
      caregiverProfile: {
        include: {
          dependents: true,
        }
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return users.map((user) => {
    const profile = user.caregiverProfile;
    
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
      dependentCount: profile?.dependents.length || 0,
      isActive: user.isActive,
    };
  });
}

export default async function CaregiversPage() {
  const caregivers = await getCaregivers();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">จัดการผู้ดูแล</h1>
        <p className="text-gray-600 mt-1">รายชื่อผู้ดูแลทั้งหมดในระบบ</p>
      </div>
      <CaregiverPageClient initialData={caregivers} />
    </div>
  );
}