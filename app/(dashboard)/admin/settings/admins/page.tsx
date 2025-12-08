import { prisma } from '@/lib/db/prisma';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AdminTable } from '@/components/features/admins/admin-table';

export const dynamic = 'force-dynamic';

async function getAdmins() {
  const users = await prisma.user.findMany({
    where: { role: 'ADMIN' }, 
    include: {
      adminProfile: true, 
    },
    orderBy: { createdAt: 'desc' },
  });

  // Map ข้อมูลให้ตรงกับ Interface AdminData
  return users.map((user) => ({
    id: user.id,
    username: user.username,
    isActive: user.isActive,
    
    // ข้อมูลจาก Profile
    firstName: user.adminProfile?.firstName || 'System',
    lastName: user.adminProfile?.lastName || 'Admin',
    phone: user.adminProfile?.phone || '-',
    
    // ✅ เพิ่ม position (ถ้าไม่มีให้ใส่ - หรือ Administrator)
    position: user.adminProfile?.position || 'Administrator',
  }));
}

export default async function AdminsSettingsPage() {
  const users = await getAdmins();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">ผู้ดูแลระบบ (Admins)</h1>
        <p className="text-gray-600 mt-1">จัดการสิทธิ์และรายชื่อผู้ดูแลระบบ</p>
      </div>

      <Card>
        <CardHeader><CardTitle>รายชื่อ ({users.length})</CardTitle></CardHeader>
        <CardContent>
          <AdminTable data={users} />
        </CardContent>
      </Card>
    </div>
  );
}