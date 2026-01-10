'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trash2, Eye, MapPin, Loader2, AlertTriangle, User } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { deleteUser } from '@/actions/user.actions';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, 
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from "@/components/ui/alert-dialog";


export interface DependentData {
  id: number;
  firstName: string;
  lastName: string;
  phone: string;
  birthday: Date | null;
  gender: string;
  isActive: boolean;
  caregiver?: {
    firstName: string;
    lastName: string;
    phone: string;
  } | null;
}

export function DependentTable({ data }: { data: DependentData[] }) {
  const [targetDelete, setTargetDelete] = useState<{ id: number, name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  
  const calculateAge = (birthday: Date | null) => {
    if (!birthday) return '-';
    const today = new Date();
    const birthDate = new Date(birthday);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
    return age;
  };

  const handleDelete = async () => {
    if (!targetDelete) return;
    setIsDeleting(true);
    try {
      const res = await deleteUser(targetDelete.id);
      if (res.success) {
        toast.success('ลบข้อมูลเรียบร้อยแล้ว');
        setTargetDelete(null);
      } else {
        toast.error(res.error);
      }
    } catch (error) {
      toast.error('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setIsDeleting(false);
    }
  };

  if (data.length === 0) {
    return (
      <div className="text-center py-16 text-gray-500 bg-white rounded-xl border border-dashed border-gray-300 flex flex-col items-center gap-2">
        <User className="w-10 h-10 text-gray-300" />
        <p>ยังไม่มีข้อมูลผู้สูงอายุในระบบ</p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
        <table className="w-full text-sm text-left">
          {}
          <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
            <tr>
              <th className="px-6 py-3 w-[80px]">ID</th>
              <th className="px-6 py-3">ชื่อ-นามสกุล</th>
              <th className="px-6 py-3">อายุ / เพศ</th>
              <th className="px-6 py-3">เบอร์โทร (นาฬิกา)</th>
              <th className="px-6 py-3">ผู้ดูแลหลัก</th>
              <th className="px-6 py-3 text-right">จัดการ</th>
            </tr>
          </thead>
          
          <tbody className="bg-white divide-y divide-slate-100">
            {data.map((item) => (
              <tr key={item.id} className="hover:bg-blue-50/30 transition-colors">
                <td className="px-6 py-4 font-mono text-slate-400">#{item.id}</td>
                
                <td className="px-6 py-4">
                    <div className="font-bold text-slate-800">{item.firstName} {item.lastName}</div>
                    
                    {}
                    <div className={`text-xs ${item.isActive ? 'text-green-600' : 'text-red-600'}`}>
                        {item.isActive ? '● ใช้งานปกติ' : '● ถูกระงับ'}
                    </div>
                </td>

                <td className="px-6 py-4">
                  <div className="flex flex-col items-start gap-1">
                    <span className="text-slate-700 font-medium">{calculateAge(item.birthday)} ปี</span>
                    <Badge variant="default" className="text-[12px] px-2 bg-slate-50 text-slate-500 border-slate-200">
                      {item.gender === 'MALE' ? 'ชาย' : item.gender === 'FEMALE' ? 'หญิง' : 'ไม่ระบุ'}
                    </Badge>
                  </div>
                </td>

                <td className="px-6 py-4 font-mono text-slate-600">
                  {item.phone || '-'}
                </td>

                <td className="px-6 py-4">
                  {item.caregiver ? (
                      <div className="flex flex-col">
                        <span className="font-medium text-blue-700">
                          คุณ{item.caregiver.firstName} {item.caregiver.lastName}
                        </span>
                        <span className="text-xs text-slate-400">
                          {item.caregiver.phone || '-'}
                        </span>
                      </div>
                  ) : (
                      <span className="text-slate-400 italic text-xs">ไม่มีผู้ดูแล</span>
                  )}
                </td>

                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-1">
                    
                    {}
                    <Link href={`/admin/monitoring?focusUser=${item.id}`}>
                      <Button variant="ghost" size="icon" className="text-blue-600 hover:bg-blue-50" title="ดูตำแหน่ง">
                        <MapPin className="w-4 h-4" />
                      </Button>
                    </Link>

                    {}
                    <Link href={`/admin/dependents/${item.id}`}>
                      <Button variant="ghost" size="icon" className="text-slate-400 hover:text-blue-600 hover:bg-blue-50">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </Link>

                    {}
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-slate-400 hover:text-red-600 hover:bg-red-50"
                      onClick={() => setTargetDelete({ id: item.id, name: `${item.firstName} ${item.lastName}` })}
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

      {}
      <AlertDialog open={!!targetDelete} onOpenChange={(open) => !open && setTargetDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-3 text-red-600 mb-2">
                <div className="p-2 bg-red-100 rounded-full">
                    <AlertTriangle className="w-6 h-6" />
                </div>
                <AlertDialogTitle>ยืนยันการลบข้อมูล</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-gray-600">
              คุณต้องการลบผู้สูงอายุ <b>"{targetDelete?.name}"</b> ใช่หรือไม่? <br/>
              <span className="text-xs text-red-500 mt-2 block">* ข้อมูลสุขภาพและการแจ้งเตือนทั้งหมดจะหายไป</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction 
                onClick={(e) => { e.preventDefault(); handleDelete(); }} 
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> กำลังลบ...</> : 'ยืนยันลบ'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}