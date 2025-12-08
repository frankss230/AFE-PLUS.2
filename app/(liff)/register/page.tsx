'use client';

import { useEffect, useState } from 'react';
import liff from '@line/liff';
import { Loader2, AlertTriangle, RefreshCcw } from 'lucide-react';
import { checkLiffUserStatus } from '@/actions/liff-auth.actions';

export default function RegisterRedirectPage() {
  // เก็บ Log เพื่อแสดงบนหน้าจอมือถือ
  const [debugLog, setDebugLog] = useState<string>('กำลังเริ่มต้น...');
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    const redirectUser = async () => {
      try {
        setDebugLog('1. Init LIFF...');
        await liff.init({ liffId: process.env.NEXT_PUBLIC_LIFF_ID || '' });
        
        setDebugLog('2. Checking Login...');
        if (!liff.isLoggedIn()) {
          setDebugLog('2.1 Need Login...');
          liff.login();
          return;
        }

        setDebugLog('3. Get Profile...');
        const profile = await liff.getProfile();
        
        setDebugLog(`4. Checking DB for: ${profile.userId.substring(0, 5)}...`);
        // ⚠️ จุดที่น่าจะพังคือบรรทัดนี้ (Server Action)
        const status = await checkLiffUserStatus(profile.userId);
        
        setDebugLog(`5. Result: ${status}`);

        // 🚦 Logic การเด้ง
        if (status === 'UNREGISTERED') {
            window.location.href = '/register/user';
        } else {
            window.location.href = '/register/elderly';
        }

      } catch (error: any) {
        console.error(error);
        setIsError(true);
        // แสดง Error ตัวเต็มบนหน้าจอ
        setDebugLog(`❌ Error: ${error.message || JSON.stringify(error)}`);
      }
    };

    redirectUser();
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6 text-center">
      
      {!isError ? (
        <>
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
            <h2 className="text-gray-700 font-bold mb-2">กำลังตรวจสอบข้อมูล...</h2>
            {/* แสดง Log เล็กๆ ไว้ดูความคืบหน้า */}
            <p className="text-xs text-gray-400 font-mono bg-gray-100 p-2 rounded max-w-xs break-all">
                {debugLog}
            </p>
        </>
      ) : (
        <>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-red-600 font-bold text-lg mb-2">เกิดข้อผิดพลาด</h2>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-red-100 w-full mb-6">
                <p className="text-xs text-red-400 font-mono text-left break-all">
                    {debugLog}
                </p>
            </div>
            
            <button 
                onClick={() => window.location.reload()}
                className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-full shadow-lg active:scale-95 transition-all"
            >
                <RefreshCcw className="w-4 h-4" /> ลองใหม่อีกครั้ง
            </button>
        </>
      )}

    </div>
  );
}