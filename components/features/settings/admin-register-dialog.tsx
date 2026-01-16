'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserPlus, Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { createAdmin } from '@/actions/user.actions';

export function AdminRegisterDialog() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    if (data.password !== data.confirmPassword) {
      toast.error("รหัสผ่านไม่ตรงกัน");
      setLoading(false);
      return;
    }

    const res = await createAdmin(data);
    if (res.success) {
      toast.success("สร้างบัญชี Admin เรียบร้อย");
      setOpen(false);
    } else {
      toast.error(res.error);
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-2 shadow-sm">
          <UserPlus className="w-4 h-4" /> เพิ่มผู้ดูแลระบบ
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>เพิ่มผู้ดูแลระบบใหม่</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>ชื่อจริง</Label>
              <Input name="firstName" required placeholder="สมชาย" />
            </div>
            <div className="space-y-2">
              <Label>นามสกุล</Label>
              <Input name="lastName" required placeholder="ใจดี" />
            </div>
          </div>

          <div className="space-y-2">
            <Label>เบอร์โทรศัพท์</Label>
            <Input name="phone" type="tel" placeholder="กรอกเบอร์โทรศัพท์" />
          </div>

          <div className="space-y-2">
            <Label>ตำแหน่ง</Label>
            <Input name="position" placeholder="เช่น IT Support, Manager" />
          </div>

          <div className="space-y-2">
            <Label>ชื่อผู้ใช้</Label>
            <Input name="username" required placeholder="admin_new" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>รหัสผ่าน</Label>
              <Input name="password" type="password" required />
            </div>
            <div className="space-y-2">
              <Label>ยืนยันรหัสผ่าน</Label>
              <Input name="confirmPassword" type="password" required />
            </div>
          </div>

          <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 rounded-lg" disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            บันทึกข้อมูล
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}