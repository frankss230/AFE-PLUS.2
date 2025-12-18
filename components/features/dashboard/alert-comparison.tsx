"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from "recharts";
import { Scale, ArrowRightLeft } from "lucide-react";

// ✅ Custom Tooltip แบบ Dark Theme หรูหรา
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900/95 backdrop-blur-sm text-white p-4 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] text-xs border border-slate-800">
        <p className="font-bold mb-3 text-slate-300 text-sm border-b border-slate-800 pb-2 flex items-center gap-2">
          {label}
        </p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center justify-between gap-4 mb-2 last:mb-0">
            <div className="flex items-center gap-2">
                <div
                className="w-3 h-3 rounded-md shadow-sm"
                style={{ backgroundColor: index === 0 ? "#94a3b8" : "#3b82f6" }} // ใช้สีหลักอ้างอิง
                />
                <span className="capitalize text-slate-300">{entry.name}</span>
            </div>
            <span className="font-bold text-white text-base">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function AlertComparison({ data }: any) {
  return (
    // ใช้ Container Style เดียวกับ OverviewChart เพื่อความเข้าชุด
    <div className="w-full h-full p-6 bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col relative overflow-hidden group">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-6 shrink-0">
        <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl shadow-inner text-orange-600">
                <Scale className="w-5 h-5" />
            </div>
            <div>
                <h3 className="font-bold text-slate-800 text-lg">วิเคราะห์ความสัมพันธ์</h3>
                <p className="text-xs text-slate-500 font-medium">อัตราส่วนเหตุการณ์ vs การช่วยเหลือ</p>
            </div>
        </div>
        <div className="p-2 bg-slate-50 rounded-full text-slate-400">
            <ArrowRightLeft className="w-4 h-4" />
        </div>
      </div>

      {/* Chart Area */}
      <div className="flex-1 w-full min-h-0 relative z-10">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barGap={8}>
            {/* 🔥 Defs: สร้าง Gradient ให้แท่งกราฟ */}
            <defs>
                {/* Gradient สีเทา (เหตุการณ์ทั้งหมด) */}
                <linearGradient id="totalGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#94a3b8" />
                    <stop offset="100%" stopColor="#64748b" />
                </linearGradient>
                {/* Gradient สีฟ้า (ขอความช่วยเหลือ) */}
                <linearGradient id="helpGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#60a5fa" />
                    <stop offset="100%" stopColor="#2563eb" />
                </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis 
                dataKey="name" 
                stroke="#94a3b8" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false} 
                dy={10}
                tick={{ fontWeight: 500 }}
            />
            <YAxis 
                stroke="#94a3b8" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false}
                tickFormatter={(value) => value > 0 ? value : ""} // ซ่อนเลข 0
            />
            <Tooltip 
                content={<CustomTooltip />}
                cursor={{ fill: "#f8fafc", opacity: 0.5 }}
            />
            
            {/* Bar 1: เหตุการณ์ทั้งหมด (สีเทา Gradient) */}
            <Bar 
                name="เหตุการณ์ทั้งหมด" 
                dataKey="total" 
                fill="url(#totalGradient)" 
                radius={[6, 6, 2, 2]} 
                barSize={24}
                className="drop-shadow-sm transition-all duration-300 hover:brightness-110"
            />
            
            {/* Bar 2: ขอความช่วยเหลือ (สีฟ้า Gradient) */}
            <Bar 
                name="ขอความช่วยเหลือ" 
                dataKey="help" 
                fill="url(#helpGradient)" 
                radius={[6, 6, 2, 2]} 
                barSize={24}
                className="drop-shadow-md transition-all duration-300 hover:brightness-110"
            >
                 {/* (Optional) ใส่ Cell เพื่อเล่น Effect แยกรายแท่งได้ในอนาคต */}
                {data?.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`}  />
                ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Custom Legend ด้านล่าง */}
      <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-slate-50 shrink-0 z-20">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 transition-transform hover:scale-105">
          <div className="w-2.5 h-2.5 bg-gradient-to-br from-slate-400 to-slate-600 rounded-sm shadow-sm" />
          <span className="text-xs font-bold text-slate-600">เหตุการณ์ทั้งหมด</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100 transition-transform hover:scale-105">
          <div className="w-2.5 h-2.5 bg-gradient-to-br from-blue-400 to-blue-600 rounded-sm shadow-sm" />
          <span className="text-xs font-bold text-blue-600">ขอความช่วยเหลือ</span>
        </div>
      </div>

    </div>
  );
}