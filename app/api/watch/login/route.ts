import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const uId = searchParams.get('uId');
    const uPin = searchParams.get('uPin');

    if (!uId || !uPin) {
      return NextResponse.json({ status: "false", message: "Missing credentials" }, { status: 400 });
    }

    
    const user = await prisma.user.findUnique({
      where: { id: parseInt(uId) },
      include: {
        dependentProfile: {
          include: {
            safeZones: true, 
            caregiver: true  
          }
        }
      }
    });

    
    if (!user || !user.dependentProfile) {
       
       return NextResponse.json({ status: "false", message: "User not found" });
    }

    const profile = user.dependentProfile;

    
    if (profile.pin !== uPin) {
       return NextResponse.json({ status: "false", message: "Invalid PIN" });
    }

    
    const safeZone = profile.safeZones[0];
    const lat = safeZone?.latitude ?? 0.0;
    const long = safeZone?.longitude ?? 0.0;
    const r1 = safeZone?.radiusLv1 ?? 100;
    const r2 = safeZone?.radiusLv2 ?? 500;
    const takecareId = profile.caregiverId ?? 0;

    console.log(` Watch Login Success: ID ${uId}`);

    
    return NextResponse.json({
        status: "true",
        lat: String(lat),
        long: String(long),
        r1: String(r1),
        r2: String(r2),
        takecare_id: String(takecareId)
    });

  } catch (error) {
    console.error("Watch Login Error:", error);
    return NextResponse.json({ status: "false" }, { status: 500 });
  }
}