'use client';

import { useEffect, useState } from 'react';
import liff from '@line/liff';
import { Loader2, AlertTriangle, RefreshCcw } from 'lucide-react';
import { checkLiffUserStatus } from '@/actions/liff-auth.actions';

export default function RegisterRedirectPage() {

  const [isError, setIsError] = useState(false);

  useEffect(() => {
    const redirectUser = async () => {
      try {
        await liff.init({ liffId: process.env.NEXT_PUBLIC_LIFF_ID || '' });

        if (!liff.isLoggedIn()) {
          liff.login();
          return;
        }

        const profile = await liff.getProfile();
        const status = await checkLiffUserStatus(profile.userId);

        if (status === 'UNREGISTERED') {
          window.location.href = '/register/caregiver';
        } else {
          window.location.href = '/register/dependent';
        }

      } catch (error: any) {
        console.error(error);
        setIsError(true);
      }
    };

    redirectUser();
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-orange-50 p-6 text-center">

      {!isError ? (
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="relative">
            <div className="absolute inset-0 bg-orange-200 rounded-full blur-xl opacity-50 animate-pulse"></div>
            <div className="relative bg-white p-4 rounded-2xl shadow-xl">
              <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
            </div>
          </div>
          <h2 className="text-slate-600 font-bold text-lg animate-pulse">กำลังตรวจสอบข้อมูล...</h2>
        </div>
      ) : (
        <>
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4 shadow-inner">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-slate-700 font-bold text-xl mb-2">เกิดข้อผิดพลาด</h2>
          <p className="text-slate-500 mb-8 max-w-xs">ไม่สามารถเชื่อมต่อกับระบบได้ กรุณาลองใหม่อีกครั้ง</p>

          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 text-white px-8 py-4 rounded-2xl shadow-lg shadow-orange-500/30 active:scale-95 transition-all font-bold"
          >
            <RefreshCcw className="w-5 h-5" /> ลองใหม่อีกครั้ง
          </button>
        </>
      )}

    </div>
  );
}