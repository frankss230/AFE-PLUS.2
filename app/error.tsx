'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {

  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-slate-50 selection:bg-red-500 selection:text-white">
      
      {/* Background Pattern */}
      <div className="absolute inset-0 -z-10 h-full w-full bg-white bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] bg-[size:6rem_4rem]">
        <div className="absolute bottom-0 left-0 right-0 top-0 bg-[radial-gradient(circle_800px_at_100%_200px,#ffd6d6,transparent)]"></div>
      </div>

      {/* Main Glass Card */}
      <div className="relative w-full max-w-lg px-6"> {/* ✅ แก้ไข 1: ขยายความกว้างเป็น max-w-lg */}
        <div className="group relative overflow-hidden rounded-[2.5rem] border border-red-100/50 bg-white/60 p-10 shadow-2xl shadow-red-100/20 backdrop-blur-xl text-center">
          
          {/* Decorative Blob */}
          <div className="absolute -top-24 -left-24 h-64 w-64 rounded-full bg-red-500/10 blur-3xl animate-pulse"></div>

          {/* Icon Section */}
          <div className="relative mb-8 flex justify-center">
            <div className="relative flex h-28 w-28 items-center justify-center rounded-[2rem] bg-gradient-to-br from-red-50 to-slate-50 shadow-inner ring-1 ring-red-100">
                <div className="absolute inset-0 h-full w-full rounded-[2rem] bg-red-400 opacity-20 animate-ping"></div>
                <AlertTriangle className="h-12 w-12 text-red-500 relative z-10" strokeWidth={1.5} />
            </div>
          </div>

          {/* Text Content */}
          <h1 className="mb-3 text-4xl font-black tracking-tight text-slate-800">
            ระบบขัดข้อง
          </h1>
          <h2 className="mb-6 text-lg font-medium text-slate-600">
            Something went wrong!
          </h2>
          <p className="mb-10 text-base text-slate-500 leading-relaxed max-w-sm mx-auto">
            ขออภัย เกิดข้อผิดพลาดที่ไม่คาดคิด <br/>
            ระบบได้บันทึกข้อมูลความผิดพลาดแล้ว
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
            
            {/* ปุ่ม 1: ลองใหม่ */}
            <button
              onClick={() => reset()}
              className="group/btn relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-2xl bg-slate-900 px-8 py-4 transition-all hover:bg-blue-600 hover:scale-[1.02] hover:shadow-lg hover:shadow-blue-500/30 active:scale-95 flex-1"
            >
              <RefreshCcw className="h-5 w-5 text-white transition-transform group-hover/btn:rotate-180" />
              <span className="font-bold text-white text-lg">ลองใหม่</span>
            </button>

            <button
              onClick={() => window.location.href = '/'} 
              className="group/btn-secondary relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-2xl border-2 border-slate-200 bg-white px-8 py-4 transition-all hover:bg-slate-50 hover:border-blue-200 active:scale-95 flex-1"
            >
              <Home className="h-5 w-5 text-slate-500 group-hover/btn-secondary:text-blue-600" />
              <span className="font-bold text-slate-600 group-hover/btn-secondary:text-blue-600 text-lg">หน้าหลัก</span>
            </button>

          </div>

        </div>
      </div>

      {/* Footer Text */}
      <footer className="absolute bottom-6 text-center text-xs text-slate-400 font-medium">
        Error Code: {error.digest || 'Unknown_Error'}
      </footer>

    </main>
  )
}