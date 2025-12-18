import { prisma } from "@/lib/db/prisma";
import { getSession } from "@/lib/auth/session";
import StatsCard from "@/components/features/dashboard/stats-card";
import ChartSection from "@/components/features/dashboard/chart-section";
import AlertFunnel from "@/components/features/dashboard/alert-funnel";
import { Users, Activity, ShieldAlert } from "lucide-react";
import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  startOfDay,
  endOfDay
} from "date-fns";
import { th } from "date-fns/locale";

export const dynamic = "force-dynamic";

// --- Helper Functions ---

// ✅ เพิ่มฟังก์ชันนี้กลับมาครับ (ที่ error เพราะขาดตัวนี้)
async function getAdminProfile(session: any) {
  return session
    ? await prisma.adminProfile.findUnique({ where: { userId: session.userId } })
    : null;
}

async function getChartData() {
  const now = new Date();
  const startOfThisMonth = startOfMonth(now);
  const startOfThisWeek = startOfWeek(now, { weekStartsOn: 1 });
  const fetchStartDate = startOfThisMonth < startOfThisWeek ? startOfThisMonth : startOfThisWeek;

  const [falls, sos] = await Promise.all([
    prisma.fallRecord.findMany({ where: { timestamp: { gte: fetchStartDate } }, select: { timestamp: true } }),
    prisma.extendedHelp.findMany({ where: { requestedAt: { gte: fetchStartDate } }, select: { requestedAt: true } }),
  ]);

  const countEvents = (items: any[], start: Date, end: Date) => items.filter((i) => { const t = new Date(i.timestamp || i.requestedAt); return t >= start && t < end; }).length;

  // 1. Hourly Today
  const dayData = [];
  const startOfToday = startOfDay(now);
  for (let i = 0; i < 24; i++) {
    const start = new Date(startOfToday); start.setHours(i);
    const end = new Date(startOfToday); end.setHours(i + 1);
    if (start <= now) dayData.push({ name: format(start, "HH:mm"), falls: countEvents(falls, start, end), sos: countEvents(sos, start, end) });
  }

  // 2. Daily This Week
  const weekData = [];
  const weekInterval = eachDayOfInterval({ start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) });
  for (const d of weekInterval) weekData.push({ name: format(d, "EEE", { locale: th }), falls: countEvents(falls, startOfDay(d), endOfDay(d)), sos: countEvents(sos, startOfDay(d), endOfDay(d)) });

  // 3. Daily This Month
  const monthData = [];
  const monthInterval = eachDayOfInterval({ start: startOfMonth(now), end: endOfMonth(now) });
  for (const d of monthInterval) monthData.push({ name: format(d, "d"), falls: countEvents(falls, startOfDay(d), endOfDay(d)), sos: countEvents(sos, startOfDay(d), endOfDay(d)) });

  return { day: dayData, week: weekData, month: monthData };
}

async function getComparisonData() {
    return [
        { name: "การล้ม", total: 15, help: 12 },
        { name: "ชีพจร", total: 40, help: 5 },
        { name: "อุณหภูมิ", total: 20, help: 2 },
        { name: "ออกนอกเขต", total: 10, help: 8 },
    ];
}

// --- Main Page Component ---
export default async function DashboardPage() {
  const session = await getSession();
  
  // ✅ เรียกใช้ getAdminProfile ตรงนี้ได้แล้วครับ
  const adminProfile = await getAdminProfile(session);
  const adminName = adminProfile
    ? `${adminProfile.firstName} ${adminProfile.lastName}`
    : "Administrator";
  
  const [
    totalDependents,
    todayFallsCount,
    ackFallsCount,
    activeDevices,
    chartData,
    comparisonData
  ] = await Promise.all([
    prisma.dependentProfile.count(),
    prisma.fallRecord.count({ where: { timestamp: { gte: new Date(new Date().setHours(0,0,0,0)) } } }),
    prisma.fallRecord.count({ 
        where: { 
            timestamp: { gte: new Date(new Date().setHours(0,0,0,0)) },
            // status: { not: 'PENDING' } // เปิดใช้ถ้ามี column status
        } 
    }), 
    prisma.location.groupBy({ by: ['dependentId'], where: { timestamp: { gte: new Date(Date.now() - 60 * 60 * 1000) } } }).then(res => res.length),
    getChartData(),
    getComparisonData()
  ]);

  const funnelData = {
    detected: todayFallsCount,
    acknowledged: ackFallsCount,
    resolved: ackFallsCount > 0 ? ackFallsCount - 1 : 0
  };

  return (
    <div className="h-[calc(100vh-138px)] w-full bg-slate-50 p-3 overflow-hidden">
      <div className="grid grid-cols-12 gap-3 h-full">
        
        {/* 🟡 ส่วนซ้าย (9 ส่วน) */}
        <div className="col-span-12 lg:col-span-9 h-full">
            {/* ส่ง adminName ไปโชว์ที่หัวกราฟ */}
            <ChartSection 
                overviewData={chartData} 
                comparisonData={comparisonData} 
                adminName={adminName} 
            />
        </div>

        {/* 🟡 ส่วนขวา (3 ส่วน) */}
        <div className="col-span-12 lg:col-span-3 h-full flex flex-col gap-3">
            
            <div className="h-[90px] shrink-0">
                <StatsCard
                    title="อุปกรณ์ออนไลน์"  // ✅ ภาษาไทย
                    value={activeDevices}
                    icon={Activity}
                    color="emerald"
                    trend="up"
                />
            </div>

            <div className="h-[90px] shrink-0">
                <StatsCard
                    title="ผู้ที่มีภาวะพึ่งพิง" // ✅ ภาษาไทย
                    value={totalDependents}
                    icon={Users}
                    color="blue"
                    trend="neutral"
                />
            </div>

            <div className="h-[90px] shrink-0">
                <StatsCard
                    title="แจ้งเตือนวันนี้"    // ✅ ภาษาไทย
                    value={todayFallsCount}
                    icon={ShieldAlert}
                    color="orange"
                    trend={todayFallsCount > 0 ? "down" : "neutral"}
                />
            </div>
            
            <div className="flex-1 min-h-0">
                 <AlertFunnel data={funnelData} />
            </div>
            
        </div>
      </div>
    </div>
  );
}