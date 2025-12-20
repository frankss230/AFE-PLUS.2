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

async function getAdminProfile(session: any) {
  return session
    ? await prisma.adminProfile.findUnique({ where: { userId: session.userId } })
    : null;
}

// 🧠 ฟังก์ชันช่วยนับเหตุการณ์
// (แก้ไข: นับทั้งหมด ไม่ต้องกรอง 20 นาที)
const countDistinctEvents = (records: any[]) => {
    if (!records || records.length === 0) return 0;
    return records.length;
    // เผื่ออยากกรอง 20 นาทีในอนาคต
    // 1. เรียงข้อมูลตามเวลา
    // const sorted = [...records].sort((a, b) => {
    //     const timeA = new Date(a.timestamp || a.requestedAt).getTime();
    //     const timeB = new Date(b.timestamp || b.requestedAt).getTime();
    //     return timeA - timeB;
    // });

    // let eventCount = 1;
    // let lastTime = new Date(sorted[0].timestamp || sorted[0].requestedAt).getTime();

    // for (let i = 1; i < sorted.length; i++) {
    //     const currentTime = new Date(sorted[i].timestamp || sorted[i].requestedAt).getTime();
    //     const diffMinutes = (currentTime - lastTime) / (1000 * 60);

    //     // 2. ถ้าห่างกันเกิน 20 นาที -> นับเป็นเหตุการณ์ใหม่
    //     if (diffMinutes > 20) {
    //         eventCount++;
    //         lastTime = currentTime;
    //     }
    // }
    // return eventCount;
};

// --- Data Fetching ---

// 🔥 1. ดึงข้อมูลกราฟเส้น/พื้นที่ (Timeline)
async function getChartData() {
  const now = new Date();
  const startOfThisMonth = startOfMonth(now);
  const startOfThisWeek = startOfWeek(now, { weekStartsOn: 1 });
  const fetchStartDate = startOfThisMonth < startOfThisWeek ? startOfThisMonth : startOfThisWeek;

  const [falls, heartRaw, tempRaw, zoneRaw] = await Promise.all([
    prisma.fallRecord.findMany({ 
        where: { timestamp: { gte: fetchStartDate } }, 
        select: { timestamp: true } 
    }),
    prisma.heartRateRecord.findMany({ 
        where: { timestamp: { gte: fetchStartDate }, status: 'ABNORMAL' }, 
        select: { timestamp: true },
        orderBy: { timestamp: 'asc' }
    }),
    prisma.temperatureRecord.findMany({ 
        where: { timestamp: { gte: fetchStartDate }, status: 'ABNORMAL' }, 
        select: { timestamp: true },
        orderBy: { timestamp: 'asc' }
    }),
    prisma.location.findMany({ 
        where: { timestamp: { gte: fetchStartDate }, status: 'DANGER' }, 
        select: { timestamp: true },
        orderBy: { timestamp: 'asc' }
    }),
  ]);

  // ใช้ Logic Grouping ในการนับจำนวนกราฟด้วย
  // (เพื่อให้กราฟเส้นไม่โดดสูงเกินจริง)
  const groupAndCount = (items: any[], start: Date, end: Date) => {
      const filtered = items.filter((i) => {
        //   const t = new Date(i.timestamp || i.requestedAt);
          const t = new Date(i.timestamp);
          return t >= start && t < end;
      });
      return countDistinctEvents(filtered);
  };

  // 1. Hourly Today
  const dayData = [];
  const startOfToday = startOfDay(now);
  for (let i = 0; i < 24; i++) {
    const start = new Date(startOfToday); start.setHours(i);
    const end = new Date(startOfToday); end.setHours(i + 1);
    if (start <= now) {
        dayData.push({ 
            name: format(start, "HH:mm"), 
            falls: groupAndCount(falls, start, end), 
            heart: groupAndCount(heartRaw, start, end),
            temp: groupAndCount(tempRaw, start, end),
            zone: groupAndCount(zoneRaw, start, end)
        });
    }
  }

  // 2. Daily This Week
  const weekData = [];
  const weekInterval = eachDayOfInterval({ start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) });
  for (const d of weekInterval) {
    const start = startOfDay(d);
    const end = endOfDay(d);
    weekData.push({ 
        name: format(d, "EEE", { locale: th }), 
        falls: groupAndCount(falls, start, end), 
        heart: groupAndCount(heartRaw, start, end),
        temp: groupAndCount(tempRaw, start, end),
        zone: groupAndCount(zoneRaw, start, end)
    });
  }

  // 3. Daily This Month
  const monthData = [];
  const monthInterval = eachDayOfInterval({ start: startOfMonth(now), end: endOfMonth(now) });
  for (const d of monthInterval) {
    const start = startOfDay(d);
    const end = endOfDay(d);
    monthData.push({ 
        name: format(d, "d"), 
        falls: groupAndCount(falls, start, end), 
        heart: groupAndCount(heartRaw, start, end),
        temp: groupAndCount(tempRaw, start, end),
        zone: groupAndCount(zoneRaw, start, end)
    });
  }

  return { day: dayData, week: weekData, month: monthData };
}

