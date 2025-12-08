'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { userFormSchema } from '@/lib/validations/user.schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { updateUser } from '@/actions/user.actions';
import { Label } from '@/components/ui/label'; // เพิ่ม Label สวยๆ
import { Loader2, Save } from 'lucide-react'; // ✅ เพิ่มบรรทัดนี้

interface UserFormProps {
  initialData?: any;
}

export function UserForm({ initialData }: UserFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      firstName: initialData?.firstName || '',
      lastName: initialData?.lastName || '',
      username: initialData?.username || '',
      password: '',
      phone: initialData?.phone || '',
      lineId: initialData?.lineId || '',
      
      // ✅ เปลี่ยนจาก statusId เป็น role
      // ถ้าไม่มี initialData ให้ default เป็น CAREGIVER
      role: initialData?.role || 'CAREGIVER',
      isActive: initialData?.isActive ?? true,
      
      // ✅ เพิ่มที่อยู่ (ถ้ามีข้อมูลเดิมก็ใส่มา)
      houseNumber: initialData?.houseNumber || '',
      village: initialData?.village || '',
      road: initialData?.road || '',
      subDistrict: initialData?.subDistrict || '',
      district: initialData?.district || '',
      province: initialData?.province || '',
      postalCode: initialData?.postalCode || '',
    },
  });

  const onSubmit = async (data: any) => {
    setIsLoading(true);
    try {
      let result;
      if (initialData) {
        result = await updateUser(initialData.id, data);
      }

      if (result?.success) {
        toast.success('บันทึกข้อมูลสำเร็จ');
        router.refresh();
        router.back(); // กลับไปหน้าก่อนหน้า
      } else {
        toast.error(result?.error || 'เกิดข้อผิดพลาด');
      }
    } catch (error) {
      toast.error('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 max-w-4xl">
      
      {/* 1. ข้อมูลส่วนตัว */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
        <h3 className="text-lg font-bold text-gray-800 border-b pb-2">ข้อมูลส่วนตัว</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label>ชื่อจริง <span className="text-red-500">*</span></Label>
                <Input {...form.register('firstName')} placeholder="ชื่อ" />
                {form.formState.errors.firstName && <p className="text-xs text-red-500">{form.formState.errors.firstName.message?.toString()}</p>}
            </div>
            <div className="space-y-2">
                <Label>นามสกุล <span className="text-red-500">*</span></Label>
                <Input {...form.register('lastName')} placeholder="นามสกุล" />
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label>เบอร์โทรศัพท์</Label>
                <Input {...form.register('phone')} placeholder="08xxxxxxxx" />
            </div>
            <div className="space-y-2">
                <Label>LINE ID</Label>
                <Input {...form.register('lineId')} placeholder="line_id" />
            </div>
        </div>
      </div>

      {/* 2. ข้อมูลเข้าระบบ (Login & Role) */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
         <h3 className="text-lg font-bold text-gray-800 border-b pb-2">การเข้าใช้งาน</h3>
         
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label>ชื่อผู้ใช้ (Username)</Label>
                <Input {...form.register('username')} placeholder="username" />
            </div>
            <div className="space-y-2">
                <Label>รหัสผ่านใหม่ <span className="text-xs text-gray-400">(เว้นว่างถ้าไม่เปลี่ยน)</span></Label>
                <Input type="password" {...form.register('password')} placeholder="••••••" />
            </div>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="space-y-2">
                <Label>สิทธิ์การใช้งาน (Role)</Label>
                <select 
                    {...form.register('role')}
                    className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="CAREGIVER">ผู้ดูแล</option>
                    <option value="ADMIN">ผู้ดูแลระบบ</option>
                    <option value="DEPENDENT">ผู้สูงอายุ</option>
                </select>
             </div>

             <div className="space-y-2">
                <Label>สถานะบัญชี</Label>
                <div className="flex items-center space-x-3 p-2 border border-gray-200 rounded-md h-10 bg-gray-50">
                    <Controller
                        control={form.control}
                        name="isActive"
                        render={({ field }) => (
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                        )}
                    />
                    <span className={`text-sm font-medium ${form.watch('isActive') ? 'text-green-600' : 'text-red-500'}`}>
                        {form.watch('isActive') ? 'ใช้งานปกติ' : 'ถูกระงับ'}
                    </span>
                </div>
             </div>
         </div>
      </div>

      {/* 3. ที่อยู่ (Address) - เพิ่มส่วนนี้เข้ามา */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
         <h3 className="text-lg font-bold text-gray-800 border-b pb-2">ที่อยู่</h3>
         
         <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2"><Label>บ้านเลขที่</Label><Input {...form.register('houseNumber')} /></div>
             <div className="space-y-2"><Label>หมู่ที่</Label><Input {...form.register('village')} /></div>
         </div>
         
         <div className="space-y-2"><Label>ถนน/ซอย</Label><Input {...form.register('road')} /></div>

         <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2"><Label>ตำบล/แขวง</Label><Input {...form.register('subDistrict')} /></div>
             <div className="space-y-2"><Label>อำเภอ/เขต</Label><Input {...form.register('district')} /></div>
         </div>

         <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2"><Label>จังหวัด</Label><Input {...form.register('province')} /></div>
             <div className="space-y-2"><Label>รหัสไปรษณีย์</Label><Input {...form.register('postalCode')} /></div>
         </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 pt-4 justify-end">
        <Button type="button" variant="outline" onClick={() => router.back()} className="w-32">
          ยกเลิก
        </Button>
        <Button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700 w-40">
          {isLoading ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : <Save className="w-4 h-4 mr-2" />}
          บันทึก
        </Button>
      </div>
    </form>
  );
}