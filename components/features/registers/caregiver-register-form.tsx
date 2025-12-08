'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import liff from '@line/liff';
import { toast } from 'sonner';
import { Loader2, Save, MapPin, User, Phone, ChevronDown } from 'lucide-react';
import Image from 'next/image';

// Import Action & Schema
import { registerUser } from '@/actions/user.actions';
import { caregiverRegisterSchema, CaregiverRegisterInput } from '@/lib/validations/caregiver-register.schema';
import { getThaiAddressData, ThaiProvince, ThaiAmphure, ThaiTambon } from '@/services/thai-data.service';

export function CaregiverRegisterForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [liffReady, setLiffReady] = useState(false);
  const [profile, setProfile] = useState<any>(null);

  // Address State
  const [isAddressLoading, setIsAddressLoading] = useState(true);
  const [allProvinces, setAllProvinces] = useState<ThaiProvince[]>([]);
  const [amphureOptions, setAmphureOptions] = useState<ThaiAmphure[]>([]);
  const [tambonOptions, setTambonOptions] = useState<ThaiTambon[]>([]);

  const form = useForm<CaregiverRegisterInput>({
    resolver: zodResolver(caregiverRegisterSchema),
    defaultValues: {
      lineId: '',
      firstName: '',
      lastName: '',
      phone: '',
      houseNumber: '',
      village: '',
      road: '',
      province: '',
      district: '',
      subDistrict: '',
      postalCode: '',
      gender: 'UNSPECIFIED',
      marital: 'SINGLE',
      birthday: new Date().toISOString().split('T')[0],
    },
  });

  // Init Data
  useEffect(() => {
    const init = async () => {
      try {
        const thaiData = await getThaiAddressData();
        setAllProvinces(thaiData);
        setIsAddressLoading(false);

        try {
            await liff.init({ 
                liffId: process.env.NEXT_PUBLIC_LIFF_ID || '',
                withLoginOnExternalBrowser: true 
            });
        } catch (liffError: any) {
            console.error("LIFF Init Error:", liffError);
            if (liffError.message?.includes('code_verifier') || liffError.code === '400') {
                localStorage.clear();
                sessionStorage.clear();
                window.location.reload(); 
                return;
            }
        }

        if (!liff.isLoggedIn()) {
            liff.login();
            return;
        }

        const p = await liff.getProfile();
        setProfile(p);
        form.setValue('lineId', p.userId);
        
        setLiffReady(true);

      } catch (e) {
        console.error("Critical Initialization Error:", e);
        setIsAddressLoading(false);
      }
    };
    
    init();
  }, [form]);

  // Address Handlers
  const handleProvinceChange = (provinceName: string) => {
    form.setValue('province', provinceName);
    form.setValue('district', '');
    form.setValue('subDistrict', '');
    form.setValue('postalCode', '');
    const p = allProvinces.find(i => i.name === provinceName);
    setAmphureOptions(p ? p.amphure : []);
    setTambonOptions([]);
  };

  const handleAmphureChange = (amphureName: string) => {
    form.setValue('district', amphureName);
    form.setValue('subDistrict', '');
    form.setValue('postalCode', '');
    const a = amphureOptions.find(i => i.name === amphureName);
    setTambonOptions(a ? a.tambon : []);
  };

  const handleTambonChange = (tambonName: string) => {
    form.setValue('subDistrict', tambonName);
    const t = tambonOptions.find(i => i.name === tambonName);
    if (t) form.setValue('postalCode', t.zipCode);
  };

  // Submit
  const onSubmit = async (data: CaregiverRegisterInput) => {
    setIsLoading(true);
    try {
      const res = await registerUser(data);
      
      if (res.success) {
        toast.success('ลงทะเบียนเรียบร้อย!');
        setTimeout(() => window.location.href = '/register/elderly', 1500);
      } else {
        if (res.error?.includes('ลงทะเบียนแล้ว')) {
            window.location.href = '/register/elderly';
        } else {
            toast.error(res.error);
        }
      }
    } catch (e) { toast.error('เกิดข้อผิดพลาด'); }
    setIsLoading(false);
  };

  if (!liffReady) return <div className="h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-blue-600 w-10 h-10" /></div>;

  return (
    <div className="min-h-screen bg-slate-50 pb-10 font-sans">
      
      {/* Header */}
      <div className="relative bg-white pb-10 rounded-b-[2.5rem] shadow-lg overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-blue-50 to-white pointer-events-none" />
        
        <div className="relative z-10 pt-10 px-6 text-center">
            <h1 className="text-2xl font-black text-slate-800 mb-1 tracking-tight">ลงทะเบียนผู้ดูแล</h1>
            <p className="text-slate-500 text-sm font-medium">กรอกข้อมูลเพื่อเริ่มต้นใช้งานระบบ</p>
            
            <div className="mt-6 relative inline-block">
                <div className="absolute inset-0 bg-blue-200 rounded-full blur-xl opacity-50 animate-pulse"></div>
                {profile?.pictureUrl ? (
                    <Image src={profile.pictureUrl} alt="Profile" width={88} height={88} className="relative rounded-full border-4 border-white shadow-xl" />
                ) : (
                    <div className="relative w-24 h-24 bg-white rounded-full flex items-center justify-center text-3xl shadow-xl text-blue-200">👤</div>
                )}
                <div className="absolute bottom-1 right-1 w-6 h-6 bg-green-500 border-4 border-white rounded-full"></div>
            </div>
            <p className="mt-3 text-lg font-bold text-slate-700">{profile?.displayName}</p>
        </div>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="px-5 -mt-6 relative z-20 max-w-lg mx-auto space-y-6">
        
        {/* 1. ข้อมูลส่วนตัว */}
        <div className="bg-white p-6 rounded-3xl shadow-xl shadow-blue-900/5 border border-white/50">
            <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
                    <User className="w-5 h-5" />
                </div>
                <h2 className="text-lg font-bold text-slate-800">ข้อมูลส่วนตัว</h2>
            </div>
            
            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">ชื่อจริง</label>
                        <input {...form.register('firstName')} className="w-full px-4 py-3 bg-slate-50 rounded-2xl border-0 focus:ring-2 focus:ring-blue-500/20 transition-all font-bold text-slate-700 placeholder:text-slate-300" placeholder="ระบุชื่อ" />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">นามสกุล</label>
                        <input {...form.register('lastName')} className="w-full px-4 py-3 bg-slate-50 rounded-2xl border-0 focus:ring-2 focus:ring-blue-500/20 transition-all font-bold text-slate-700 placeholder:text-slate-300" placeholder="ระบุนามสกุล" />
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">เบอร์โทรศัพท์</label>
                    <div className="relative">
                        <Phone className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                        <input type="tel" maxLength={10} {...form.register('phone')} className="w-full pl-12 pr-4 py-3 bg-slate-50 rounded-2xl border-0 focus:ring-2 focus:ring-blue-500/20 transition-all font-bold text-slate-700 tracking-wide placeholder:text-slate-300" placeholder="08xxxxxxxx" />
                    </div>
                    {form.formState.errors.phone && <p className="text-xs text-red-500 ml-1">{form.formState.errors.phone.message}</p>}
                </div>

                {/* ✅ เพิ่ม: เพศ & วันเกิด */}
                <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="space-y-1.5">
                         <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">เพศ</label>
                         <div className="relative">
                             <select {...form.register('gender')} className="w-full px-4 py-3 bg-slate-50 rounded-2xl border-0 font-medium text-slate-600 appearance-none focus:ring-2 focus:ring-blue-500/20 transition-all">
                                 <option value="MALE">ชาย</option>
                                 <option value="FEMALE">หญิง</option>
                                 <option value="UNSPECIFIED">ไม่ระบุ</option>
                             </select>
                             <ChevronDown className="absolute right-4 top-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                         </div>
                    </div>
                    <div className="space-y-1.5">
                         <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">วันเกิด</label>
                         <input type="date" {...form.register('birthday')} className="w-full px-4 py-3 bg-slate-50 rounded-2xl border-0 font-medium text-slate-600 focus:ring-2 focus:ring-blue-500/20 transition-all" />
                    </div>
                </div>

                {/* ✅ เพิ่ม: สถานะสมรส */}
                <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">สถานะสมรส</label>
                    <div className="relative">
                        <select {...form.register('marital')} className="w-full px-4 py-3 bg-slate-50 rounded-2xl border-0 font-medium text-slate-600 appearance-none focus:ring-2 focus:ring-blue-500/20 transition-all">
                            <option value="SINGLE">โสด</option>
                            <option value="MARRIED">สมรส</option>
                            <option value="WIDOWED">หม้าย</option>
                            <option value="DIVORCED">หย่าร้าง</option>
                            <option value="SEPARATED">แยกกันอยู่</option>
                        </select>
                        <ChevronDown className="absolute right-4 top-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>
                </div>

            </div>
        </div>

        {/* 2. ที่อยู่ */}
        <div className="bg-white p-6 rounded-3xl shadow-xl shadow-blue-900/5 border border-white/50">
             <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-2xl bg-green-50 flex items-center justify-center text-green-600">
                    <MapPin className="w-5 h-5" />
                </div>
                <h2 className="text-lg font-bold text-slate-800">ที่อยู่ปัจจุบัน</h2>
            </div>
            
            <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-2 space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">บ้านเลขที่</label>
                        <input {...form.register('houseNumber')} className="w-full px-4 py-3 bg-slate-50 rounded-2xl border-0 focus:ring-2 focus:ring-green-500/20 transition-all font-medium text-slate-700" placeholder="123/45" />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">หมู่ที่</label>
                        <input {...form.register('village')} className="w-full px-4 py-3 bg-slate-50 rounded-2xl border-0 focus:ring-2 focus:ring-green-500/20 transition-all font-medium text-slate-700" placeholder="-" />
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">ถนน / ซอย <span className="text-[9px] font-normal lowercase">(optional)</span></label>
                    <input {...form.register('road')} className="w-full px-4 py-3 bg-slate-50 rounded-2xl border-0 focus:ring-2 focus:ring-green-500/20 transition-all font-medium text-slate-700" placeholder="ชื่อถนน หรือ ซอย" />
                </div>

                <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">จังหวัด</label>
                    <div className="relative">
                        <select 
                            {...form.register('province')} 
                            onChange={(e) => handleProvinceChange(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 rounded-2xl border-0 font-medium text-slate-700 appearance-none disabled:opacity-50"
                            disabled={isAddressLoading}
                        >
                            <option value="">เลือกจังหวัด</option>
                            {allProvinces.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                        </select>
                        <ChevronDown className="absolute right-4 top-3.5 w-5 h-5 text-slate-400 pointer-events-none" />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="relative">
                        <select 
                            {...form.register('district')} 
                            onChange={(e) => handleAmphureChange(e.target.value)}
                            disabled={!form.watch('province')}
                            className="w-full px-4 py-3 bg-slate-50 rounded-2xl border-0 font-medium text-slate-700 appearance-none disabled:opacity-50"
                        >
                            <option value="">อำเภอ/เขต</option>
                            {amphureOptions.map(a => <option key={a.id} value={a.name}>{a.name}</option>)}
                        </select>
                        <ChevronDown className="absolute right-4 top-3.5 w-5 h-5 text-slate-400 pointer-events-none" />
                    </div>
                    <div className="relative">
                        <select 
                            {...form.register('subDistrict')} 
                            onChange={(e) => handleTambonChange(e.target.value)}
                            disabled={!form.watch('district')}
                            className="w-full px-4 py-3 bg-slate-50 rounded-2xl border-0 font-medium text-slate-700 appearance-none disabled:opacity-50"
                        >
                            <option value="">ตำบล/แขวง</option>
                            {tambonOptions.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                        </select>
                        <ChevronDown className="absolute right-4 top-3.5 w-5 h-5 text-slate-400 pointer-events-none" />
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">รหัสไปรษณีย์</label>
                    <input {...form.register('postalCode')} readOnly className="w-full px-4 py-3 bg-slate-100 rounded-2xl border-0 font-mono font-bold text-slate-500" />
                </div>
            </div>
        </div>

        <button 
            type="submit" 
            disabled={isLoading}
            className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-lg rounded-2xl shadow-lg shadow-blue-500/30 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:scale-100 hover:shadow-xl"
        >
            {isLoading ? <Loader2 className="animate-spin" /> : <Save className="w-5 h-5" />}
            <span>บันทึกข้อมูลผู้ดูแล</span>
        </button>
         
         <p className="text-center text-xs text-slate-400 pb-8 font-medium opacity-60">ข้อมูลของคุณจะถูกเก็บรักษาอย่างปลอดภัย</p>

      </form>
    </div>
  );
}