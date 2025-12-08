// ติดไว้เดี๋ยวมาแก้‼️
import { prisma } from '@/lib/db/prisma';
import { StatsCard } from '@/components/features/dashboard/stats-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, UserCog, AlertTriangle, Activity } from 'lucide-react';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';

export const dynamic = 'force-dynamic';

async function getDashboardStats() {
  const [totalUsers, totalDependents, recentAlertsCount, activeDevices] = await Promise.all([
    prisma.user.count({ 
        where: { 
            role: 'CAREGIVER',
            isActive: true 
        } 
    }),
    
    prisma.dependentProfile.count(),
    
    prisma.fallRecord.count({
      where: {
        timestamp: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      },
    }),

    prisma.location.groupBy({
      by: ['dependentId'],
      where: {
        timestamp: {
          gte: new Date(Date.now() - 60 * 60 * 1000),
        },
      },
    }).then((result) => result.length),
  ]);

  return { totalUsers, totalDependents, recentAlertsCount, activeDevices };
}

async function getRecentAlerts() {
  const fallRecords = await prisma.fallRecord.findMany({
    take: 5,
    orderBy: { timestamp: 'desc' },
    include: {
      dependent: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  return fallRecords;
}

export default async function DashboardPage() {
  const stats = await getDashboardStats();
  const recentAlerts = await getRecentAlerts();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">ภาพรวมระบบติดตามสุขภาพ</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="ผู้ดูแลทั้งหมด"
          value={stats.totalUsers}
          icon={Users}
          change="+12%"
          trend="up"
        />
        <StatsCard
          title="ผู้สูงอายุในระบบ"
          value={stats.totalDependents}
          icon={UserCog}
          change="+5%"
          trend="up"
        />
        <StatsCard
          title="แจ้งเตือน 24 ชม."
          value={stats.recentAlertsCount}
          icon={AlertTriangle}
          change="-3%"
          trend="down"
        />
        <StatsCard
          title="อุปกรณ์ที่ออนไลน์"
          value={stats.activeDevices}
          icon={Activity}
        />
      </div>

      {/* Recent Alerts & Daily Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* การ์ดแจ้งเตือนล่าสุด */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg text-slate-800 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                แจ้งเตือนล่าสุด
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentAlerts.length > 0 ? (
                recentAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="flex items-center justify-between p-3 bg-red-50/50 border border-red-100 rounded-xl transition-all hover:bg-red-50"
                  >
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-red-100 rounded-full flex items-center justify-center text-red-600">
                            🚨
                        </div>
                        <div>
                            <p className="font-bold text-slate-800 text-sm">
                                ตรวจพบการล้ม
                            </p>
                            <p className="text-xs text-slate-500">
                                คุณ {alert.dependent?.firstName || 'ไม่ระบุ'} {alert.dependent?.lastName || ''}
                            </p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] text-slate-400">
                            {format(new Date(alert.timestamp), "d MMM HH:mm", { locale: th })} น.
                        </p>
                        <span className="inline-block px-2 py-0.5 bg-red-200 text-red-800 text-[10px] rounded-md font-bold mt-1">
                            New
                        </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <p>ไม่มีการแจ้งเตือนในขณะนี้</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* การ์ดสถิติสุขภาพวันนี้ (Mock Data ไว้ก่อน หรือจะดึงจริงก็ได้) */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg text-slate-800 flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-500" />
                สถิติสุขภาพวันนี้ (ภาพรวม)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl border border-green-100">
                <span className="text-sm font-medium text-slate-600">อัตราหัวใจเฉลี่ย</span>
                <span className="text-xl font-black text-green-600">72 <span className="text-xs font-normal text-slate-500">bpm</span></span>
              </div>
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl border border-blue-100">
                <span className="text-sm font-medium text-slate-600">อุณหภูมิเฉลี่ย</span>
                <span className="text-xl font-black text-blue-600">36.5 <span className="text-xs font-normal text-slate-500">°C</span></span>
              </div>
              <div className="flex items-center justify-between p-4 bg-purple-50 rounded-xl border border-purple-100">
                <span className="text-sm font-medium text-slate-600">ระยะเคลื่อนที่เฉลี่ย</span>
                <span className="text-xl font-black text-purple-600">2.3 <span className="text-xs font-normal text-slate-500">km</span></span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}