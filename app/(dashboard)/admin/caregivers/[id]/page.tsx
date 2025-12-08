import { prisma } from '@/lib/db/prisma';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { ArrowLeft, Edit, MapPin, Phone, User as UserIcon, Calendar, Users } from 'lucide-react';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';

interface CaregiverDetailsPageProps {
  params: {
    id: string; // รับค่า id จาก URL (User ID)
  };
}

export default async function CaregiverDetailsPage({ params }: CaregiverDetailsPageProps) {
  // 1. ดึงข้อมูล Caregiver (จากตาราง User -> CaregiverProfile)
  const user = await prisma.user.findUnique({
    where: {
      id: parseInt(params.id),
      role: 'CAREGIVER', // ต้องเป็น Caregiver เท่านั้น
    },
    include: {
      caregiverProfile: {
        include: {
          // ดึงรายการผู้สูงอายุที่ดูแลอยู่มาด้วย
          dependents: true 
        }
      },
    }
  });

  if (!user || !user.caregiverProfile) {
    notFound();
  }

  const profile = user.caregiverProfile;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/caregivers">
            <Button variant="outline" size="sm" className="h-9 w-9 p-0 flex items-center justify-center">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {profile.firstName} {profile.lastName}
            </h1>
            <p className="text-gray-500 text-sm">รหัสผู้ดูแล: {user.id}</p>
          </div>
        </div>

        <Link href={`/admin/caregivers/${user.id}/edit`}>
          <Button className="bg-orange-500 hover:bg-orange-600 text-white">
            <Edit className="w-4 h-4 mr-2" />
            แก้ไขข้อมูล
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: ข้อมูลส่วนตัว */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <UserIcon className="w-5 h-5 text-blue-600" />
              ข้อมูลส่วนตัว
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium text-gray-500">Username (LINE ID)</label>
                <p className="text-gray-900 mt-1 font-medium font-mono text-xs break-all">{user.username}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">สถานะบัญชี</label>
                <div className="mt-1">
                  <Badge variant={user.isActive ? 'success' : 'danger'}>
                    {user.isActive ? 'ใช้งานปกติ' : 'ถูกระงับ'}
                  </Badge>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">เพศ</label>
                <p className="text-gray-900 mt-1">{profile.gender === 'MALE' ? 'ชาย' : profile.gender === 'FEMALE' ? 'หญิง' : 'ไม่ระบุ'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">วันเดือนปีเกิด</label>
                <p className="text-gray-900 mt-1">
                    {profile.birthday ? format(new Date(profile.birthday), 'd MMMM yyyy', { locale: th }) : '-'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: ข้อมูลติดต่อ */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Phone className="w-5 h-5 text-green-600" />
              ข้อมูลติดต่อ
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500">เบอร์โทรศัพท์</label>
              <p className="text-gray-900 mt-1 text-lg font-semibold">{profile.phone || '-'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">LINE ID</label>
              <p className="mt-1 text-sm text-green-600 font-medium break-all">
                {user.lineId || '-'}
              </p>
            </div>
            <div>
                <label className="text-sm font-medium text-gray-500">วันที่ลงทะเบียน</label>
                <div className="flex items-center gap-2 mt-1 text-gray-700 text-sm">
                  <Calendar className="w-3 h-3 text-gray-400" />
                  {format(new Date(user.createdAt), 'd MMM yyyy', { locale: th })}
                </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: ที่อยู่ */}
        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <MapPin className="w-5 h-5 text-red-600" />
              ที่อยู่ปัจจุบัน
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div>
                <label className="text-sm font-medium text-gray-500">บ้านเลขที่ / หมู่บ้าน</label>
                <p className="text-gray-900 mt-1">
                  {profile.houseNumber} {profile.village ? `หมู่ ${profile.village}` : ''} {profile.road ? `ถนน ${profile.road}` : ''}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">ตำบล / อำเภอ</label>
                <p className="text-gray-900 mt-1">
                  {profile.subDistrict} / {profile.district}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">จังหวัด / รหัสไปรษณีย์</label>
                <p className="text-gray-900 mt-1">
                  {profile.province} {profile.postalCode}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 4: รายชื่อผู้สูงอายุที่ดูแล (เพิ่มใหม่) */}
        <Card className="md:col-span-3 border-blue-100 shadow-sm">
            <CardHeader className="border-blue-100">
                <CardTitle className="flex items-center gap-2 text-base text-blue-800">
                    <Users className="w-5 h-5 text-blue-600" />
                    ผู้สูงอายุในความดูแล ({profile.dependents.length})
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
                {profile.dependents.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {profile.dependents.map((dep) => (
                            <Link key={dep.id} href={`/admin/dependents/${dep.userId}`}>
                                <div className="group p-4 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-all cursor-pointer flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-lg group-hover:scale-110 transition-transform">
                                        {dep.firstName.substring(0,1)}
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-700 group-hover:text-blue-700">คุณ{dep.firstName} {dep.lastName}</p>
                                        <p className="text-xs text-slate-400">โรคประจำตัว: {dep.diseases || '-'}</p>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <p className="text-center text-gray-400 py-4">ยังไม่มีผู้สูงอายุในความดูแล</p>
                )}
            </CardContent>
        </Card>

      </div>
    </div>
  );
}