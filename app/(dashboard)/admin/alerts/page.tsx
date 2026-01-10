import prisma from '@/lib/db/prisma';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Clock, User, CheckCircle2, Siren, ChevronRight, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import { AlertsAutoRefresh } from '@/components/features/alerts/alerts-auto-refresh';

export const dynamic = 'force-dynamic';

async function getAlerts() {
  const soss = await prisma.extendedHelp.findMany({
    orderBy: { requestedAt: 'desc' },
    include: { 
      dependent: { 
        include: { 
            caregiver: true,
            user: { select: { id: true } }
        }
      },
      reporter: true
    },
    take: 50,
  });

  const combined = soss.map(s => {
      const thaiTime = new Date(new Date(s.requestedAt).getTime() + (7 * 60 * 60 * 1000));

      return {
          id: `sos-${s.id}`,
          type: 'SOS',
          status: s.status,
          victimName: s.dependent ? `${s.dependent.firstName} ${s.dependent.lastName}` : 'ไม่ระบุชื่อ',
          userId: s.dependent?.user?.id,
          time: thaiTime,
          lat: s.latitude || 0,
          lng: s.longitude || 0,
      };
  }).sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

  return combined;
}

export default async function AlertsPage() {
  const alerts = await getAlerts();

  return (
    <div className="flex h-[calc(100vh-8.7rem)] flex-col gap-6">
      
      <AlertsAutoRefresh />

      <div className="flex shrink-0 items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">ศูนย์แจ้งเตือนเหตุ</h1>
          <p className="text-slate-500">รายการขอความช่วยเหลือฉุกเฉิน</p>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500 text-white shadow-lg shadow-red-500/30">
          <Siren className="h-6 w-6 animate-pulse" />
        </div>
      </div>

      <Card className="flex flex-1 flex-col overflow-hidden border-slate-200/60 shadow-sm">
        
        <CardHeader className="shrink-0 border-b border-slate-100 bg-slate-50/50 py-4">
          <CardTitle className="flex items-center gap-2 text-sm font-bold text-slate-600 uppercase tracking-wider">
            <Clock className="h-4 w-4" />
            รายการแจ้งเตือนล่าสุด ({alerts.length})
          </CardTitle>
        </CardHeader>

        <CardContent className="flex-1 overflow-y-auto p-0 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
          
          {alerts.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-slate-400">
               <CheckCircle2 className="mb-2 h-10 w-10 text-slate-200" />
               <p>ไม่มีรายการแจ้งเตือน SOS</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {alerts.map((alert) => {
                
                let statusConfig = {
                    color: 'text-slate-500',
                    bg: 'bg-white',
                    border: 'border-l-slate-300',
                    iconBg: 'bg-slate-100',
                    label: 'จบงานแล้ว',
                    active: false
                };

                if (alert.status === 'DETECTED') {
                    statusConfig = {
                        color: 'text-red-700',
                        bg: 'bg-red-50/30',
                        border: 'border-l-red-500',
                        iconBg: 'bg-red-100 text-red-600',
                        label: 'แจ้งเตือนใหม่ (รอรับเรื่อง)',
                        active: true
                    };
                }
                else if (alert.status === 'ACKNOWLEDGED') {
                    statusConfig = {
                        color: 'text-amber-700',
                        bg: 'bg-amber-50/30',
                        border: 'border-l-amber-500',
                        iconBg: 'bg-amber-100 text-amber-600',
                        label: 'จนท. รับเรื่องแล้ว',
                        active: true
                    };
                }
                else {
                    statusConfig = {
                        color: 'text-slate-500',
                        bg: 'bg-white hover:bg-slate-50',
                        border: 'border-l-green-500',
                        iconBg: 'bg-green-100 text-green-600',
                        label: 'ปิดเคสเรียบร้อย',
                        active: false
                    };
                }

                const linkUrl = alert.userId 
                    ? `/admin/monitoring?focusUser=${alert.userId}&lat=${alert.lat}&lng=${alert.lng}`
                    : '#';

                return (
                  <Link 
                    href={linkUrl}
                    key={alert.id} 
                    className={`group flex flex-col gap-4 p-4 transition-all sm:flex-row sm:items-center sm:justify-between border-l-4 cursor-pointer ${statusConfig.border} ${statusConfig.bg}`}
                  >
                    
                    <div className="flex items-start gap-4">
                      <div className={`mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${statusConfig.iconBg}`}>
                        <Siren className={`h-5 w-5 ${alert.status === 'DETECTED' ? 'animate-pulse' : ''}`} /> 
                      </div>

                      <div>
                        <h3 className={`font-bold text-base flex items-center gap-2 ${statusConfig.color}`}>
                          SOS: ขอความช่วยเหลือ!
                          <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400" />
                        </h3>
                        
                        <div className="mt-1 flex flex-wrap gap-3 text-sm text-slate-500">
                          <div className="flex items-center gap-1 font-medium text-slate-600">
                            <User className="h-3.5 w-3.5" />
                            <span>คุณ {alert.victimName}</span>
                          </div>
                          <div className="flex items-center gap-1 text-slate-400">
                            <Clock className="h-3.5 w-3.5" />
                            <span>{format(new Date(alert.time), "d MMM HH:mm", { locale: th })} น.</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium border ${
                            alert.status === 'DETECTED' ? 'bg-red-100 text-red-700 border-red-200' :
                            alert.status === 'ACKNOWLEDGED' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                            'bg-slate-100 text-slate-500 border-slate-200'
                        }`}>
                            {alert.status === 'DETECTED' && <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span></span>}
                            {alert.status === 'ACKNOWLEDGED' && <Loader2 className="h-3 w-3 animate-spin" />}
                            {alert.status === 'RESOLVED' && <CheckCircle2 className="h-3 w-3" />}
                            
                            {statusConfig.label}
                        </span>
                    </div>

                  </Link>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}