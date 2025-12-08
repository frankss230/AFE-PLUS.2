'use client';

import { useState, useEffect } from 'react';
import Link from "next/link";
import { useRouter } from 'next/navigation';
import liff from '@line/liff';
import { siteConfig } from '@/config/site';
import { ShieldCheck, ArrowRight, Watch, Loader2 } from 'lucide-react';
import { checkLiffUserStatus } from '@/actions/liff-auth.actions';

export default function Home() {
  const router = useRouter();
  const [isCheckingLiff, setIsCheckingLiff] = useState(true); // สถานะกำลังเช็คว่าเป็น LIFF ไหม

  useEffect(() => {
    const checkDispatcher = async () => {
      try {
        // 1. Init LIFF
        await liff.init({ liffId: process.env.NEXT_PUBLIC_LIFF_ID || '' });

        // 2. 🚦 เช็คว่าเปิดในแอป LINE ไหม? (liff.isInClient)
        if (liff.isInClient()) {
            
            // ถ้าอยู่ใน LINE ต้อง Login เสมอ
            if (!liff.isLoggedIn()) {
                liff.login();
                return;
            }

            // เช็คสถานะเพื่อดีดไปหน้าอื่น
            const profile = await liff.getProfile();
            const status = await checkLiffUserStatus(profile.userId);

            if (status === 'UNREGISTERED') {
                router.replace('/register/user');
            } else if (status === 'NO_ELDERLY') {
                router.replace('/register/elderly');
            } else {
                router.replace('/safety-settings');
            }
            // (ยังคงสถานะ loading ต่อไป เพราะกำลังจะย้ายหน้า)
            return; 
        } 
        
        // 3. 💻 ถ้าเปิดใน Browser ปกติ (Chrome/Safari) -> ให้หยุดโหลดแล้วโชว์หน้า Landing Page
        setIsCheckingLiff(false);

      } catch (error) {
        console.error("LIFF/Dispatch Error:", error);
        // ถ้า Error ก็ให้โชว์หน้า Landing Page ไปเลย
        setIsCheckingLiff(false);
      }
    };

    checkDispatcher();
  }, [router]);

  // --- ⏳ Loading View (แสดงตอนกำลังเช็คว่าเป็น LIFF ไหม) ---
  if (isCheckingLiff) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
        <p className="text-slate-500 text-sm font-medium">กำลังตรวจสอบการเชื่อมต่อ...</p>
      </div>
    );
  }

  // --- 🏠 Landing Page View (แสดงเฉพาะตอนเปิดใน Browser) ---
  return (
    <main className="relative flex flex-col items-center justify-center min-h-screen overflow-hidden bg-slate-50 selection:bg-blue-500 selection:text-white">
      
      {/* 1. Background Pattern */}
      <div className="absolute inset-0 -z-10 h-full w-full bg-white bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] bg-[size:6rem_4rem]">
        <div className="absolute bottom-0 left-0 right-0 top-0 bg-[radial-gradient(circle_800px_at_100%_200px,#d5c5ff,transparent)]"></div>
      </div>

      {/* 2. Main Card */}
      <div className="relative w-full max-w-lg px-6">
        <div className="group relative overflow-hidden rounded-[2.5rem] border border-white/50 bg-white/60 p-10 shadow-2xl backdrop-blur-xl transition-all hover:shadow-blue-200/50">
          
          {/* Decorative Blob */}
          <div className="absolute -top-24 -left-24 h-64 w-64 rounded-full bg-blue-400/20 blur-3xl group-hover:bg-blue-500/20 transition-colors duration-500"></div>
          
          <div className="relative flex flex-col items-center text-center">
            
            {/* 3. Hero Icon */}
            <div className="mb-8 flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-lg shadow-blue-500/30 ring-4 ring-white">
              <Watch className="h-12 w-12 text-white" strokeWidth={1.5} />
            </div>

            {/* 4. Text Content */}
            <h1 className="mb-4 text-4xl font-black tracking-tight text-slate-800 sm:text-5xl">
              {siteConfig.name}
            </h1>
            
            <p className="mb-10 text-lg font-medium text-slate-500 leading-relaxed max-w-sm">
              {siteConfig.description}
              <br />
              <span className="text-sm text-slate-400 font-normal mt-2 block">
                ระบบติดตามและดูแลผู้สูงอายุอัจฉริยะ
              </span>
            </p>

            {/* 5. The Button (พระเอกของเรา) */}
            <Link
              href="/admin/login"
              className="group/btn relative w-full overflow-hidden rounded-2xl bg-slate-900 p-4 transition-all hover:bg-blue-600 hover:scale-[1.02] hover:shadow-xl hover:shadow-blue-500/30 active:scale-95"
            >
              <div className="relative flex items-center justify-center gap-3">
                <span className="text-lg font-bold text-white tracking-wide">
                  เข้าสู่ระบบผู้ดูแล
                </span>
                <div className="rounded-full bg-white/20 p-1 transition-all group-hover/btn:translate-x-1 group-hover/btn:bg-white text-white group-hover/btn:text-blue-600">
                  <ArrowRight className="h-5 w-5" />
                </div>
              </div>
            </Link>

            {/* Footer Text */}
            <div className="mt-8 flex items-center gap-2 text-xs font-medium text-slate-400">
              <ShieldCheck className="h-4 w-4" />
              <span>Secure Monitoring System</span>
            </div>

          </div>
        </div>
      </div>
      
      {/* Footer Credit */}
      <footer className="absolute bottom-6 text-center text-xs text-slate-400">
        © 2024 {siteConfig.name}. All rights reserved.
      </footer>

    </main>
  );
}