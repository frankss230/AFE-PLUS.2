import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

export const dynamic = 'force-dynamic'; // ห้าม Cache เพื่อให้ได้ค่าล่าสุดเสมอ

export async function GET(req: Request) {
  try {
    // 1. รับ ID ของนาฬิกา (ซึ่งก็คือ User ID ของ Dependent เช่น 51)
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

    // 2. ดึงข้อมูลจาก User -> DependentProfile -> Settings
    const user = await prisma.user.findUnique({
      where: { id: Number(id) },
      include: {
        dependentProfile: {
            include: {
                safeZones: true,        // ตาราง SafeZone
                heartRateSetting: true, // ตาราง HeartRateSettings (One-to-One)
                tempSetting: true       // ตาราง TemperatureSettings (One-to-One)
            }
        }
      }
    });

    // ถ้าหาไม่เจอ หรือยังไม่ได้สร้าง Profile
    if (!user || !user.dependentProfile) {
        return NextResponse.json({ error: 'Not found or Profile not setup' }, { status: 404 });
    }

    const profile = user.dependentProfile;

    // 3. ส่ง Config กลับไปให้นาฬิกา
    return NextResponse.json({
      success: true,
      config: {
        // ✅ คำสั่งเปิด-ปิด GPS
        isGpsActive: profile.isGpsEnabled, 
        
        // ✅ ค่า Safezone (เอาอันแรก ถ้ามี)
        safezoneRadiusLv1: profile.safeZones[0]?.radiusLv1 || 100,
        safezoneRadiusLv2: profile.safeZones[0]?.radiusLv2 || 500,
        safezoneLat: profile.safeZones[0]?.latitude || 0,
        safezoneLng: profile.safeZones[0]?.longitude || 0,

        // ✅ ค่า Health Settings
        maxBpm: profile.heartRateSetting?.maxBpm || 120,
        minBpm: profile.heartRateSetting?.minBpm || 50,
        maxTemp: profile.tempSetting?.maxTemperature || 37.5,
        
        // ความถี่ในการส่งข้อมูล (เช่น ทุก 10 วินาที)
        updateInterval: 10000 
      }
    });

  } catch (error) {
    console.error('Watch Config Error:', error);
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
}