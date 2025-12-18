import { prisma } from '@/lib/db/prisma';
import DependentPageClient from '@/components/features/dependents/dependent-page-client'; // ✅ เรียกตัวใหม่มาใช้

export const dynamic = 'force-dynamic';

async function getDependents() {
  const users = await prisma.user.findMany({
    where: { role: 'DEPENDENT' },
    include: {
      dependentProfile: {
        include: {
          caregiver: true 
        }
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return users.map((user) => {
    const profile = user.dependentProfile;

    return {
      id: user.id,
      profileId: profile?.id || 0,
      firstName: profile?.firstName || '-',
      lastName: profile?.lastName || '-',
      phone: profile?.phone || '-',
      birthday: profile?.birthday || null,
      gender: profile?.gender || 'UNSPECIFIED',
      isActive: user.isActive,
      
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

      {/* ✅ ส่งต่อให้ Client Component จัดการ Refresh */}
      <DependentPageClient initialData={dependents} />
    </div>
  );
}