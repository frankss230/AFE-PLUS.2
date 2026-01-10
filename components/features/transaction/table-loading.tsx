import { Activity } from 'lucide-react';

export default function TableLoading() {
  return (
    
    <div className="flex h-[calc(100vh-420px)] w-full flex-col items-center justify-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
      
      {}
      <div className="relative flex flex-col items-center scale-75">
        
        {}
        <div className="relative flex h-20 w-20 items-center justify-center">
            
            {}
            <div className="absolute inset-0 h-full w-full rounded-full bg-blue-400 opacity-20 animate-ping"></div>
            
            {}
            <div className="relative flex h-16 w-16 items-center justify-center rounded-full border border-white/50 bg-white/60 shadow-lg backdrop-blur-md">
                
                {}
                <div className="absolute inset-0 h-full w-full animate-spin rounded-full border-4 border-slate-100 border-t-blue-600"></div>
                
                {}
                <Activity className="h-6 w-6 text-blue-600" />
            </div>
        </div>

        {}
        <div className="mt-6 flex flex-col items-center gap-1 text-center">
            <h2 className="text-sm font-semibold text-slate-700">
                Loading...
            </h2>
            <p className="text-[10px] font-medium text-slate-400">
                กำลังโหลดรายการ
            </p>
        </div>

      </div>
    </div>
  );
}