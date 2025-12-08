import prisma from '@/lib/db/prisma';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { AlertTriangle, Clock, MapPin, User, CheckCircle2, Siren, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import { AlertsAutoRefresh } from '@/components/features/alerts/alerts-auto-refresh'; // ✅ Import ตัวช่วยรีเฟรช

export const dynamic = 'force-dynamic';

async function getAlerts() {
  const falls = await prisma.fallRecord.findMany({
    orderBy: { timestamp: 'desc' },
    include: { 
      dependent: { 
        include: { 
            caregiver: true,
            user: { select: { id: true } } 
        } 
      } 
    },
    take: 50,
  });

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

  const combined = [
    ...falls.map(f => ({
      id: `fall-${f.id}`,
      type: 'FALL',
      victimName: f.dependent ? `${f.dependent.firstName} ${f.dependent.lastName}` : 'ไม่ระบุชื่อ',
      userId: f.dependent?.user?.id,
      time: f.timestamp,
      lat: f.latitude || 0,
      lng: f.longitude || 0,
      isActive: f.status === 'DETECTED'
    })),
    ...soss.map(s => ({
      id: `sos-${s.id}`,
      type: 'SOS',
      victimName: s.dependent ? `${s.dependent.firstName} ${s.dependent.lastName}` : 'ไม่ระบุชื่อ',
      userId: s.dependent?.user?.id,
      time: s.requestedAt,
      lat: s.latitude || 0,
      lng: s.longitude || 0,
      isActive: s.status === 'DETECTED'
    }))
  ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

  return combined;
}

export default async function AlertsPage() {
  const alerts = await getAlerts();

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col gap-6">
      
      {/* ✅ ใส่ตัวช่วยรีเฟรชไว้ตรงนี้ (ทำงานเงียบๆ) */}
      <AlertsAutoRefresh />

      {/* Header */}
      <div className="flex shrink-0 items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">ศูนย์แจ้งเตือนเหตุ</h1>
          <p className="text-slate-500">รวมรายการ SOS และการล้ม (Real-time)</p>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500 text-white shadow-lg shadow-red-500/30">
          <Siren className="h-6 w-6 animate-pulse" />
        </div>
      </div>

      {/* Card Container */}
      <Card className="flex flex-1 flex-col overflow-hidden border-slate-200/60 shadow-sm">
        
        <CardHeader className="shrink-0 border-b border-slate-100 bg-slate-50/50 py-4">
          <CardTitle className="flex items-center gap-2 text-sm font-bold text-slate-600 uppercase tracking-wider">
            <Clock className="h-4 w-4" />
            รายการแจ้งเตือนล่าสุด ({alerts.length})
          </CardTitle>
        </CardHeader>

        {/* Scroll Area */}
        <CardContent className="flex-1 overflow-y-auto p-0 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
          
          {alerts.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-slate-400">
               <CheckCircle2 className="mb-2 h-10 w-10 text-slate-200" />
               <p>เหตุการณ์ปกติ</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {alerts.map((alert) => {
                const isDanger = alert.isActive;
                
                // ✅ FIX: สร้าง Link เสมอถ้ามี userId (แม้พิกัดจะเป็น 0 ก็ตาม)
                // ถ้าไม่มีพิกัด หน้า Monitoring จะจัดการเอง (เช่น ไม่โชว์แมพ หรือโชว์พิกัดล่าสุดแทน)
                const linkUrl = alert.userId 
                    ? `/admin/monitoring?focusUser=${alert.userId}&lat=${alert.lat}&lng=${alert.lng}`
                    : '#';

                return (
                  <Link 
                    href={linkUrl}
                    key={alert.id} 
                    className={`group flex flex-col gap-4 p-4 transition-all hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between border-l-4 cursor-pointer ${
                        isDanger ? 'border-l-red-500 bg-red-50/10' : 'border-l-green-500 bg-white'
                    }`}
                  >
                    
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div className={`mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                          isDanger ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {alert.type === 'SOS' 
                            ? <Siren className="h-5 w-5" /> 
                            : (isDanger ? <AlertTriangle className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />)
                        }
                      </div>

                      <div>
                        <h3 className={`font-bold text-base flex items-center gap-2 ${isDanger ? 'text-red-700' : 'text-slate-700'}`}>
                          {alert.type === 'SOS' 
                            ? (isDanger ? 'SOS: ขอความช่วยเหลือ!' : 'SOS: จบงานแล้ว') 
                            : (isDanger ? 'ตรวจพบการล้ม! (Fall)' : 'การล้ม: ปลอดภัยแล้ว')
                          }
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
                        {/* Status Label */}
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            isDanger 
                            ? 'bg-red-100 text-red-700' 
                            : 'bg-slate-100 text-slate-500'
                        }`}>
                            {isDanger ? 'Active' : 'Resolved'}
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