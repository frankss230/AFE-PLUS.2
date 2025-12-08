import { LoginForm } from '@/components/features/auth/login-form';
import { Shield } from 'lucide-react';

// ✅ เพิ่มเพื่อไม่ให้ cache
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-yellow-50 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-blue-800 rounded-full mx-auto mb-4 flex items-center justify-center shadow-xl">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            เข้าสู่ระบบผู้ดูแล
          </h1>
          <p className="text-gray-600">
            Smart Watch Monitoring System
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <LoginForm />
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          © 2024 Smart Watch Monitoring System. All rights reserved.
        </p>
      </div>
    </div>
  );
}