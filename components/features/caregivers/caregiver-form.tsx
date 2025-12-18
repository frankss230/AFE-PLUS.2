"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Save, User, MapPin, Heart } from "lucide-react";
import { updateCaregiver } from "@/actions/caregiver.actions"; // ⚠️ เช็ค path ให้ถูกนะครับ

// ✅ Schema: เพิ่ม gender และ maritalStatus
const formSchema = z.object({
  firstName: z.string().min(1, "กรุณากรอกชื่อจริง"),
  lastName: z.string().min(1, "กรุณากรอกนามสกุล"),
  phone: z.string().optional(),
  lineId: z.string().optional(),
  
  gender: z.string().optional(),        // ✅ เพิ่ม
  maritalStatus: z.string().optional(), // ✅ เพิ่ม
  birthday: z.string().optional(),
  
  role: z.string().optional(),
  isActive: z.boolean().optional(),
  
  houseNumber: z.string().optional(),
  village: z.string().optional(),
  road: z.string().optional(),
  subDistrict: z.string().optional(),
  district: z.string().optional(),
  province: z.string().optional(),
  postalCode: z.string().optional(),
});

interface UserFormProps {
  initialData?: any;
  onSuccess?: () => void;
}

export function UserForm({ initialData, onSuccess }: UserFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: initialData?.firstName || "",
      lastName: initialData?.lastName || "",
      phone: initialData?.phone || "",
      lineId: initialData?.lineId || "",
      
      // ✅ Map ค่าเริ่มต้น (ถ้าไม่มีให้เป็น UNSPECIFIED/SINGLE)
      gender: initialData?.gender || "UNSPECIFIED",
      maritalStatus: initialData?.maritalStatus || "SINGLE",
      birthday: initialData?.birthday ? new Date(initialData.birthday).toISOString().split('T')[0] : "",

      role: initialData?.role || "CAREGIVER",
      isActive: initialData?.isActive ?? true,
      
      houseNumber: initialData?.houseNumber || "",
      village: initialData?.village || "",
      road: initialData?.road || "",
      subDistrict: initialData?.subDistrict || "",
      district: initialData?.district || "",
      province: initialData?.province || "",
      postalCode: initialData?.postalCode || "",
    },
  });

  const onSubmit = async (data: any) => {
    setIsLoading(true);
    try {
      const result = await updateCaregiver(initialData.id, data);

      if (result.success) {
        toast.success("บันทึกข้อมูลสำเร็จ");
        router.refresh(); 
        if (onSuccess) onSuccess();
        else router.back();
      } else {
        toast.error("เกิดข้อผิดพลาด: " + result.error);
      }
    } catch (error) {
      toast.error("เกิดข้อผิดพลาดในการเชื่อมต่อ");
    } finally {
      setIsLoading(false);
    }
  };

  // --- UI Helper Components ---
  const Label = ({ children, className }: any) => (
    <label className={`text-sm font-medium text-gray-700 block mb-1.5 ${className}`}>
      {children}
    </label>
  );
  
  const Input = (props: any) => (
    <input 
      {...props} 
      className={`flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-60 disabled:bg-slate-100 disabled:text-slate-500 ${props.className}`} 
    />
  );

  const Select = ({ children, ...props }: any) => (
    <div className="relative">
        <select 
            {...props}
            className={`flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none disabled:bg-slate-100 ${props.className}`}
        >
            {children}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
            <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/></svg>
        </div>
    </div>
  );

  const Button = ({ children, className, variant, ...props }: any) => {
    const baseClass = "inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 disabled:opacity-50 disabled:pointer-events-none";
    const variantClass = variant === "outline" 
      ? "border border-gray-300 bg-transparent hover:bg-gray-50 text-gray-700" 
      : "bg-slate-900 text-white hover:bg-slate-800 shadow-md";
    return <button {...props} className={`${baseClass} ${variantClass} ${className || ""}`}>{children}</button>;
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-4xl">
      
      {/* 1. ข้อมูลส่วนตัว */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
        <h3 className="text-lg font-bold text-gray-800 border-b pb-2 flex items-center gap-2">
            <User className="w-5 h-5 text-blue-500" /> ข้อมูลส่วนตัว
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
                <Label>ชื่อจริง <span className="text-red-500">*</span></Label>
                <Input {...form.register('firstName')} placeholder="ชื่อ" />
                {form.formState.errors.firstName && <p className="text-xs text-red-500">กรุณากรอกชื่อจริง</p>}
            </div>
            <div className="space-y-1">
                <Label>นามสกุล <span className="text-red-500">*</span></Label>
                <Input {...form.register('lastName')} placeholder="นามสกุล" />
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
                <Label>เบอร์โทรศัพท์</Label>
                <Input {...form.register('phone')} placeholder="08xxxxxxxx" />
            </div>
            <div className="space-y-1">
                <Label>LINE ID <span className="text-xs text-gray-400 font-normal">(แก้ไขไม่ได้)</span></Label>
                {/* ✅ Disabled Line ID */}
                <Input {...form.register('lineId')} disabled placeholder="-" />
            </div>
        </div>
        
        {/* ✅ แถวใหม่: วันเกิด, เพศ, สถานะสมรส */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-dashed pt-4 mt-2">
            <div className="space-y-1">
                <Label>วันเกิด</Label>
                <Input type="date" {...form.register('birthday')} />
            </div>
            <div className="space-y-1">
                <Label>เพศ</Label>
                <Select {...form.register('gender')}>
                    <option value="UNSPECIFIED">ไม่ระบุ</option>
                    <option value="MALE">ชาย</option>
                    <option value="FEMALE">หญิง</option>
                </Select>
            </div>
            <div className="space-y-1">
                <Label>สถานะสมรส</Label>
                <Select {...form.register('maritalStatus')}>
                    <option value="SINGLE">โสด</option>
                    <option value="MARRIED">สมรส</option>
                    <option value="WIDOWED">หม้าย</option>
                    <option value="DIVORCED">หย่าร้าง</option>
                    <option value="SEPARATED">แยกกันอยู่</option>
                </Select>
            </div>
        </div>
      </div>

      {/* 2. สถานะและสิทธิ์ */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
         <h3 className="text-lg font-bold text-gray-800 border-b pb-2 flex items-center gap-2">
            <Heart className="w-5 h-5 text-rose-500" /> สถานะบัญชี
         </h3>
         
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="space-y-1">
                <Label>สิทธิ์การใช้งาน (Role)</Label>
                <Select {...form.register('role')}>
                    <option value="CAREGIVER">ผู้ดูแล</option>
                    <option value="ADMIN">ผู้ดูแลระบบ</option>
                </Select>
             </div>

             <div className="space-y-1">
                <Label>สถานะการใช้งาน</Label>
                <div className="flex items-center space-x-3 p-2 border border-gray-200 rounded-md h-10 bg-gray-50">
                    <Controller
                        control={form.control}
                        name="isActive"
                        render={({ field }) => (
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" checked={field.value} onChange={field.onChange} className="sr-only peer" />
                                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-600"></div>
                            </label>
                        )}
                    />
                    <span className={`text-sm font-medium ${form.watch('isActive') ? 'text-green-600' : 'text-red-500'}`}>
                        {form.watch('isActive') ? 'ใช้งานปกติ' : 'ถูกระงับ'}
                    </span>
                </div>
             </div>
         </div>
      </div>

      {/* 3. ที่อยู่ */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
         <h3 className="text-lg font-bold text-gray-800 border-b pb-2 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-orange-500" /> ที่อยู่ปัจจุบัน
         </h3>
         
         <div className="grid grid-cols-2 gap-4">
             <div className="space-y-1"><Label>บ้านเลขที่</Label><Input {...form.register('houseNumber')} /></div>
             <div className="space-y-1"><Label>หมู่ที่</Label><Input {...form.register('village')} /></div>
         </div>
         
         <div className="space-y-1"><Label>ถนน/ซอย</Label><Input {...form.register('road')} /></div>

         <div className="grid grid-cols-2 gap-4">
             <div className="space-y-1"><Label>ตำบล/แขวง</Label><Input {...form.register('subDistrict')} /></div>
             <div className="space-y-1"><Label>อำเภอ/เขต</Label><Input {...form.register('district')} /></div>
         </div>

         <div className="grid grid-cols-2 gap-4">
             <div className="space-y-1"><Label>จังหวัด</Label><Input {...form.register('province')} /></div>
             <div className="space-y-1"><Label>รหัสไปรษณีย์</Label><Input {...form.register('postalCode')} /></div>
         </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 pt-2 justify-end">
        <Button type="button" variant="outline" onClick={() => onSuccess ? onSuccess() : router.back()} className="w-32">
          ยกเลิก
        </Button>
        <Button type="submit" disabled={isLoading} className="w-40">
          {isLoading ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : <Save className="w-4 h-4 mr-2" />}
          บันทึก
        </Button>
      </div>
    </form>
  );
}