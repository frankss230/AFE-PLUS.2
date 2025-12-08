import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AdminTable } from '@/components/features/admins/admin-table';

import { AdminRegisterDialog } from '@/components/features/settings/admin-register-dialog';
import { MyAccountSection } from '@/components/features/settings/my-account-section';
import { Shield, Users, Settings } from 'lucide-react';
import { getSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';

// ดึงข้อมูล Admin ทั้งหมด
async function getAllAdmins() {
  const admins = await prisma.user.findMany({
    where: { role: 'ADMIN' },
    include: { adminProfile: true },
    orderBy: { createdAt: 'desc' }
  });
  
  // Map ข้อมูลให้ตรงกับ interface AdminData ใน AdminTable
  return admins.map(u => ({
      id: u.id,
      username: u.username,
      isActive: u.isActive,
      role: u.role,
      firstName: u.adminProfile?.firstName || 'System',
      lastName: u.adminProfile?.lastName || 'Admin',
      phone: u.adminProfile?.phone || '-',
      position: u.adminProfile?.position || 'Administrator' // ✅ ส่ง position ไปด้วย
  }));
}

export default async function SettingsPage() {
  const session = await getSession();
  
  // ดึงข้อมูล Admin ปัจจุบัน
  const myAccount = await prisma.user.findUnique({
    where: { id: session?.userId },
    include: { adminProfile: true }
  });

  const allAdmins = await getAllAdmins();

  return (
    <div className="space-y-8 pb-10 h-[calc(100vh-100px)] flex flex-col">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">การตั้งค่าระบบ</h1>
          <p className="text-gray-600 mt-1">จัดการผู้ดูแลระบบและการตั้งค่าทั่วไป</p>
        </div>
        <AdminRegisterDialog />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-1 min-h-0">
        
        {/* --- Column ซ้าย (2/3): รายชื่อ Admin --- */}
        <div className="lg:col-span-2 flex flex-col gap-8 h-full overflow-hidden">
          
          {/* 1. รายชื่อผู้ดูแลระบบ */}
          <Card className="border-slate-200 shadow-sm flex flex-col flex-1 overflow-hidden">
            <CardHeader className="shrink-0">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                <CardTitle>รายชื่อผู้ดูแลระบบ ({allAdmins.length})</CardTitle>
              </div>
              <CardDescription>รายชื่อและตำแหน่งของผู้มีสิทธิ์เข้าถึง</CardDescription>
            </CardHeader>
            
            <CardContent className="flex-1 overflow-y-auto p-0">
               <div className="px-6 pb-6">
                   {/* ✅ ใช้ AdminTable และส่ง prop ชื่อ data */}
                   <AdminTable data={allAdmins} />
               </div>
            </CardContent>
          </Card>

          {/* 2. System Control */}
          <Card className="opacity-60 pointer-events-none grayscale shrink-0"> 
            <CardHeader className="py-4">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-green-600" />
                <CardTitle className="text-base">การควบคุมระบบ (System Control)</CardTitle>
              </div>
            </CardHeader>
          </Card>
        </div>

        {/* --- Column ขวา (1/3): บัญชีของฉัน --- */}
        <div className="lg:col-span-1 space-y-6 overflow-y-auto pr-1">
          {myAccount && <MyAccountSection user={myAccount} />}

          <div className="text-center pt-4">
            <p className="text-sm font-medium text-gray-400 flex items-center justify-center gap-2">
              <Settings className="w-4 h-4" />
              Smart Watch Monitoring
            </p>
            <p className="text-xs text-gray-300 mt-1">v1.0.0 (Stable)</p>
          </div>
        </div>

      </div>
    </div>
  );
}