// 🔥 2. ฟังก์ชันดึงข้อมูลกราฟเปรียบเทียบ (Total vs Critical)
// ✅ แก้ไข: ใส่ตัวกรองวันที่ + นับแบบ Event Grouping
async function getComparisonData() {
    // กำหนดช่วงเวลา (เอาเฉพาะข้อมูลปัจจุบัน ไม่เอา All Time)
    const now = new Date();
    const startOfThisMonth = startOfMonth(now);
    const startOfThisWeek = startOfWeek(now, { weekStartsOn: 1 });
    // ใช้ตัวแปรเดียวกับ Chart เพื่อความสอดคล้อง
    const fetchStartDate = startOfThisMonth < startOfThisWeek ? startOfThisMonth : startOfThisWeek;

    const [
        fallTotal, 
        fallHelp, 
        heartTotal, 
        heartHelp,
        tempTotal, 
        tempHelp,
        zoneTotal, 
        zoneHelp
    ] = await Promise.all([
        // FallTotal
        prisma.fallRecord.findMany({ 
            where: { timestamp: { gte: fetchStartDate } }, // ✅ กรองวันที่
            select: { timestamp: true } 
        }),
        // FallHelp
        prisma.extendedHelp.findMany({ 
            where: { 
                requestedAt: { gte: fetchStartDate }, 
                type: { in: ['FALL_CONSCIOUS', 'FALL_UNCONSCIOUS'] } 
            }, // ✅ กรองวันที่
            select: { requestedAt: true } 
        }),
        // HeartTotal
        prisma.heartRateRecord.findMany({ 
            where: { timestamp: { gte: fetchStartDate }, status: 'ABNORMAL'  }, // ✅ กรองวันที่
            select: { timestamp: true } 
        }),
        prisma.extendedHelp.findMany({ 
            where: { requestedAt: { gte: fetchStartDate }, type: 'HEART_RATE' }, 
            select: { requestedAt: true } 
        }),
        
        // TempTotal
        prisma.temperatureRecord.findMany({ 
            where: { timestamp: { gte: fetchStartDate }, status: 'ABNORMAL'  }, // ✅ กรองวันที่
            select: { timestamp: true } 
        }),
        prisma.extendedHelp.findMany({ 
            where: { requestedAt: { gte: fetchStartDate }, type: 'TEMPERATURE' }, 
            select: { requestedAt: true } 
        }),
        
        // ZoneTotal
        prisma.location.findMany({ 
            where: { timestamp: { gte: fetchStartDate }, status: 'DANGER' }, // ✅ กรองวันที่
            select: { timestamp: true } 
        }),
        prisma.extendedHelp.findMany({ 
            where: { requestedAt: { gte: fetchStartDate }, type: 'ZONE' }, 
            select: { requestedAt: true } 
        }),
    ]);

    return [
        { 
            name: "การล้ม", 
            total: fallTotal.length, 
            critical: fallHelp.length, // Fall ปกติไม่ถี่ นับตามจริงได้
            fill: "#F97316" // Neon Orange
        },
        { 
            name: "หัวใจ", 
            total: heartTotal.length, 
            critical: countDistinctEvents(heartHelp), // ✅ ใช้ Grouping ลดจำนวน
            fill: "#F500FF" // Neon Pink
        },
        { 
            name: "อุณหภูมิ", 
            total: tempTotal.length, 
            critical: countDistinctEvents(tempHelp), // ✅ ใช้ Grouping ลดจำนวน
            fill: "#FFD600" // Neon Yellow
        },
        { 
            name: "โซน", 
            total: zoneTotal.length, 
            critical: countDistinctEvents(zoneHelp), // ✅ ใช้ Grouping ลดจำนวน
            fill: "#00E5FF" // Neon Cyan
        },
    ];
}

