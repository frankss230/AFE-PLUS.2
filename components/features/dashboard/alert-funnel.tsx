"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AlertFunnelProps {
  data: {
    detected: number;
    acknowledged: number;
    resolved: number;
  };
}

export default function AlertFunnel({ data }: AlertFunnelProps) {
  // คำนวณยอดรวมเพื่อโชว์ด้านล่าง
  const total = data.detected; 

  return (
    <div className="w-full h-full bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-4 pb-2 border-b border-slate-50 text-center">
        <h3 className="text-sm font-bold text-slate-700">
          สถานะการจัดการเหตุ
        </h3>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center space-y-3 p-4 overflow-y-auto">
        
        {/* Step 1: Detected */}
        <div className="w-full flex flex-col items-center group">
          <div className="text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">
            แจ้งเตือนเข้ามา
          </div>
          <div
            className="bg-red-50 text-red-600 py-2 px-6 rounded-xl font-black text-lg shadow-sm border border-red-100 flex items-center justify-center transition-all group-hover:scale-105 group-hover:shadow-md"
            style={{ width: "100%", maxWidth: "240px" }}
          >
            {data.detected}
          </div>
          {/* เส้นเชื่อม */}
          <div className="h-4 w-0.5 bg-slate-200 my-1"></div>
        </div>

        {/* Step 2: Acknowledged */}
        <div className="w-full flex flex-col items-center group">
          <div
            className="bg-orange-50 text-orange-600 py-2 px-6 rounded-xl font-black text-lg shadow-sm border border-orange-100 flex items-center justify-center transition-all group-hover:scale-105 group-hover:shadow-md"
            style={{ width: "85%", maxWidth: "200px" }}
          >
            {data.acknowledged}
          </div>
          <div className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">
            รับเรื่องแล้ว
          </div>
          {/* เส้นเชื่อม */}
          <div className="h-4 w-0.5 bg-slate-200 my-1"></div>
        </div>

        {/* Step 3: Resolved */}
        <div className="w-full flex flex-col items-center group">
          <div
            className="bg-emerald-50 text-emerald-600 py-2 px-6 rounded-xl font-black text-lg shadow-sm border border-emerald-100 flex items-center justify-center transition-all group-hover:scale-105 group-hover:shadow-md"
            style={{ width: "70%", maxWidth: "160px" }}
          >
            {data.resolved}
          </div>
          <div className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">
            ช่วยเหลือสำเร็จ
          </div>
        </div>

      </div>
      
      {/* Footer */}
      <div className="p-2 bg-slate-50 text-center border-t border-slate-100">
          <span className="text-[10px] text-slate-400">Total: {total} Events</span>
      </div>
    </div>
  );
}