'use client';

import { useAuthStore, useAlertStore, useModalStore } from '@/store/store';
import { Bell, Menu, User, LogOut } from 'lucide-react';
import { toast } from 'sonner';

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { user, logout } = useAuthStore();
  const { unreadCount } = useAlertStore();
  const { openModal } = useModalStore();

  const performLogout = async () => {
    try {
      await fetch('/api/auth/logout', { 
        method: 'POST',
      });

      logout();
      if (typeof window !== 'undefined') {
        window.sessionStorage.clear();
        window.localStorage.removeItem('auth-storage');
      }

      toast.success('ออกจากระบบสำเร็จ');

      window.location.href = '/admin/login';

    } catch (error) {
      console.error('Logout error:', error);
      toast.error('เกิดข้อผิดพลาด');

      logout();
      window.location.href = '/admin/login';
    }
  };

  const handleLogoutClick = () => {
    openModal({
      type: 'confirm',
      title: 'ยืนยันการออกจากระบบ',
      content: 'คุณต้องการออกจากระบบใช่หรือไม่?',
      onConfirm: performLogout,
    });
  };

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-40">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
        >
          <Menu className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-bold text-gray-800">
          Smart Watch Monitoring
        </h1>
      </div>

      <div className="flex items-center gap-4">
        {/* Notifications */}
        <button className="relative p-2 hover:bg-gray-100 rounded-lg">
          <Bell className="w-6 h-6 text-gray-600" />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {/* User Menu */}
        <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
          <div className="text-right">
            <p className="text-sm font-medium text-gray-800">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs text-gray-500">ผู้ดูแลระบบ</p>
          </div>
          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
            <User className="w-6 h-6 text-white" />
          </div>
          
          {/* ปุ่ม Logout เรียก handleLogoutClick */}
          <button
            onClick={handleLogoutClick}
            className="p-2 hover:bg-red-50 rounded-lg text-gray-600 hover:text-red-600 transition-colors"
            title="ออกจากระบบ"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
}