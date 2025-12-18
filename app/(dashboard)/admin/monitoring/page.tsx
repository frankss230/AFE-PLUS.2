import { prisma } from '@/lib/db/prisma';
import MonitoringView from '@/components/features/monitoring/monitoring-view';

export const dynamic = 'force-dynamic';

interface MonitoringPageProps {
  // ✅ Next.js 15: searchParams เป็น Promise
  searchParams: Promise<{ focusUser?: string }>; 
}

export default async function MonitoringPage({ searchParams }: MonitoringPageProps) {
  // 1. แกะกล่อง searchParams ดูว่ามีคนส่ง focusUser มาไหม
  const { focusUser } = await searchParams; 
  
  const dependents = await prisma.dependentProfile.findMany({
    where: { 
        user: { isActive: true } 
    },
    include: {
      user: { select: { id: true, lineId: true } },
      caregiver: true,

      locations: { orderBy: { timestamp: 'desc' }, take: 1 },
      heartRateRecords: { orderBy: { timestamp: 'desc' }, take: 1 },
      temperatureRecords: { orderBy: { recordDate: 'desc' }, take: 1 },

      fallRecords: { where: { status: 'DETECTED' }, take: 1 },
      receivedHelp: { 
          where: { status: { in: ['DETECTED', 'ACKNOWLEDGED'] } }, 
          take: 1,
      }
    }
  });

  const formattedUsers = dependents.map(dep => {
    const hasFall = dep.fallRecords.length > 0;
    const sosRecord = dep.receivedHelp[0]; 
    const hasSOS = !!sosRecord;
    const isEmergency = hasFall || hasSOS;

    const latestLoc = dep.locations[0];

    let rescuer = null;
    if (hasSOS && sosRecord.status === 'ACKNOWLEDGED' && sosRecord.rescuerLat && sosRecord.rescuerLng) {
        rescuer = {
            name: sosRecord.rescuerName || 'เจ้าหน้าที่',
            phone: sosRecord.rescuerPhone || '',
            lat: sosRecord.rescuerLat,
            lng: sosRecord.rescuerLng
        };
    }

    return {
        id: dep.user.id,
        firstName: dep.firstName,
        lastName: dep.lastName,
        lineId: dep.user.lineId,
        
        isEmergency: isEmergency,
        status: sosRecord?.status || (hasFall ? 'DETECTED' : 'NORMAL'), 
        emergencyType: hasFall ? 'FALL' : (hasSOS ? 'SOS' : null),

        location: latestLoc ? {
            lat: latestLoc.latitude,
            lng: latestLoc.longitude,
            battery: latestLoc.battery,
            updatedAt: latestLoc.timestamp
        } : null,
        
        rescuer: rescuer,

        caregiver: dep.caregiver ? {
            firstName: dep.caregiver.firstName,
            lastName: dep.caregiver.lastName,
            phone: dep.caregiver.phone || '-'
        } : null,
        
        health: {
            bpm: dep.heartRateRecords[0]?.bpm || 0,
            temp: dep.temperatureRecords[0]?.value || 0
        }
    };
  });

  formattedUsers.sort((a, b) => (b.isEmergency ? 1 : 0) - (a.isEmergency ? 1 : 0));

  return (
    <div className="h-full flex flex-col space-y-3">
        <h1 className="text-3xl font-bold text-slate-900">ติดตามผู้ที่มีภาวะพึ่งพิง</h1>
        {/* ✅ ส่งค่า initialFocusId ไปให้ Client Component จัดการต่อ */}
        <MonitoringView 
            users={formattedUsers} 
            initialFocusId={focusUser ? parseInt(focusUser) : undefined} 
        />
    </div>
  );
}