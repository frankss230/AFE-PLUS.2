import { prisma } from '@/lib/db/prisma';
import { ALERT_THRESHOLDS } from '@/config/constants';

export async function saveHeartRate(data: {
  userId: number;
  caregiverId: number;
  bpm: number;
}) {
  // Get settings
  const settings = await prisma.heartrateSettings.findFirst({
    where: {
      userId: data.userId,
      caregiverId: data.caregiverId,
    },
  });

  const minBpm = settings?.minBpm || ALERT_THRESHOLDS.HEARTRATE_MIN;
  const maxBpm = settings?.maxBpm || ALERT_THRESHOLDS.HEARTRATE_MAX;

  let status = 1; // Normal

  if (data.bpm < minBpm || data.bpm > maxBpm) {
    status = 0; // Abnormal
  }

  const record = await prisma.heartrateRecord.create({
    data: {
      userId: data.userId,
      caregiverId: data.caregiverId,
      bpm: data.bpm,
      status,
      timestamp: new Date(),
    },
  });

  return { record, isAbnormal: status === 0 };
}

export async function saveTemperature(data: {
  userId: number;
  caregiverId: number;
  value: number;
}) {
  // Get settings
  const settings = await prisma.temperatureSettings.findFirst({
    where: {
      userId: data.userId,
      caregiverId: data.caregiverId,
    },
  });

  const maxTemp = settings?.maxTemperature || ALERT_THRESHOLDS.TEMPERATURE_MAX;

  let status = 0; // Normal

  if (data.value > maxTemp) {
    status = 1; // High temperature
  }

  const record = await prisma.temperatureRecord.create({
    data: {
      userId: data.userId,
      caregiverId: data.caregiverId,
      value: data.value,
      status,
    },
  });

  return { record, isAbnormal: status === 1 };
}

export async function saveFallDetection(data: {
  userId: number;
  caregiverId: number;
  latitude?: number;
  longitude?: number;
  xAxis: number;
  yAxis: number;
  zAxis: number;
}) {
  const record = await prisma.fallRecord.create({
    data: {
      userId: data.userId,
      caregiverId: data.caregiverId,
      latitude: data.latitude,
      longitude: data.longitude,
      xAxis: data.xAxis,
      yAxis: data.yAxis,
      zAxis: data.zAxis,
      status: 0, // Unconfirmed
      timestamp: new Date(),
    },
  });

  return record;
}

export async function getHealthData(caregiverId: number, startDate: Date, endDate: Date) {
  const [heartrates, temperatures, falls] = await Promise.all([
    prisma.heartrateRecord.findMany({
      where: {
        caregiverId,
        timestamp: { gte: startDate, lte: endDate },
      },
      orderBy: { timestamp: 'asc' },
    }),
    prisma.temperatureRecord.findMany({
      where: {
        caregiverId,
        recordDate: { gte: startDate, lte: endDate },
      },
      orderBy: { recordDate: 'asc' },
    }),
    prisma.fallRecord.findMany({
      where: {
        caregiverId,
        timestamp: { gte: startDate, lte: endDate },
      },
      orderBy: { timestamp: 'desc' },
    }),
  ]);

  return { heartrates, temperatures, falls };
}