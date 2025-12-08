import { prisma } from '@/lib/db/prisma';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserForm } from '@/components/features/caregivers/caregiver-form'; 

interface EditCaregiverPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditCaregiverPage({ params }: EditCaregiverPageProps) {
  const { id } = await params;

  // 1. ดึงข้อมูล
  const user = await prisma.user.findUnique({
    where: { id: parseInt(id) },
    include: { caregiverProfile: true }
  });

  if (!user || !user.caregiverProfile) {
    notFound();
  }

  // 2. รวมร่างข้อมูล
  const formData = {
    id: user.id,
    username: user.username,
    isActive: user.isActive,
    lineId: user.lineId,
    firstName: user.caregiverProfile.firstName,
    lastName: user.caregiverProfile.lastName,
    phone: user.caregiverProfile.phone,
    houseNumber: user.caregiverProfile.houseNumber,
    village: user.caregiverProfile.village,
    road: user.caregiverProfile.road,
    subDistrict: user.caregiverProfile.subDistrict,
    district: user.caregiverProfile.district,
    province: user.caregiverProfile.province,
    postalCode: user.caregiverProfile.postalCode,
    birthday: user.caregiverProfile.birthday,
    gender: user.caregiverProfile.gender,
    maritalStatus: user.caregiverProfile.marital
  };

  return (
    // ✅ 1. ล็อคความสูงหน้าจอ (กันดันลงล่าง)
    <div className="h-[calc(100vh-100px)] flex flex-col space-y-6">
      
      {/* Header (ส่วนนี้จะอยู่นิ่งๆ) */}
      <div className="shrink-0">
        <h1 className="text-3xl font-bold text-gray-900">แก้ไขข้อมูลผู้ดูแล</h1>
        <p className="text-gray-600 mt-1">แก้ไขรายละเอียดส่วนตัวและข้อมูลติดต่อ</p>
      </div>

      {/* Card (ส่วนนี้จะยืดเต็มพื้นที่) */}
      <Card className="flex-1 flex flex-col overflow-hidden shadow-sm border-slate-200">
        
        <CardHeader className="shrink-0 border-b bg-gray-50/50 py-4">
          <CardTitle className="text-lg text-slate-700">แบบฟอร์มแก้ไขข้อมูล</CardTitle>
        </CardHeader>
        
        {/* ✅ 2. พื้นที่ Scroll (เฉพาะฟอร์ม) */}
        <CardContent className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-gray-200">
          <div className="max-w-4xl mx-auto">
              <UserForm initialData={formData} />
          </div>
        </CardContent>
        
      </Card>
    </div>
  );
}