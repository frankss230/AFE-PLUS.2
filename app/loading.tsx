import { Activity } from 'lucide-react';

export default function Loading() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-slate-50">
      
      <div className="absolute inset-0 -z-10 h-full w-full bg-white bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] bg-[size:6rem_4rem]">
        <div className="absolute bottom-0 left-0 right-0 top-0 bg-[radial-gradient(circle_800px_at_100%_200px,#d5c5ff,transparent)]"></div>
      </div>

      <div className="relative flex flex-col items-center">
        
        <div className="relative flex h-24 w-24 items-center justify-center">
            
            <div className="absolute inset-0 h-full w-full rounded-full bg-blue-400 opacity-20 animate-ping"></div>
            
            <div className="relative flex h-20 w-20 items-center justify-center rounded-full border border-white/50 bg-white/60 shadow-xl backdrop-blur-md">
                
                <div className="absolute inset-0 h-full w-full animate-spin rounded-full border-4 border-slate-100 border-t-blue-600"></div>
                
                <Activity className="h-8 w-8 text-blue-600" />
            </div>
        </div>

        <div className="mt-8 flex flex-col items-center gap-2 text-center">
            <h2 className="text-lg font-semibold text-slate-700 tracking-wide">
                Syncing Data...
            </h2>
            <p className="text-xs font-medium text-slate-400">
                กำลังเชื่อมต่อฐานข้อมูล
            </p>
        </div>

      </div>
      
    </div>
  );
}