import { prisma } from '@/lib/db/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, MapPin, Phone, User, Calendar, 
  Home, Activity, Pill, Heart, AlertCircle, ShieldCheck, Ban, Navigation
} from 'lucide-react';
import { Button } from '@/components/ui/button';
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
          caregiver: true 
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
    <div className="h-[calc(100vh-8.8rem)] flex flex-col gap-4 p-2 overflow-hidden bg-slate-50/50">
      
      {/* --- Top Navigation & Actions --- */}
      <div className="flex items-center justify-between shrink-0 px-2">
         <div className="flex items-center gap-3">
            <Link href="/admin/dependents" prefetch={true}>
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full bg-white border border-slate-200 hover:bg-blue-50 hover:text-blue-600 transition-colors shadow-sm">
                    <ArrowLeft className="w-4 h-4" />
                </Button>
            </Link>
            <div className="flex flex-col">
                <h1 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    คุณ{profile.firstName} {profile.lastName}
                    <div className={`text-[10px] px-2 py-0.5 rounded-full border flex items-center gap-1 font-medium ${user.isActive ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
                        {user.isActive ? <ShieldCheck className="w-3 h-3"/> : <Ban className="w-3 h-3"/>}
                        {user.isActive ? 'ปกติ' : 'ระงับ'}
                    </div>
                </h1>
                <p className="text-xs text-slate-400 font-mono">ID: {user.id}</p>
            </div>
         </div>

         {/* ✅ ปุ่มติดตามตำแหน่ง (ส่ง Query Param ?id=... ไปด้วย) */}
         <Link href={`/admin/monitoring?focusUser=${user.id}`}>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200 rounded-full gap-2 transition-all hover:scale-105">
              <Navigation className="w-4 h-4 animate-pulse" />
              ติดตามตำแหน่ง
            </Button>
         </Link>
      </div>

      {/* --- Main Content Grid --- */}
      <div className="grid grid-cols-12 gap-4 flex-1 min-h-0">

        {/* 🟡 Left Column: Personal Info & Caregiver (4/12) */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-4 overflow-y-auto pr-1 pb-2 custom-scrollbar">
            
            {/* 1. Profile Summary Card */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-bl-full -mr-8 -mt-8" />
                
                <div className="flex items-center gap-4 relative z-10 mb-6">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 p-[2px] shadow-xl shadow-blue-200 shrink-0">
                        <div className="w-full h-full rounded-[14px] bg-white flex items-center justify-center">
                            <User className="w-10 h-10 text-slate-400" />
                        </div>
                    </div>
                    <div>
                        <p className="text-xs text-slate-500 font-medium mb-1">ผู้ที่มีภาวะพึ่งพิง</p>
                        <h2 className="text-xl font-black text-slate-800 leading-tight">{profile.firstName} {profile.lastName}</h2>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="bg-slate-50 p-3 rounded-2xl text-center border border-slate-100">
                        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">อายุ</p>
                        <p className="text-lg text-slate-800">{age} <span className="text-xs font-normal text-slate-500">ปี</span></p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-2xl text-center border border-slate-100">
                        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">วันเกิด</p>
                        <p className="text-sm text-slate-800 mt-1">
                            {profile.birthday ? format(new Date(profile.birthday), 'd MMM yy', { locale: th }) : '-'}
                        </p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-2xl text-center border border-slate-100">
                        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">เพศ</p>
                        <p className="text-sm text-slate-800 mt-1">{translateGender(profile.gender || '')}</p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-2xl text-center border border-slate-100">
                        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">สถานะ</p>
                        <p className="text-sm text-slate-800 mt-1">{translateMarital(profile.marital || '')}</p>
                    </div>
                </div>

                <div className="space-y-3 pt-4 border-t border-slate-100">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-500 flex items-center gap-2"><Phone className="w-4 h-4" /> เบอร์โทรศัพท์</span>
                        <span className="font-bold text-slate-800 font-mono">{profile.phone || '-'}</span>
                    </div>
                </div>
            </div>

            {/* 2. Caregiver Info */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                        <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
                        ผู้ดูแลหลัก
                    </h3>
                    <Link href={caregiver ? `/admin/caregivers/${caregiver.userId}` : '#'} className="text-[10px] text-blue-600 hover:underline">
                        ดูรายละเอียด
                    </Link>
                </div>
                
                {caregiver ? (
                    <div className="flex items-center gap-4 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                        <div className="w-12 h-12 rounded-full bg-white border border-slate-200 flex items-center justify-center text-blue-600 font-bold text-lg shadow-sm">
                            {caregiver.firstName.charAt(0)}
                        </div>
                        <div>
                            <p className="font-bold text-slate-800">คุณ{caregiver.firstName} {caregiver.lastName}</p>
                            <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                                <Phone className="w-3 h-3" /> {caregiver.phone || '-'}
                            </p>
                        </div>
                    </div>
                ) : (
                     <div className="text-center py-6 text-slate-400 text-sm bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                        ยังไม่มีผู้ดูแล
                    </div>
                )}
            </div>

        </div>

        {/* 🟡 Right Column: Health & Address (8/12) */}
        <div className="col-span-12 lg:col-span-8 flex flex-col gap-4 overflow-y-auto pr-1 pb-2 custom-scrollbar">
            
            {/* 3. Health Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* โรคประจำตัว */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 relative group overflow-hidden">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-rose-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />
                    <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2 relative z-10">
                        <div className="p-2 bg-rose-100 text-rose-600 rounded-lg">
                            <Activity className="w-4 h-4" />
                        </div>
                        โรคประจำตัว
                    </h3>
                    <div className="relative z-10">
                         {profile.diseases ? (
                            <p className="text-slate-800 font-medium leading-relaxed">{profile.diseases}</p>
                         ) : (
                            <p className="text-slate-400 italic text-sm">ไม่มีข้อมูลโรคประจำตัว</p>
                         )}
                    </div>
                </div>

                {/* ยาที่แพ้ / ยาประจำ */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 relative group overflow-hidden">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-blue-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />
                    <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2 relative z-10">
                        <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                            <Pill className="w-4 h-4" />
                        </div>
                        ยาที่ใช้ประจำ
                    </h3>
                    <div className="relative z-10">
                         {profile.medications ? (
                            <p className="text-slate-800 font-medium leading-relaxed">{profile.medications}</p>
                         ) : (
                            <p className="text-slate-400 italic text-sm">ไม่มีข้อมูลยา</p>
                         )}
                    </div>
                </div>
            </div>

            {/* 4. Address Information */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex-1 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-orange-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />
                
                <h3 className="text-sm font-bold text-slate-700 mb-6 flex items-center gap-2 relative z-10">
                    <div className="p-2 bg-orange-100 text-orange-600 rounded-lg">
                        <Home className="w-4 h-4" />
                    </div>
                    ที่อยู่ปัจจุบัน
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                     <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">บ้านเลขที่ / หมู่บ้าน</label>
                        <p className="text-lg text-slate-800">
                             {profile.houseNumber || '-'} {profile.village ? `หมู่ ${profile.village}` : ''}
                        </p>
                     </div>
                     <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">ถนน / ซอย</label>
                        <p className="text-lg text-slate-800">
                             {profile.road || '-'}
                        </p>
                     </div>
                     <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">ตำบล / อำเภอ</label>
                        <p className="text-lg text-slate-800">
                             {profile.subDistrict} / {profile.district}
                        </p>
                     </div>
                     <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">จังหวัด / รหัสไปรษณีย์</label>
                        <p className="text-lg text-slate-800">
                             {profile.province} {profile.postalCode}
                        </p>
                     </div>
                </div>
            </div>

        </div>

      </div>
    </div>
  );
}