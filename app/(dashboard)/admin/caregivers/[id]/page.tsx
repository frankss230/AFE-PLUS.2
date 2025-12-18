import { prisma } from '@/lib/db/prisma';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, MapPin, Phone, User as UserIcon, Users, HeartPulse, Calendar, ShieldCheck, Ban } from 'lucide-react';
import { format, differenceInYears } from 'date-fns';
import { th } from 'date-fns/locale';
// ✅ Import Modal ที่เราสร้าง
import EditCaregiverModal from '@/components/features/caregivers/edit-caregiver-modal'; 

interface CaregiverDetailsPageProps {
  params: Promise<{ id: string }>; // ✅ ใช้ Promise ตาม Next.js 15
}

export const dynamic = 'force-dynamic';

export default async function CaregiverDetailsPage({ params }: CaregiverDetailsPageProps) {
  const { id } = await params; // ✅ Await params ก่อนใช้

  // 1. ดึงข้อมูล
  const user = await prisma.user.findUnique({
    where: {
      id: parseInt(id),
      role: 'CAREGIVER', 
    },
    include: {
      caregiverProfile: {
        include: { dependents: true }
      },
    }
  });

  if (!user || !user.caregiverProfile) {
    notFound();
  }

  const profile = user.caregiverProfile;

  // 2. คำนวณอายุ
  const birthDate = profile.birthday ? new Date(profile.birthday) : null;
  const age = birthDate ? differenceInYears(new Date(), birthDate) : '-';

  // ✅ แปลงสถานะสมรสเป็นภาษาไทย
  const maritalStatusMap: Record<string, string> = {
    SINGLE: 'โสด',
    MARRIED: 'สมรส',
    WIDOWED: 'หม้าย',
    DIVORCED: 'หย่าร้าง',
    SEPARATED: 'แยกกันอยู่',
  };
  const maritalText = profile.marital ? maritalStatusMap[profile.marital] || '-' : '-';

  // 3. เตรียมข้อมูลสำหรับส่งให้ Modal แก้ไข (รวมร่างข้อมูล)
  const editFormData = {
    id: user.id,
    role: user.role,
    isActive: user.isActive,
    lineId: user.lineId,
    
    firstName: profile.firstName,
    lastName: profile.lastName,
    phone: profile.phone,
    birthday: profile.birthday,
    gender: profile.gender,
    maritalStatus: profile.marital, 

    houseNumber: profile.houseNumber,
    village: profile.village,
    road: profile.road,
    subDistrict: profile.subDistrict,
    district: profile.district,
    province: profile.province,
    postalCode: profile.postalCode,
  };

  return (
    <div className="h-[calc(100vh-8.8rem)] flex flex-col gap-3 p-2 overflow-hidden bg-slate-50/50">
      
      {/* --- Header Bar --- */}
      <div className="flex items-center justify-between shrink-0 px-2">
        <div className="flex items-center gap-3">
            <Link href="/admin/caregivers" prefetch={true}>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-white border border-slate-200 hover:bg-blue-50 hover:text-blue-600 transition-colors shadow-sm">
                    <ArrowLeft className="w-4 h-4" />
                </Button>
            </Link>
            <div>
                <h1 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    คุณ{profile.firstName} {profile.lastName}
                    <div className={`text-[10px] px-2 py-0.5 rounded-full border flex items-center gap-1 font-medium ${user.isActive ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
                        {user.isActive ? <ShieldCheck className="w-3 h-3"/> : <Ban className="w-3 h-3"/>}
                        {user.isActive ? 'ปกติ' : 'ระงับ'}
                    </div>
                </h1>
            </div>
        </div>
        
        {/* ✅ ปุ่มแก้ไข Modal */}
        <EditCaregiverModal initialData={editFormData} />
      </div>

      {/* --- Split Layout --- */}
      <div className="grid grid-cols-12 gap-3 flex-1 min-h-0">
        
        {/* Left Column: Profile & Contact */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-3 overflow-y-auto pr-1 pb-2 custom-scrollbar">
            
            {/* Profile Info */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-bl-full -mr-6 -mt-6" />
                <div className="flex items-start gap-4 relative z-10">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 p-[2px] shadow-lg shadow-blue-200 shrink-0">
                        <div className="w-full h-full rounded-[14px] bg-white flex items-center justify-center">
                            <UserIcon className="w-8 h-8 text-slate-400" />
                        </div>
                    </div>
                    <div className="min-w-0 flex-1">
                         <p className="text-xs text-slate-400 font-mono mb-1">ID: {user.id}</p>
                         <h2 className="text-xl font-black text-slate-800 truncate">{profile.firstName} {profile.lastName}</h2>
                    </div>
                </div>
                
                {/* ✅ ปรับ Grid เป็น 4 ช่อง (2 แถวบนมือถือ) */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mt-5">
                    {/* 1. อายุ */}
                    <div className="bg-slate-50 p-2 rounded-xl text-center border border-slate-100">
                        <p className="text-[10px] text-slate-400 uppercase font-bold">อายุ</p>
                        <p className="text-sm font-bold text-slate-800">{age}</p>
                    </div>
                    {/* 2. เพศ */}
                    <div className="bg-slate-50 p-2 rounded-xl text-center border border-slate-100">
                        <p className="text-[10px] text-slate-400 uppercase font-bold">เพศ</p>
                        <p className="text-sm font-bold text-slate-800">
                            {profile.gender === 'MALE' ? 'ชาย' : profile.gender === 'FEMALE' ? 'หญิง' : '-'}
                        </p>
                    </div>
                    {/* 3. สถานะสมรส (เพิ่มใหม่) ✅ */}
                    <div className="bg-slate-50 p-2 rounded-xl text-center border border-slate-100">
                        <p className="text-[10px] text-slate-400 uppercase font-bold">สถานะ</p>
                        <p className="text-sm font-bold text-slate-800 truncate">{maritalText}</p>
                    </div>
                    {/* 4. ผู้ป่วย */}
                    <div className="bg-slate-50 p-2 rounded-xl text-center border border-slate-100">
                        <p className="text-[10px] text-slate-400 uppercase font-bold">ผู้ป่วย</p>
                        <p className="text-sm font-bold text-blue-600">{profile.dependents.length}</p>
                    </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-500">
                    <Calendar className="w-3 h-3" />
                    <span>ลงทะเบียน: {format(new Date(user.createdAt), 'd MMM yyyy', { locale: th })}</span>
                </div>
            </div>

            {/* Contact Info */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Phone className="w-4 h-4 text-green-500" /> ข้อมูลติดต่อ
                </h3>
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-xs font-medium text-slate-500">เบอร์โทรศัพท์</span>
                    <span className="text-base font-bold text-slate-800 font-mono tracking-tight">{profile.phone || '-'}</span>
                </div>
            </div>

            {/* Address Info */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex-1">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-orange-500" /> ที่อยู่ปัจจุบัน
                </h3>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-2">
                    <p className="text-sm font-bold text-slate-800">
                        {profile.houseNumber} {profile.village ? `หมู่ ${profile.village}` : ''} {profile.road ? `ถนน ${profile.road}` : ''}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-2">
                        <span className="px-2 py-1 bg-white rounded text-[10px] border border-slate-200 text-slate-500">
                            {profile.subDistrict}
                        </span>
                        <span className="px-2 py-1 bg-white rounded text-[10px] border border-slate-200 text-slate-500">
                            {profile.district}
                        </span>
                        <span className="px-2 py-1 bg-white rounded text-[10px] border border-slate-200 text-slate-500">
                            {profile.province}
                        </span>
                        <span className="px-2 py-1 bg-white rounded text-[10px] border border-slate-200 text-slate-500 font-mono">
                            {profile.postalCode}
                        </span>
                    </div>
                </div>
            </div>
        </div>

        {/* Right Column: Dependents List */}
        <div className="col-span-12 lg:col-span-8 bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-white/80 backdrop-blur-sm z-10 flex justify-between items-center shrink-0">
                <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm">
                    <div className="p-1.5 bg-blue-50 rounded text-blue-600">
                         <Users className="w-4 h-4" />
                    </div>
                    ผู้สูงอายุในความดูแล
                </h3>
                <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-1 rounded-full border border-slate-200">
                    Total: {profile.dependents.length}
                </span>
            </div>
            <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
                {profile.dependents.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {profile.dependents.map((dep) => (
                            <Link key={dep.id} href={`/admin/dependents/${dep.userId}`}>
                                <div className="group relative p-4 rounded-xl border border-slate-100 hover:border-blue-300 hover:shadow-md hover:shadow-blue-50 transition-all cursor-pointer bg-slate-50/30 hover:bg-white">
                                    <div className="flex items-start gap-3">
                                        <div className="h-10 w-10 rounded-lg bg-white border border-slate-200 text-blue-600 flex items-center justify-center font-bold text-lg shadow-sm group-hover:scale-105 transition-transform shrink-0">
                                            {dep.firstName.substring(0,1)}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-bold text-slate-700 text-sm group-hover:text-blue-700 truncate transition-colors">
                                                คุณ{dep.firstName} {dep.lastName}
                                            </p>
                                            <div className="flex items-center gap-1.5 mt-1.5">
                                                <HeartPulse className="w-3 h-3 text-rose-500 shrink-0" />
                                                <span className="text-xs text-slate-500 truncate">{dep.diseases || 'ไม่มีโรคประจำตัว'}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="absolute top-1/2 right-3 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <ArrowLeft className="w-4 h-4 text-blue-400 rotate-180" />
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-50 pb-10">
                        <Users className="w-12 h-12 mb-3 stroke-1" />
                        <p className="text-sm font-medium">ไม่มีข้อมูลผู้สูงอายุ</p>
                    </div>
                )}
            </div>
        </div>

      </div>
    </div>
  );
}