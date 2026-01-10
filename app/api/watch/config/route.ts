import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

    const user = await prisma.user.findUnique({
      where: { id: Number(id) },
      include: {
        dependentProfile: {
            include: {
                safeZones: true,
                heartRateSetting: true,
                tempSetting: true
            }
        }
      }
    });

    if (!user || !user.dependentProfile) {
        return NextResponse.json({ error: 'Not found or Profile not setup' }, { status: 404 });
    }

    const profile = user.dependentProfile;

    return NextResponse.json({
      success: true,
      config: {
        isGpsActive: profile.isGpsEnabled, 
        
        safezoneRadiusLv1: profile.safeZones[0]?.radiusLv1 || 100,
        safezoneRadiusLv2: profile.safeZones[0]?.radiusLv2 || 500,
        safezoneLat: profile.safeZones[0]?.latitude || 0,
        safezoneLng: profile.safeZones[0]?.longitude || 0,

        maxBpm: profile.heartRateSetting?.maxBpm || 120,
        minBpm: profile.heartRateSetting?.minBpm || 50,
        maxTemp: profile.tempSetting?.maxTemperature || 37.5,
        
        updateInterval: 10000 
      }
    });

  } catch (error) {
    console.error('Watch Config Error:', error);
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
}