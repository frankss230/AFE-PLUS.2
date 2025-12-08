import { prisma } from '@/lib/db/prisma';
import { calculateDistance } from '@/lib/utils';

export async function saveLocation(data: {
  userId: number;
  caregiverId: number;
  latitude: number;
  longitude: number;
  battery: number;
}) {
  // Get safezone
  const safezone = await prisma.safezone.findFirst({
    where: {
      userId: data.userId,
      caregiverId: data.caregiverId,
    },
  });

  let distance = 0;
  let status = 1; // Inside safezone

  if (safezone) {
    distance = calculateDistance(
      data.latitude,
      data.longitude,
      safezone.latitude,
      safezone.longitude
    );

    // Check if outside safezone
    if (distance > safezone.radiusLv2) {
      status = 3; // Outside level 2
    } else if (distance > safezone.radiusLv1) {
      status = 2; // Outside level 1
    }
  }

  // Save location
  const location = await prisma.location.create({
    data: {
      userId: data.userId,
      caregiverId: data.caregiverId,
      latitude: data.latitude,
      longitude: data.longitude,
      battery: data.battery,
      distance: Math.round(distance),
      status,
      timestamp: new Date(),
    },
  });

  return { location, isOutsideSafezone: status > 1 };
}

export async function getLatestLocation(caregiverId: number) {
  const location = await prisma.location.findFirst({
    where: { caregiverId },
    orderBy: { timestamp: 'desc' },
    include: {
      caregiver: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  return location;
}

export async function getLocationHistory(
  caregiverId: number,
  startDate?: Date,
  endDate?: Date
) {
  const locations = await prisma.location.findMany({
    where: {
      caregiverId,
      timestamp: {
        gte: startDate,
        lte: endDate,
      },
    },
    orderBy: {
      timestamp: 'desc',
    },
    take: 100,
  });

  return locations;
}