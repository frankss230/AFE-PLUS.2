'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Eye, Users, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { deleteUser } from '@/actions/user.actions';
import { toast } from 'sonner';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, 
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from "@/components/ui/alert-dialog";

export interface CaregiverData {
  id: number;
  firstName: string;
  lastName: string;
  phone: string;
  age: number | string;
  gender: string;
  dependentCount: number;
  isActive: boolean;
}

export function CaregiverTable({ data }: { data: CaregiverData[] }) {
  const [targetDelete, setTargetDelete] = useState<{ id: number, name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteClick = (item: CaregiverData) => {
    // 1. เช็คว่ามีผู้สูงอายุในความดูแลไหม?
    if (item.dependentCount > 0) {
        toast.error(`ไม่สามารถลบคุณ "${item.firstName}" ได้`, {
            description: `เนื่องจากยังมีผู้สูงอายุในความดูแล ${item.dependentCount} คน กรุณาลบหรือย้ายผู้สูงอายุก่อนครับ`,
            icon: <AlertCircle className="h-5 w-5 text-red-500" />,
            duration: 4000,
        });
        return;
    }

    setTargetDelete({ id: item.id, name: item.firstName });
  };

  const confirmDelete = async () => {
      if (!targetDelete) return;
      setIsDeleting(true);
      
      const res = await deleteUser(targetDelete.id);
      
      if (res.success) {
          toast.success('ลบข้อมูลเรียบร้อย');
          setTargetDelete(null);
      } else {
          toast.error(res.error);
      }
      setIsDeleting(false);
  };

  return (
    <>
      <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-500 font-medium border-b">
            <tr>
              <th className="px-6 py-3">ID</th>
              <th className="px-6 py-3">ชื่อ-นามสกุล</th>
              <th className="px-6 py-3">อายุ / เพศ</th>
              <th className="px-6 py-3">เบอร์โทร</th>
              <th className="px-6 py-3">ดูแล (คน)</th>
              <th className="px-6 py-3 text-right">จัดการ</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-100">
            {data.map((item) => (
              <tr key={item.id} className="hover:bg-blue-50/30 transition-colors">
                <td className="px-6 py-4 font-mono text-slate-400">#{item.id}</td>
                
                <td className="px-6 py-4">
                    <div className="font-bold text-slate-800">{item.firstName} {item.lastName}</div>
                    <div className={`text-xs ${item.isActive ? 'text-green-600' : 'text-red-600'}`}>
                        {item.isActive ? '● ใช้งานปกติ' : '● ถูกระงับ'}
                    </div>
                </td>

                <td className="px-6 py-4">
                    <div className="flex flex-col items-start gap-1">
                        <span className="text-slate-700 font-medium">{item.age !== '-' ? `${item.age} ปี` : '-'}</span>
                        <Badge variant="default" className="text-[10px] px-2 bg-slate-50 text-slate-500 border-slate-200">
                            {item.gender === 'MALE' ? 'ชาย' : item.gender === 'FEMALE' ? 'หญิง' : 'ไม่ระบุ'}
                        </Badge>
                    </div>
                </td>

                <td className="px-6 py-4 font-mono text-slate-600">{item.phone}</td>
                
                <td className="px-6 py-4">
                    <div className={`flex items-center gap-1 font-bold px-2 py-1 rounded-md w-fit ${
                        item.dependentCount > 0 
                        ? 'text-blue-600 bg-blue-50' 
                        : 'text-slate-400 bg-slate-100'
                    }`}>
                        <Users className="w-3 h-3" /> {item.dependentCount}
                    </div>
                </td>

                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-1">
                    <Link href={`/admin/caregivers/${item.id}`}>
                        <Button variant="ghost" size="icon" className="text-slate-400 hover:text-blue-600"><Eye className="w-4 h-4" /></Button>
                    </Link>
                    <Link href={`/admin/caregivers/${item.id}/edit`}>
                        <Button variant="ghost" size="icon" className="text-slate-400 hover:text-orange-600"><Edit className="w-4 h-4" /></Button>
                    </Link>
                    
                    {/* 🗑️ ปุ่มลบ: เรียกฟังก์ชันใหม่ของเรา */}
                    <Button 
                        variant="ghost" size="icon" 
                        className="text-slate-400 hover:text-red-600" 
                        onClick={() => handleDeleteClick(item)}
                    >
                        <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Dialog ยืนยันการลบ */}
      <AlertDialog open={!!targetDelete} onOpenChange={(o) => !o && setTargetDelete(null)}>
         <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>ยืนยันการลบ?</AlertDialogTitle>
                <AlertDialogDescription>
                    คุณต้องการลบข้อมูลผู้ดูแล <b>"{targetDelete?.name}"</b> ใช่หรือไม่? <br/>
                    <span className="text-red-500 text-xs mt-2 block">* บัญชีผู้ใช้งาน (User) และข้อมูลส่วนตัวทั้งหมดจะถูกลบถาวร</span>
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
                <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
                    {isDeleting ? 'กำลังลบ...' : 'ยืนยันลบ'}
                </AlertDialogAction>
            </AlertDialogFooter>
         </AlertDialogContent>
       </AlertDialog>
    </>
  );
}