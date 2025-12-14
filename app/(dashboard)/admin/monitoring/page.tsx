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

      // 🚨 เช็ค Alert ค้าง
      fallRecords: { where: { status: 'DETECTED' }, take: 1 },
      receivedHelp: { 
          // ดึงเฉพาะที่ยังไม่จบ (DETECTED หรือ ACKNOWLEDGED)
          where: { status: { in: ['DETECTED', 'ACKNOWLEDGED'] } }, 
          take: 1,
      }
    }
  });

  const formattedUsers = dependents.map(dep => {
    const hasFall = dep.fallRecords.length > 0;
    const sosRecord = dep.receivedHelp[0]; // ดึง SOS ใบแรก
    const hasSOS = !!sosRecord;
    const isEmergency = hasFall || hasSOS;

    const latestLoc = dep.locations[0];

    // ✅ แก้ไข: ดึงตำแหน่งและชื่อ "ผู้ช่วยเหลือ" จาก Field จริงใน ExtendedHelp
    // ไม่ใช้ reporter แล้ว เพราะเราบันทึก rescuerName/Lat/Lng แยกต่างหาก
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
        // ถ้า status เป็น ACKNOWLEDGED แสดงว่ามีคนรับเคสแล้ว
        status: sosRecord?.status || (hasFall ? 'DETECTED' : 'NORMAL'), 
        emergencyType: hasFall ? 'FALL' : (hasSOS ? 'SOS' : null),

        location: latestLoc ? {
            lat: latestLoc.latitude,
            lng: latestLoc.longitude,
            battery: latestLoc.battery,
            updatedAt: latestLoc.timestamp
        } : null,
        
        rescuer: rescuer, // ส่งข้อมูลผู้ช่วยเหลือจริง

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

  // เรียงลำดับ: เอาคนที่มี Emergency ขึ้นก่อน
  formattedUsers.sort((a, b) => (b.isEmergency ? 1 : 0) - (a.isEmergency ? 1 : 0));

  return (
    <div className="h-full flex flex-col space-y-3">
        <h1 className="text-3xl font-bold text-slate-900">ติดตามผู้ที่มีภาวะพึ่งพิง</h1>
        <MonitoringView users={formattedUsers} />
    </div>
  );
}