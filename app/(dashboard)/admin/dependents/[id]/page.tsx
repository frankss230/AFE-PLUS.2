import { prisma } from '@/lib/db/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, MapPin, Phone, User, Calendar, 
  Home, Activity, Pill, Heart, AlertCircle 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';

interface PageProps {
  params: Promise<{ id: string }>; // Next.js 15
}

// Helper แปลง Enum เป็นไทย
const translateGender = (g: string) => {
    switch(g) {
        case 'MALE': return 'ชาย';
        case 'FEMALE': return 'หญิง';
        default: return 'ไม่ระบุ';
    }
}

const translateMarital = (m: string) => {
    switch(m) {
        case 'SINGLE': return 'โสด';
        case 'MARRIED': return 'สมรส';
        case 'DIVORCED': return 'หย่าร้าง';
        case 'WIDOWED': return 'หม้าย';
        case 'SEPARATED': return 'แยกกันอยู่';
        default: return '-';
    }
}

// คำนวณอายุ
function calculateAge(birthday: Date | null) {
  if (!birthday) return '-';
  const today = new Date();
  const birthDate = new Date(birthday);
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

export default async function DependentDetailPage({ params }: PageProps) {
  const { id } = await params;

  // 1. ดึงข้อมูล User (Role: DEPENDENT) พร้อม Profile และ Caregiver
  const user = await prisma.user.findUnique({
    where: {
      id: parseInt(id),
      role: 'DEPENDENT',
    },
    include: {
      dependentProfile: {
        include: {
          caregiver: true // ดึงข้อมูลผู้ดูแล (CaregiverProfile) ที่ผูกกันอยู่
        }
      }
    }
  });

  if (!user || !user.dependentProfile) {
    notFound();
  }

  const profile = user.dependentProfile;
  const caregiver = profile.caregiver;
  const age = calculateAge(profile.birthday);

  return (
    <div className="space-y-6 pb-10">
      
      {/* 1. Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Link href="/admin/dependents">
            <Button variant="outline" size="sm" className="h-9 w-9 p-0 flex items-center justify-center">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              คุณ{profile.firstName} {profile.lastName}
              {!user.isActive && (
                <Badge variant="danger" className="bg-red-100 text-red-700 hover:bg-red-100">ระงับการใช้งาน</Badge>
              )}
            </h1>
            <p className="text-gray-500 text-sm">รหัสประจำตัว: {user.id}</p>
          </div>
        </div>

        <div className="flex gap-2">
          {/* ลิงก์ไปหน้า Monitoring (ส่ง User ID ไป) */}
          <Link href={`/admin/dashboard/monitoring?focusUser=${user.id}`}>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-md">
              <MapPin className="w-4 h-4 mr-2" />
              ติดตามตำแหน่ง Real-time
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* คอลัมน์ซ้าย: ข้อมูลส่วนตัว & ผู้ดูแล */}
        <div className="space-y-6 lg:col-span-1">
          
          {/* ข้อมูลส่วนตัว */}
          <Card>
            <CardHeader className="pb-3 border-b border-gray-100">
              <CardTitle className="text-base font-semibold flex items-center gap-2 text-gray-800">
                <User className="w-4 h-4 text-blue-500" />
                ข้อมูลพื้นฐาน
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div>
                <label className="text-xs text-gray-400">อายุ / วันเกิด</label>
                <div className="font-medium text-gray-700 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  {age} ปี <span className="text-gray-400">|</span> {profile.birthday ? format(new Date(profile.birthday), 'd MMM yyyy', { locale: th }) : '-'}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-400">เพศ</label>
                  <div className="mt-1">
                    <Badge variant="default" className="font-normal">
                      {translateGender(profile.gender || '')}
                    </Badge>
                  </div>
                </div>
                {/* ถ้ามี Marital Status ใน schema ให้เปิดใช้ */}
                <div>
                  <label className="text-xs text-gray-400">สถานะ</label>
                  <div className="mt-1">
                     <Badge variant="default" className="font-normal">{translateMarital(profile.marital || '')}</Badge>
                  </div>
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-400">เบอร์โทรศัพท์ (นาฬิกา)</label>
                <div className="font-medium text-gray-700 flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-400" />
                  {profile.phone || '-'}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ข้อมูลผู้ดูแล (Caregiver) */}
          <Card>
            <CardHeader className="pb-3 border-b border-gray-100">
              <CardTitle className="text-base font-semibold flex items-center gap-2 text-gray-800">
                <Heart className="w-4 h-4 text-pink-500" />
                ผู้ดูแลหลัก (Caregiver)
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {caregiver ? (
                  <>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold border border-blue-100">
                        {caregiver.firstName.charAt(0)}
                        </div>
                        <div>
                        <p className="font-medium text-gray-900">คุณ{caregiver.firstName} {caregiver.lastName}</p>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                            <Phone className="w-3 h-3" /> {caregiver.phone || '-'}
                        </p>
                        </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-gray-50 flex justify-between items-center text-sm">
                        <Link href={`/admin/caregivers/${caregiver.userId}`} className="text-xs text-blue-600 hover:underline">
                            ดูโปรไฟล์ผู้ดูแล &rarr;
                        </Link>
                    </div>
                  </>
              ) : (
                  <div className="text-center py-4 text-gray-400 text-sm bg-gray-50 rounded-lg">
                      ไม่มีผู้ดูแล
                  </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* คอลัมน์ขวา: ข้อมูลสุขภาพ & ที่อยู่ */}
        <div className="space-y-6 lg:col-span-2">
          
          {/* ข้อมูลสุขภาพ */}
          <Card>
            <CardHeader className="pb-3 border-b border-gray-100">
              <CardTitle className="text-base font-semibold flex items-center gap-2 text-gray-800">
                <Activity className="w-4 h-4 text-green-500" />
                ข้อมูลสุขภาพ
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-red-500 font-medium text-sm">
                  <AlertCircle className="w-4 h-4" /> โรคประจำตัว
                </div>
                <div className="p-4 bg-red-50/50 border border-red-100 rounded-xl text-sm text-gray-700 min-h-[100px]">
                  {profile.diseases || 'ไม่มีข้อมูล'}
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-blue-500 font-medium text-sm">
                  <Pill className="w-4 h-4" /> ยาที่ใช้ประจำ
                </div>
                <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-xl text-sm text-gray-700 min-h-[100px]">
                  {profile.medications || 'ไม่มีข้อมูล'}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ที่อยู่ปัจจุบัน */}
          <Card>
            <CardHeader className="pb-3 border-b border-gray-100">
              <CardTitle className="text-base font-semibold flex items-center gap-2 text-gray-800">
                <Home className="w-4 h-4 text-orange-500" />
                ที่อยู่ปัจจุบัน
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid md:grid-cols-2 gap-y-4 gap-x-8 text-sm">
                <div>
                  <span className="text-gray-400 block mb-1 text-xs uppercase tracking-wide">บ้านเลขที่ / หมู่</span>
                  <span className="font-medium text-gray-800 text-base">
                    {profile.houseNumber || '-'} {profile.village ? `หมู่ ${profile.village}` : ''}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 block mb-1 text-xs uppercase tracking-wide">ถนน / ซอย</span>
                  <span className="font-medium text-gray-800 text-base">{profile.road || '-'}</span>
                </div>
                <div>
                  <span className="text-gray-400 block mb-1 text-xs uppercase tracking-wide">ตำบล / อำเภอ</span>
                  <span className="font-medium text-gray-800 text-base">
                    {profile.subDistrict} / {profile.district}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 block mb-1 text-xs uppercase tracking-wide">จังหวัด / รหัสไปรษณีย์</span>
                  <span className="font-medium text-gray-800 text-base">
                    {profile.province} {profile.postalCode}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}