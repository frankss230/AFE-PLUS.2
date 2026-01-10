import { prisma } from '@/lib/db/prisma';
import MonitoringView from '@/components/features/monitoring/monitoring-view';

export const dynamic = 'force-dynamic';

interface MonitoringPageProps {
  searchParams: Promise<{ focusUser?: string }>; 
}

export default async function MonitoringPage({ searchParams }: MonitoringPageProps) {
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

      fallRecords: { 
          where: { status: 'DETECTED' }, 
          orderBy: { timestamp: 'desc' }, 
          take: 1 
      },
      receivedHelp: { 
          where: { status: { in: ['DETECTED', 'ACKNOWLEDGED'] } }, 
          orderBy: { requestedAt: 'desc' }, 
          take: 1,
      }
    }
  });

  const formattedUsers = dependents.map(dep => {
    
    const sosRecord = dep.receivedHelp[0]; 
    const hasSOS = !!sosRecord;

    const isEmergency = hasSOS; 

    const latestLoc = dep.locations[0];

    const secureLocation = (hasSOS && latestLoc) ? {
        lat: latestLoc.latitude,
        lng: latestLoc.longitude,
        battery: latestLoc.battery,
        updatedAt: latestLoc.timestamp,
        status: sosRecord.status
    } : null;

    const displayStatus = hasSOS ? sosRecord.status : 'NORMAL';

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
        status: displayStatus, 
        emergencyType: hasSOS ? 'SOS' : null,

        location: secureLocation,
        
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

  formattedUsers.sort((a, b) => {
      if (a.isEmergency !== b.isEmergency) return a.isEmergency ? -1 : 1;
      return 0;
  });

  return (
    <div className="h-full flex flex-col space-y-3">
        <h1 className="text-3xl font-bold text-slate-900">ติดตามผู้ที่มีภาวะพึ่งพิง</h1>
        <MonitoringView 
            users={formattedUsers} 
            initialFocusId={focusUser ? parseInt(focusUser) : undefined} 
        />
    </div>
  );
}