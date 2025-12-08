import { prisma } from '@/lib/db/prisma';

export async function createCaregiver(userId: number, data: {
  firstName: string;
  lastName: string;
  birthday: Date;
  genderId: number;
  maritalStatusId: number;
  phone?: string;
  houseNumber?: string;
  village?: string;
  subDistrict?: string;
  district?: string;
  province?: string;
  postalCode?: string;
  diseases?: string;
  medications?: string;
}) {
  const caregiver = await prisma.caregiver.create({
    data: {
      userId,
      ...data,
      isActive: true,
    },
  });

  return caregiver;
}

export async function getCaregiverById(id: number) {
  const caregiver = await prisma.caregiver.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          phone: true,
          lineId: true,
        },
      },
      gender: true,
      maritalStatus: true,
    },
  });

  return caregiver;
}

export async function getCaregiversByUserId(userId: number) {
  const caregivers = await prisma.caregiver.findMany({
    where: {
      userId,
      isActive: true,
    },
    include: {
      gender: true,
      maritalStatus: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return caregivers;
}

export async function updateCaregiver(id: number, data: Partial<{
  firstName: string;
  lastName: string;
  birthday: Date;
  phone?: string;
  diseases?: string;
  medications?: string;
}>) {
  const caregiver = await prisma.caregiver.update({
    where: { id },
    data,
  });

  return caregiver;
}

export async function deleteCaregiver(id: number) {
  const caregiver = await prisma.caregiver.update({
    where: { id },
    data: { isActive: false },
  });

  return caregiver;
}