// 🔥 แก้ฟังก์ชันนี้: ดึงเฉพาะที่ยังไม่จบ AND เกิดขึ้นภายใน 24 ชม. (กันข้อมูลเก่าหลอน)
async function getActiveAlerts() {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 ชม. ย้อนหลัง

    // 1. ดึง SOS ที่ยังไม่จบ + ไม่เก่าเกิน 1 วัน
    const sosList = await prisma.extendedHelp.findMany({
        where: { 
            status: { in: ['DETECTED', 'ACKNOWLEDGED'] }, // เอาเฉพาะที่ยังไม่ปิด
            requestedAt: { gte: yesterday }               // ✅ ต้องไม่เก่าเกิน 24 ชม.
        },
        include: { dependent: true },
        orderBy: { requestedAt: 'desc' }
    });

    // 2. ดึง Fall ที่ยังไม่จบ + ไม่เก่าเกิน 1 วัน
    const fallList = await prisma.extendedHelp.findMany({
        where: { 
            status: { in: ['DETECTED', 'ACKNOWLEDGED'] }, // เอาเฉพาะที่ยังไม่ปิด
            requestedAt: { gte: yesterday }                 // ✅ ต้องไม่เก่าเกิน 24 ชม.
        },
        include: { dependent: true },
        orderBy: { requestedAt: 'desc' }
    });

    // 3. รวมร่าง
    const alerts = [
        ...sosList.map(s => ({
            id: s.id,
            type: `SOS (${s.type})`,
            status: s.status,
            timestamp: s.requestedAt,
            dependentName: `${s.dependent.firstName} ${s.dependent.lastName}`
        })),
        ...fallList.map(f => ({
            id: f.id,
            type: 'ตรวจพบการล้ม',
            status: f.status,
            timestamp: f.requestedAt,
            dependentName: `${f.dependent.firstName} ${f.dependent.lastName}`
        }))
    ];

    // เรียงเวลาล่าสุดขึ้นก่อน
    return alerts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

// --- Main Page Component ---
export default async function DashboardPage() {
  const session = await getSession();
  
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
    comparisonData,
    activeAlerts // ✅ ได้มาเป็น List Array
  ] = await Promise.all([
    prisma.dependentProfile.count(),
    prisma.fallRecord.count({ where: { timestamp: { gte: new Date(new Date().setHours(0,0,0,0)) } } }),
    prisma.fallRecord.count({ 
        where: { 
            timestamp: { gte: new Date(new Date().setHours(0,0,0,0)) },
            status: 'ACKNOWLEDGED' 
        } 
    }), 
    // นับอุปกรณ์ที่มีการส่ง Location มาใน 1 ชม. ล่าสุด
    prisma.location.groupBy({ by: ['dependentId'], where: { timestamp: { gte: new Date(Date.now() - 60 * 60 * 1000) } } }).then(res => res.length),
    getChartData(),
    getComparisonData(),

    getActiveAlerts() // ✅ เรียกใช้ฟังก์ชันใหม่
  ]);

  const funnelData = {
    detected: todayFallsCount,
    acknowledged: ackFallsCount,
    resolved: ackFallsCount > 0 ? ackFallsCount : 0 
  };

  return (
    <div className="h-[calc(100vh-138px)] w-full bg-slate-50 p-3 overflow-hidden">
      <div className="grid grid-cols-12 gap-3 h-full">
        
        {/* 🟡 ส่วนซ้าย (9 ส่วน) - กราฟหลัก */}
        <div className="col-span-12 lg:col-span-9 h-full">
            <ChartSection 
                overviewData={chartData} 
                comparisonData={comparisonData} 
                adminName={adminName} 
            />
        </div>

        {/* 🟡 ส่วนขวา (3 ส่วน) - Stats & Funnel */}
        <div className="col-span-12 lg:col-span-3 h-full flex flex-col gap-3">
            
            <div className="h-[90px] shrink-0">
                <StatsCard
                    title="อุปกรณ์ออนไลน์"
                    value={activeDevices}
                    icon={Activity}
                    color="emerald"
                    trend="up"
                />
            </div>

            <div className="h-[90px] shrink-0">
                <StatsCard
                    title="ผู้ที่มีภาวะพึ่งพิง"
                    value={totalDependents}
                    icon={Users}
                    color="blue"
                    trend="neutral"
                />
            </div>

            <div className="h-[90px] shrink-0">
                <StatsCard
                    title="แจ้งเตือนวันนี้"
                    value={todayFallsCount}
                    icon={ShieldAlert}
                    color="orange"
                    trend={todayFallsCount > 0 ? "down" : "neutral"}
                />
            </div>
            
            <div className="flex-1 min-h-0">
                 <AlertFunnel activeAlerts={activeAlerts} />
            </div>  
            
        </div>
      </div>
    </div>
  );
}