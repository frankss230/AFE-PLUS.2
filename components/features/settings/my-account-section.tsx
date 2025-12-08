'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { User, ChevronDown, ChevronUp, Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { updateUser } from '@/actions/user.actions';

interface MyAccountProps {
  user: any;
}

export function MyAccountSection({ user }: MyAccountProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    
    const formData = new FormData(e.currentTarget);
    
    const updateData = {
        firstName: formData.get('firstName') as string,
        lastName: formData.get('lastName') as string,
        phone: formData.get('phone') as string,
        username: user.username, // ส่งค่าเดิมกลับไป
        statusId: 1, // admin
        isActive: true,
        password: formData.get('password') as string || undefined,
    };

    const res = await updateUser(user.id, updateData as any);

    if (res.success) {
        toast.success("อัปเดตข้อมูลส่วนตัวเรียบร้อย");
        setIsOpen(false); // ปิด Dropdown เมื่อเสร็จ
    } else {
        toast.error(res.error);
    }
    setLoading(false);
  };

  return (
    <Card className=" shadow-md overflow-hidden transition-all duration-300">
      {/* Header ที่กดได้ (Toggle) */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="cursor-pointer border-b p-6 flex items-center justify-between transition-colors"
      >
        <div>
            <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-slate-800" />
                <CardTitle className="text-lg">บัญชีของฉัน</CardTitle>
            </div>
            <CardDescription>จัดการข้อมูลส่วนตัว ({user.username})</CardDescription>
        </div>
        {isOpen ? <ChevronUp className="text-slate-400" /> : <ChevronDown className="text-slate-400" />}
      </div>

      {/* Content ที่ยืดหดได้ */}
      {isOpen && (
        <CardContent className="p-6 bg-white animate-in slide-in-from-top-2 duration-200">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>ชื่อผู้ใช้</Label>
                <Input value={user.username} disabled className="bg-gray-100 font-mono text-gray-500" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>ชื่อจริง</Label>
                    <Input name="firstName" defaultValue={user.adminProfile?.firstName} required />
                </div>
                <div className="space-y-2">
                    <Label>นามสกุล</Label>
                    <Input name="lastName" defaultValue={user.adminProfile?.lastName} required />
                </div>
              </div>

              <div className="space-y-2">
                <Label>เบอร์โทรศัพท์</Label>
                <Input name="phone" defaultValue={user.adminProfile?.phone || ''} />
              </div>

              <Separator className="my-2" />
              <p className="text-xs text-gray-400">เปลี่ยนรหัสผ่าน (เว้นว่างไว้ถ้าไม่ต้องการเปลี่ยน)</p>

              <div className="space-y-2">
                <Label>รหัสผ่านใหม่</Label>
                <Input name="password" type="password" placeholder="••••••••" />
              </div>

              <div className="pt-2">
                  <Button type="submit" className="w-full bg-slate-800 hover:bg-slate-900 text-white" disabled={loading}>
                    {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                    บันทึกการแก้ไข
                  </Button>
              </div>
            </form>
        </CardContent>
      )}
    </Card>
  );
}