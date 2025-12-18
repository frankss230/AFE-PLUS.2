"use client";

import { useState } from "react";
import {
    Bar,
    BarChart,
    Pie,
    PieChart,
    Cell,
    ResponsiveContainer,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
    Area,
    AreaChart,
} from "recharts";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Activity, CalendarDays } from "lucide-react";
import { format } from "date-fns";
import { th } from "date-fns/locale";

interface OverviewChartProps {
    data?: {
        day: { name: string; falls: number; sos: number }[];
        week: { name: string; falls: number; sos: number }[];
        month: { name: string; falls: number; sos: number }[];
    };
}

// Custom Tooltip แบบ Glassmorphism
const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-slate-900/80 backdrop-blur-md text-white p-4 rounded-2xl shadow-[0_0_20px_rgba(0,0,0,0.2)] text-xs border border-white/10">
                <p className="font-bold mb-3 text-slate-200 text-sm border-b border-white/10 pb-2">
                    {label}
                </p>
                {payload.map((entry: any, index: number) => (
                    <div key={index} className="flex items-center gap-3 mb-2 last:mb-0">
                        <div
                            className="w-3 h-3 rounded-full shadow-[0_0_10px_currentColor]"
                            style={{ backgroundColor: entry.color || entry.fill, color: entry.color || entry.fill }}
                        />
                        <span className="capitalize text-slate-300">
                            {entry.name}: <span className="font-bold text-white text-base ml-1">{entry.value}</span>
                        </span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

export default function OverviewChart({ data }: OverviewChartProps) {
    const [chartType, setChartType] = useState("line");
    const [range, setRange] = useState<"day" | "week" | "month">("week");

    const safeData = data || { day: [], week: [], month: [] };
    const currentData = safeData[range] || [];

    const totalFalls = currentData.reduce((acc, curr) => acc + curr.falls, 0);
    const totalSOS = currentData.reduce((acc, curr) => acc + curr.sos, 0);

    const pieData = [
        { name: "การล้ม (Falls)", value: totalFalls, color: "#f97316" },
        { name: "ขอความช่วยเหลือ (SOS)", value: totalSOS, color: "#ef4444" },
    ].filter((item) => item.value > 0);

    // วันที่และเดือนปัจจุบัน
    const currentMonth = format(new Date(), "MMMM yyyy", { locale: th });

    return (
        <div className="w-full h-full p-6 bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col relative overflow-hidden group">

            {/* 🔮 CSS Animation สำหรับ Scan Effect */}
            <style jsx global>{`
        @keyframes scan-wave {
          0% { left: -50%; opacity: 0; }
          50% { opacity: 0.3; }
          100% { left: 150%; opacity: 0; }
        }
        .scan-effect {
          position: absolute;
          top: 0;
          bottom: 0;
          width: 50%;
          background: linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.1), transparent);
          transform: skewX(-20deg);
          animation: scan-wave 3s infinite linear;
          pointer-events: none;
          z-index: 10;
        }
      `}</style>

            {/* --- Scan Effect Overlay --- */}
            <div className="scan-effect" />

            {/* --- Header Section --- */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 shrink-0 z-20">
                <div>
                    <h3 className="text-slate-800 font-bold text-lg flex items-center gap-2">
                        <div className="p-2 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-inner text-blue-600">
                            <Activity className="w-5 h-5" />
                        </div>
                        สถิติการแจ้งเตือน
                    </h3>
                    <div className="flex items-center gap-2 mt-1 ml-11">
                        <CalendarDays className="w-3 h-3 text-slate-400" />
                        <p className="text-slate-500 text-xs font-medium bg-slate-100 px-2 py-0.5 rounded-full">
                            {currentMonth}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {/* Controls */}
                    <div className="flex items-center bg-slate-50 border border-slate-100 rounded-full p-1 shadow-inner">
                        {(["day", "week", "month"] as const).map((r) => (
                            <button
                                key={r}
                                onClick={() => setRange(r)}
                                className={`px-4 py-1.5 text-xs font-bold rounded-full transition-all duration-300 ${range === r
                                        ? "bg-white shadow-md text-blue-600 scale-105"
                                        : "text-slate-400 hover:text-slate-600"
                                    }`}
                            >
                                {r === "day" ? "วัน" : r === "week" ? "สัปดาห์" : "เดือน"}
                            </button>
                        ))}
                    </div>

                    <Select value={chartType} onValueChange={setChartType}>
                        <SelectTrigger
                            className="w-[120px] h-9 rounded-full border-slate-200 bg-white/80 backdrop-blur shadow-sm text-xs font-bold text-slate-600 hover:border-blue-300 transition-all focus:ring-0 focus:ring-offset-0 focus:outline-none focus:border-blue-400"
                        >
                            <SelectValue placeholder="รูปแบบกราฟ" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="line">เส้น</SelectItem>
                            <SelectItem value="bar">แท่ง</SelectItem>
                            <SelectItem value="pie">วงกลม</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* --- Chart Area --- */}
            <div className="flex-1 w-full min-h-0 relative z-10">

                {/* 🔥 Defs: แหล่งรวม Effect สีและแสง */}
                <ResponsiveContainer width="100%" height="100%">
                    {/* เราต้องใช้ Wrapper Chart หลอกๆ เพื่อใส่ Defs หรือใส่ใน Chart จริงก็ได้ แต่แยกออกมาให้เห็นชัด */}
                    {chartType === "pie" ? (
                        <PieChart>
                            <defs>
                                <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                                    <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#000000" floodOpacity="0.15" />
                                </filter>
                            </defs>
                            <Pie
                                data={pieData}
                                cx="50%"
                                cy="50%"
                                innerRadius={80}
                                outerRadius={120}
                                paddingAngle={6}
                                dataKey="value"
                                stroke="none"
                                filter="url(#shadow)" // ใส่เงา
                            >
                                {pieData.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={entry.color}
                                        className="hover:opacity-80 transition-opacity cursor-pointer"
                                        stroke="rgba(255,255,255,0.2)"
                                        strokeWidth={2}
                                    />
                                ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                            {/* Center Text for Donut */}
                            <text x="50%" y="45%" textAnchor="middle" dominantBaseline="middle" className="fill-slate-400 text-xs font-medium">
                                ทั้งหมด
                            </text>
                            <text x="50%" y="55%" textAnchor="middle" dominantBaseline="middle" className="fill-slate-800 text-2xl font-black">
                                {totalFalls + totalSOS}
                            </text>
                        </PieChart>
                    ) : chartType === "bar" ? (
                        <BarChart data={currentData} barGap={8}>
                            <defs>
                                {/* Gradient สำหรับแท่งกราฟ */}
                                <linearGradient id="barOrange" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#fb923c" />
                                    <stop offset="100%" stopColor="#c2410c" />
                                </linearGradient>
                                <linearGradient id="barRed" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#f87171" />
                                    <stop offset="100%" stopColor="#b91c1c" />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                            <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f8fafc" }} />

                            <Bar
                                name="การล้ม"
                                dataKey="falls"
                                fill="url(#barOrange)" // ใช้ Gradient
                                radius={[6, 6, 2, 2]}
                                barSize={18}
                                className="drop-shadow-sm filter" // เงาเบาๆ
                            />
                            <Bar
                                name="SOS"
                                dataKey="sos"
                                fill="url(#barRed)" // ใช้ Gradient
                                radius={[6, 6, 2, 2]}
                                barSize={18}
                                className="drop-shadow-sm filter"
                            />
                        </BarChart>
                    ) : (
                        <AreaChart data={currentData}>
                            <defs>
                                {/* Gradient พื้นที่ใต้กราฟ (Fade ลงล่าง) */}
                                <linearGradient id="colorFalls" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.4} />
                                    <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorSOS" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                </linearGradient>

                                {/* Filter เรืองแสง (Neon Glow) */}
                                <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                                    <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                                    <feMerge>
                                        <feMergeNode in="coloredBlur" />
                                        <feMergeNode in="SourceGraphic" />
                                    </feMerge>
                                </filter>
                            </defs>

                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                            <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                            <Tooltip content={<CustomTooltip />} />

                            <Area
                                type="monotone"
                                dataKey="falls"
                                name="การล้ม"
                                stroke="#f97316"
                                strokeWidth={3}
                                fillOpacity={1}
                                fill="url(#colorFalls)"
                                filter="url(#glow)" // ใส่ Glow
                                activeDot={{ r: 6, strokeWidth: 0, className: "animate-pulse" }}
                            />

                            <Area
                                type="monotone"
                                dataKey="sos"
                                name="ขอความช่วยเหลือ"
                                stroke="#ef4444"
                                strokeWidth={3}
                                fillOpacity={1}
                                fill="url(#colorSOS)"
                                filter="url(#glow)" // ใส่ Glow
                                activeDot={{ r: 6, strokeWidth: 0, className: "animate-pulse" }}
                            />
                        </AreaChart>
                    )}
                </ResponsiveContainer>
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-slate-50 shrink-0 z-20">
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 border border-orange-100 transition-transform hover:scale-105">
                    <div className="w-2.5 h-2.5 bg-orange-500 rounded-full shadow-[0_0_8px_rgba(249,115,22,0.6)] animate-pulse" />
                    <span className="text-xs font-bold text-orange-700">การล้ม</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 border border-red-100 transition-transform hover:scale-105">
                    <div className="w-2.5 h-2.5 bg-red-500 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.6)] animate-pulse" />
                    <span className="text-xs font-bold text-red-700">ขอความช่วยเหลือ</span>
                </div>
            </div>
        </div>
    );
}