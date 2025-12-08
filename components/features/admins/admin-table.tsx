'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { deleteUser } from '@/actions/user.actions';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, 
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from "@/components/ui/alert-dialog";

// Interface เฉพาะของ Admin
export interface AdminData {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  phone: string;
  position: string;
  isActive: boolean;
}

export function AdminTable({ data }: { data: AdminData[] }) {
  const [targetDelete, setTargetDelete] = useState<{ id: number, name: string } | null>(null);

  const handleDelete = async () => {
    if (!targetDelete) return;
    const res = await deleteUser(targetDelete.id);
    if (res.success) {
        toast.success('ลบผู้ดูแลระบบเรียบร้อย');
        setTargetDelete(null);
    } else {
        toast.error(res.error);
    }
  };

  return (
    <>
      <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-500 font-medium border-b">
            <tr>
              <th className="px-6 py-3">Admin ID</th>
              <th className="px-6 py-3">ชื่อ-นามสกุล</th>
              <th className="px-6 py-3">ตำแหน่ง</th>
              <th className="px-6 py-3">Username</th>
              <th className="px-6 py-3">เบอร์โทร</th>
              <th className="px-6 py-3 text-right">จัดการ</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-100">
            {data.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 font-mono text-slate-400">#{item.id}</td>
                <td className="px-6 py-4 font-bold text-slate-800">{item.firstName} {item.lastName}</td>
                <td className="px-6 py-4">
                    <Badge variant="success" className="bg-purple-100 text-purple-700 hover:bg-purple-100">
                        {item.position}
                    </Badge>
                </td>
                <td className="px-6 py-4 font-mono text-slate-600">{item.username}</td>
                <td className="px-6 py-4 text-slate-600">{item.phone}</td>
                <td className="px-6 py-4 text-right">
                  <Button 
                    variant="ghost" size="icon" className="text-red-400 hover:text-red-600 hover:bg-red-50"
                    onClick={() => setTargetDelete({ id: item.id, name: item.username })}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
       <AlertDialog open={!!targetDelete} onOpenChange={(o) => !o && setTargetDelete(null)}>
         <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>ลบผู้ดูแลระบบ?</AlertDialogTitle>
                <AlertDialogDescription>คุณต้องการลบ Admin "{targetDelete?.name}" ใช่หรือไม่?</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-red-600">ยืนยันลบ</AlertDialogAction>
            </AlertDialogFooter>
         </AlertDialogContent>
       </AlertDialog>
    </>
  );
}