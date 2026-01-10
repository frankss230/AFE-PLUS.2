'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/store';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { User, Lock } from 'lucide-react';

export function LoginForm() {
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'เข้าสู่ระบบไม่สำเร็จ');
      }

      setUser(data.user);
      toast.success('เข้าสู่ระบบสำเร็จ');
      router.push('/admin/dashboard');
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'เกิดข้อผิดพลาด');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      
      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-600 pl-1">ชื่อผู้ใช้</label>
        <div className="relative">
          <div className="absolute left-3 top-3.5 text-gray-400">
            <User className="h-5 w-5" />
          </div>
          <input
            type="text"
            required
            disabled={loading}
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            placeholder="กรอกชื่อผู้ใช้"
            className="w-full pl-10 p-3 bg-gray-50 border border-transparent rounded-xl text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-600 pl-1">รหัสผ่าน</label>
        <div className="relative">
          <div className="absolute left-3 top-3.5 text-gray-400">
            <Lock className="h-5 w-5" />
          </div>
          <input
            type="password"
            required
            disabled={loading}
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            placeholder="กรอกรหัสผ่าน"
            className="w-full pl-10 p-3 bg-gray-50 border border-transparent rounded-xl text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
          />
        </div>
      </div>

      <Button 
        type="submit" 
        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/30 text-lg py-6 rounded-xl font-bold transition-all hover:scale-[1.02] active:scale-[0.98]" 
        isLoading={loading}
      >
        {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
      </Button>

    </form>
  );
}