import { prisma } from '@/lib/db/prisma';
import MonitoringView from '@/components/features/monitoring/monitoring-view';

export const dynamic = 'force-dynamic';

export default async function MonitoringPage() {
  
  const dependents = await prisma.dependentProfile.findMany({
    where: { 
        // เอาเฉพาะคนที่ User Account ยัง Active อยู่
        user: { isActive: true } 
    },
    include: {
      user: { select: { id: true, lineId: true } }, // ดึง ID หลักและ LineID
      caregiver: true, // ดึงข้อมูลผู้ดูแล

      locations: { orderBy: { timestamp: 'desc' }, take: 1 },
      heartRateRecords: { orderBy: { timestamp: 'desc' }, take: 1 },
      temperatureRecords: { orderBy: { recordDate: 'desc' }, take: 1 },

      // 🚨 เช็ค Alert ค้าง
      fallRecords: { where: { status: 'DETECTED' }, take: 1 },
      receivedHelp: { where: { status: 'DETECTED' }, take: 1 }
    }
  });

  // 2. จัดรูปแบบข้อมูลส่งให้ Client Component
  const formattedUsers = dependents.map(dep => {
    // เช็คว่ามีเหตุฉุกเฉินไหม?
    const hasFall = dep.fallRecords.length > 0;
    const hasSOS = dep.receivedHelp.length > 0;
    const isEmergency = hasFall || hasSOS;

    const latestLoc = dep.locations[0];

    return {
        id: dep.user.id,
        firstName: dep.firstName,
        lastName: dep.lastName,
        lineId: dep.user.lineId,
        
        // สถานะฉุกเฉิน
        isEmergency: isEmergency,
        emergencyType: hasFall ? 'FALL' : (hasSOS ? 'SOS' : null),

        location: latestLoc ? {
            lat: latestLoc.latitude,
            lng: latestLoc.longitude,
            battery: latestLoc.battery,
            updatedAt: latestLoc.timestamp
        } : null,
        
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

  // 3. เรียงลำดับ: เอาคนที่มี Emergency ขึ้นก่อน
  formattedUsers.sort((a, b) => (b.isEmergency ? 1 : 0) - (a.isEmergency ? 1 : 0));

  return (
    <div className="h-full space-y-3">
        <h1 className="text-3xl font-bold text-slate-900 ml-6">ติดตาม</h1>
        <MonitoringView users={formattedUsers} />
    </div>
  );
}