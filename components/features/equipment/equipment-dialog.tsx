'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Save, Loader2, Edit } from 'lucide-react';
import { toast } from 'sonner';
import { addEquipment, updateEquipment } from '@/actions/equipment.actions';
import { Switch } from '@/components/ui/switch';

interface EquipmentDialogProps {
  mode?: 'create' | 'edit';
  initialData?: any;
  trigger?: React.ReactNode;
}

export function EquipmentDialog({ mode = 'create', initialData, trigger }: EquipmentDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const data = {
        name: formData.get('name') as string,
        code: formData.get('code') as string,
        isActive: mode === 'edit' ? (formData.get('isActive') === 'on') : true
    };

    let res;
    if (mode === 'create') {
        res = await addEquipment(data);
    } else {
        res = await updateEquipment(initialData.id, data);
    }

    if (res.success) {
        toast.success(mode === 'create' ? "เพิ่มอุปกรณ์เรียบร้อย" : "แก้ไขข้อมูลเรียบร้อย");
        setOpen(false);
    } else {
        toast.error(res.error);
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ? trigger : (
            <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
                <Plus className="w-4 h-4 mr-2"/> เพิ่มอุปกรณ์ใหม่
            </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'เพิ่มอุปกรณ์เข้าคลัง' : 'แก้ไขข้อมูลอุปกรณ์'}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div className="space-y-2">
                <Label>ชื่อรุ่น / ชื่ออุปกรณ์ <span className="text-red-500">*</span></Label>
                <Input name="name" required placeholder="เช่น Samsung Galaxy Watch 4" defaultValue={initialData?.name} />
            </div>
            
            <div className="space-y-2">
                <Label>รหัสครุภัณฑ์ / Serial Number <span className="text-red-500">*</span></Label>
                <Input name="code" required placeholder="เช่น SW-2024-001" defaultValue={initialData?.code} />
                <p className="text-xs text-gray-400">รหัสนี้จะใช้สำหรับแปะที่ตัวเครื่องเพื่อระบุตัวตน</p>
            </div>

            {mode === 'edit' && (
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                    <Label>สถานะการใช้งาน</Label>
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">{initialData?.isActive ? 'พร้อมใช้งาน' : 'ส่งซ่อม/เลิกใช้'}</span>
                        <Switch name="isActive" defaultChecked={initialData?.isActive} />
                    </div>
                </div>
            )}

            <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                บันทึกข้อมูล
            </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}