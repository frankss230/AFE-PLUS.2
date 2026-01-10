'use client';

import { Badge } from '@/components/ui/badge';

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
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}