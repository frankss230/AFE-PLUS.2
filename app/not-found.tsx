import Link from "next/link";
import { MoveLeft, FileQuestion, WifiOff } from 'lucide-react';

export default function NotFound() {
  return (
    <main className="relative flex flex-col items-center justify-center min-h-screen overflow-hidden bg-slate-50 selection:bg-blue-500 selection:text-white">
      
      <div className="absolute inset-0 -z-10 h-full w-full bg-white bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] bg-[size:6rem_4rem]">
        <div className="absolute bottom-0 left-0 right-0 top-0 bg-[radial-gradient(circle_800px_at_100%_200px,#d5c5ff,transparent)]"></div>
      </div>

      <div className="relative w-full max-w-md px-6">
        <div className="group relative overflow-hidden rounded-[2rem] border border-white/50 bg-white/60 p-8 shadow-2xl backdrop-blur-xl text-center">
          
          <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-red-400/20 blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-blue-400/20 blur-3xl animate-pulse delay-700"></div>

          <div className="relative mb-6 flex justify-center">
            <div className="relative flex h-24 w-24 items-center justify-center rounded-3xl bg-slate-50 shadow-inner ring-1 ring-slate-200">
                <WifiOff className="h-10 w-10 text-slate-400" strokeWidth={1.5} />
                
                <div className="absolute -right-2 -top-2 flex h-10 w-10 items-center justify-center rounded-full bg-red-500 text-white shadow-lg shadow-red-500/30 animate-bounce">
                    <FileQuestion className="h-5 w-5" />
                </div>
            </div>
          </div>

          <h1 className="mb-2 text-6xl font-black tracking-tighter text-slate-800">
            404
          </h1>
          <h2 className="mb-4 text-xl font-bold text-slate-600">
            ขออภัย ไม่พบหน้าที่ท่านต้องการ
          </h2>
          <p className="mb-8 text-sm text-slate-500 leading-relaxed">
            หน้านี้อาจถูกย้าย ลบ หรือคุณอาจพิมพ์ลิงก์ผิด <br/>
            ลองตรวจสอบ URL หรือกลับไปตั้งหลักใหม่
          </p>

          {}

        </div>
      </div>

      <footer className="absolute bottom-6 text-center text-xs text-slate-400">
        Error Code: 404 Page Not Found
      </footer>

    </main>
  );
}