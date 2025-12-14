// app/(dashboard)/admin/monitoring/page.tsx
import { prisma } from '@/lib/db/prisma';
import MonitoringView from '@/components/features/monitoring/monitoring-view';

export const dynamic = 'force-dynamic';

export default async function MonitoringPage() {
  
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

      // 🚨 เช็ค Alert ค้าง และดึง "คนรับเคส" (reporter) มาด้วย
      fallRecords: { where: { status: 'DETECTED' }, take: 1 },
      receivedHelp: { 
          where: { status: { in: ['DETECTED', 'ACKNOWLEDGED'] } }, // เอาทั้งรอและรับแล้ว
          take: 1,
          include: { reporter: true } // ✅ ดึงข้อมูลคนรับเคส
      }
    }
  });

  const formattedUsers = dependents.map(dep => {
    const hasFall = dep.fallRecords.length > 0;
    const sosRecord = dep.receivedHelp[0]; // ดึง SOS ใบแรก
    const hasSOS = !!sosRecord;
    const isEmergency = hasFall || hasSOS;

    const latestLoc = dep.locations[0];

    // ✅ จำลองตำแหน่งผู้ช่วยเหลือ (Rescuer)
    // ในสถานการณ์จริง นายน้อยอาจต้องดึง Location ล่าสุดของ Reporter จากตาราง Location ของเขา
    // แต่อันนี้เค้าดึงข้อมูลพื้นฐานมาก่อน
    const rescuer = sosRecord?.reporter ? {
        id: sosRecord.reporter.id,
        name: `${sosRecord.reporter.firstName} ${sosRecord.reporter.lastName}`,
        // ⚠️ หมายเหตุ: ตรงนี้ต้องแก้เป็นพิกัดจริงของ จนท. (สมมติว่าอยู่ใกล้ๆ ไปก่อนเพื่อโชว์เส้น)
        lat: (latestLoc?.latitude || 13.75) + 0.005, 
        lng: (latestLoc?.longitude || 100.50) + 0.005,
    } : null;

    return {
        id: dep.user.id,
        firstName: dep.firstName,
        lastName: dep.lastName,
        lineId: dep.user.lineId,
        
        isEmergency: isEmergency,
        // ถ้า status เป็น ACKNOWLEDGED แสดงว่ามีคนรับเคสแล้ว
        status: sosRecord?.status || (hasFall ? 'DETECTED' : 'NORMAL'), 
        emergencyType: hasFall ? 'FALL' : (hasSOS ? 'SOS' : null),

        location: latestLoc ? {
            lat: latestLoc.latitude,
            lng: latestLoc.longitude,
            battery: latestLoc.battery,
            updatedAt: latestLoc.timestamp
        } : null,
        
        rescuer: rescuer, // ✅ ส่งข้อมูลผู้ช่วยเหลือไป

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
        <h1 className="text-3xl font-bold text-slate-900 ml-6 mt-4">ศูนย์บัญชาการ (War Room)</h1>
        {/* ส่งข้อมูลเข้า View */}
        <MonitoringView users={formattedUsers} />
    </div>
  );
}