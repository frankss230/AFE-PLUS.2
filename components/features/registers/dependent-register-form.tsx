'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import liff from '@line/liff';
import { toast } from 'sonner';
import { registerElderly } from '@/actions/dependent.actions';
import { dependentRegisterSchema, DependentRegisterInput } from '@/lib/validations/dependent-register.schema'; // ✅ ชื่อ Schema ที่ถูก
import { getThaiAddressData, ThaiProvince, ThaiAmphure, ThaiTambon } from '@/services/thai-data.service';
import { Loader2, Save, User, MapPin, Phone, Heart, Activity, ChevronDown, Calendar } from 'lucide-react';

export function RegisterElderlyForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [isAddressLoading, setIsAddressLoading] = useState(true);
  const [liffReady, setLiffReady] = useState(false);
  const [profile, setProfile] = useState<any>(null);

  const [allProvinces, setAllProvinces] = useState<ThaiProvince[]>([]);
  const [amphureOptions, setAmphureOptions] = useState<ThaiAmphure[]>([]);
  const [tambonOptions, setTambonOptions] = useState<ThaiTambon[]>([]);

  const form = useForm<DependentRegisterInput>({
    resolver: zodResolver(dependentRegisterSchema),
    defaultValues: {
      lineId: '',
      gender: 'UNSPECIFIED',
      marital: 'SINGLE',
      birthday: new Date().toISOString().split('T')[0],
      pin: '',
      province: '',
      district: '',
      subDistrict: '',
      postalCode: '',
      // เพิ่มค่า default ให้ครบตาม Schema
      firstName: '',
      lastName: '',
      phone: '',
      houseNumber: '',
      village: '',
      road: '',
      diseases: '',
      medications: '',
    },
  });

  // ✅ Init Data (เหมือนเดิม)
  useEffect(() => {
    const initData = async () => {
      try {
        setIsAddressLoading(true);

        const [addressResult] = await Promise.allSettled([
          getThaiAddressData(),
          (async () => {
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
          })()
        ]);

        if (addressResult.status === 'fulfilled') {
          setAllProvinces(addressResult.value);
        }

        if (!liff.isLoggedIn()) {
             liff.login();
             return;
        }

        const userProfile = await liff.getProfile();
        setProfile(userProfile);
        form.setValue('lineId', userProfile.userId);
        
        setLiffReady(true);
        setIsAddressLoading(false);

      } catch (error) {
        console.error('Critical Init Error:', error);
        setIsAddressLoading(false);
        toast.error('เกิดข้อผิดพลาดในการโหลดข้อมูล');
      }
    };

    initData();
  }, [form]);

  const handleProvinceChange = (provinceName: string) => {
    form.setValue('province', provinceName);
    form.setValue('district', '');
    form.setValue('subDistrict', '');
    form.setValue('postalCode', '');
    const province = allProvinces.find(p => p.name === provinceName);
    setAmphureOptions(province ? province.amphure : []);
    setTambonOptions([]);
  };

  const handleAmphureChange = (amphureName: string) => {
    form.setValue('district', amphureName);
    form.setValue('subDistrict', '');
    form.setValue('postalCode', '');
    const amphure = amphureOptions.find(a => a.name === amphureName);
    setTambonOptions(amphure ? amphure.tambon : []);
  };

  const handleTambonChange = (tambonName: string) => {
    form.setValue('subDistrict', tambonName);
    const tambon = tambonOptions.find(t => t.name === tambonName);
    if (tambon) form.setValue('postalCode', tambon.zipCode);
  };

  // --- Submit ---
  const onSubmit = async (data: any) => {
    setIsLoading(true);
    try {
        // แปลง Type
        const inputData = data as DependentRegisterInput;
        
        // เรียก Server Action
        const res = await registerElderly(inputData);
        
        if (res.success) {
            toast.success('ลงทะเบียนสำเร็จ! เพิ่มผู้สูงอายุคนถัดไปได้เลยครับ');
            
            setTimeout(() => {
                window.location.reload();
            }, 1500);
            
        } else {
            toast.error(res.error);
        }
    } catch(e) { 
        toast.error("เกิดข้อผิดพลาดที่ไม่คาดคิด"); 
        console.error(e);
    } finally {
        setIsLoading(false);
    }
  };

  if (!liffReady) return <div className="h-screen flex items-center justify-center bg-orange-50"><Loader2 className="animate-spin text-orange-500 w-10 h-10" /></div>;

  return (
    <div className="min-h-screen bg-orange-50 pb-10 font-sans">
      
      {/* Header */}
      <div className="relative bg-white pb-10 rounded-b-[2.5rem] shadow-lg overflow-hidden">
         <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-orange-50 to-white pointer-events-none" />
         
         <div className="relative z-10 pt-10 px-6 text-center">
            <div className="mx-auto w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mb-3 shadow-sm border border-orange-200">
                <Heart className="w-8 h-8 text-orange-500" fill="currentColor" fillOpacity={0.2} />
            </div>
            <h1 className="text-2xl font-black text-slate-800 mb-1 tracking-tight">ลงทะเบียนผู้สูงอายุ</h1>
            <p className="text-slate-500 text-sm font-medium">ข้อมูลผู้ที่อยู่ในความดูแลของท่าน</p>
         </div>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="px-5 -mt-6 relative z-20 max-w-lg mx-auto space-y-6">
        
        {/* 1. ข้อมูลส่วนตัว */}
        <div className="bg-white p-6 rounded-3xl shadow-xl shadow-orange-900/5 border border-white/50">
          <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-600">
                    <User className="w-5 h-5" />
                </div>
                <h2 className="text-lg font-bold text-slate-800">ข้อมูลส่วนตัว</h2>
          </div>
          
          <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">ชื่อ</label>
                    <input {...form.register('firstName')} className="w-full px-4 py-3 bg-slate-50 rounded-2xl border-0 focus:ring-2 focus:ring-orange-500/20 transition-all font-bold text-slate-700 placeholder:text-slate-300" placeholder="ระบุชื่อ" />
                </div>
                <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">นามสกุล</label>
                    <input {...form.register('lastName')} className="w-full px-4 py-3 bg-slate-50 rounded-2xl border-0 focus:ring-2 focus:ring-orange-500/20 transition-all font-bold text-slate-700 placeholder:text-slate-300" placeholder="ระบุนามสกุล" />
                </div>
              </div>

              {/* 👇 ✅ เพิ่มช่อง PIN ตรงนี้ (ต่อจากชื่อ-นามสกุล หรือก่อนวันเกิดก็ได้) */}
              <div className="space-y-1.5 mb-4">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">
                      รหัส PIN (สำหรับเชื่อมต่อนาฬิกา) <span className="text-red-500">*</span>
                  </label>
                  <input 
                      type="tel" 
                      maxLength={4}
                      {...form.register('pin')} 
                      className="w-full px-4 py-3 bg-slate-50 rounded-2xl border-0 focus:ring-2 focus:ring-orange-500/20 transition-all font-bold text-slate-700 tracking-[0.5em] text-center text-xl placeholder:tracking-normal placeholder:text-sm placeholder:font-normal" 
                      placeholder="ตั้งรหัส 4 หลัก" 
                  />
                  {form.formState.errors.pin && <p className="text-xs text-red-500 ml-1">{form.formState.errors.pin.message}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">วันเดือนปีเกิด</label>
                <div className="relative">
                    <input type="date" {...form.register('birthday')} className="w-full px-4 py-3 bg-slate-50 rounded-2xl border-0 font-medium text-slate-600 focus:ring-2 focus:ring-orange-500/20" />
                    <Calendar className="absolute right-4 top-3.5 w-5 h-5 text-slate-400 pointer-events-none" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">เพศ</label>
                    <div className="relative">
                        <select {...form.register('gender')} className="w-full px-4 py-3 bg-slate-50 rounded-2xl border-0 font-medium text-slate-600 appearance-none">
                            <option value="MALE">ชาย</option>
                            <option value="FEMALE">หญิง</option>
                            <option value="UNSPECIFIED">ไม่ระบุ</option>
                        </select>
                        <ChevronDown className="absolute right-4 top-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>
                </div>
                <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">สถานะสมรส</label>
                    <div className="relative">
                        <select {...form.register('marital')} className="w-full px-4 py-3 bg-slate-50 rounded-2xl border-0 font-medium text-slate-600 appearance-none">
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
        </div>

        {/* 2. Address */}
        <div className="bg-white p-6 rounded-3xl shadow-xl shadow-orange-900/5 border border-white/50">
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

        {/* 3. Contact & Health */}
        <div className="bg-white p-6 rounded-3xl shadow-xl shadow-orange-900/5 border border-white/50">
            <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-600">
                    <Activity className="w-5 h-5" />
                </div>
                <h2 className="text-lg font-bold text-slate-800">ข้อมูลสุขภาพ</h2>
            </div>

            <div className="space-y-4">
                <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">เบอร์โทรศัพท์ (ฉุกเฉิน)</label>
                    <div className="relative">
                        <Phone className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                        <input type="tel" {...form.register('phone')} className="w-full pl-12 pr-4 py-3 bg-slate-50 rounded-2xl border-0 focus:ring-2 focus:ring-rose-500/20 transition-all font-bold text-slate-700 tracking-wide placeholder:text-slate-300" placeholder="08xxxxxxxx" maxLength={10} />
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">โรคประจำตัว</label>
                    <textarea {...form.register('diseases')} className="w-full px-4 py-3 bg-slate-50 rounded-2xl border-0 focus:ring-2 focus:ring-rose-500/20 transition-all font-medium text-slate-700 placeholder:text-slate-300 min-h-[80px]" placeholder="เช่น ความดันโลหิตสูง, เบาหวาน" />
                </div>

                 <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">ยาที่ใช้ประจำ</label>
                    <textarea {...form.register('medications')} className="w-full px-4 py-3 bg-slate-50 rounded-2xl border-0 focus:ring-2 focus:ring-rose-500/20 transition-all font-medium text-slate-700 placeholder:text-slate-300 min-h-[80px]" placeholder="ระบุชื่อยาที่ทานประจำ (ถ้ามี)" />
                </div>
            </div>
        </div>

        {/* Submit Button */}
        <button 
            type="submit" 
            disabled={isLoading}
            className="w-full py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold text-lg rounded-2xl shadow-lg shadow-orange-500/30 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:scale-100 hover:shadow-xl"
        >
            {isLoading ? <Loader2 className="animate-spin" /> : <Save className="w-5 h-5" />}
            {isLoading ? 'กำลังบันทึก...' : 'ยืนยันการลงทะเบียน'}
        </button>

        <p className="text-center text-xs text-slate-400 pb-6 font-medium opacity-60">
            ข้อมูลจะถูกนำไปใช้เพื่อการดูแลสุขภาพเท่านั้น
        </p>

      </form>
    </div>
  );
}