import { prisma } from '@/lib/db/prisma';
import { Gender, MaritalStatus } from '@prisma/client';

export async function createCaregiver(userId: number, data: {
  firstName: string;
  lastName: string;
  birthday: Date;
  gender: Gender;
  marital: MaritalStatus;
  phone: string;
  houseNumber: string;
  village: string;
  subDistrict: string;
  district: string;
  province: string;
  postalCode: string;
  diseases?: string;
  medications?: string;
}) {
  const caregiver = await prisma.caregiverProfile.create({
    data: {
      userId,
      firstName: data.firstName,
      lastName: data.lastName,
      birthday: data.birthday,
      gender: data.gender,
      marital: data.marital,
      phone: data.phone,
      houseNumber: data.houseNumber,
      village: data.village,
      subDistrict: data.subDistrict,
      district: data.district,
      province: data.province,
      postalCode: data.postalCode,
      // Note: diseases and medications are in DependentProfile, not CaregiverProfile in the verified schema.
      // If these are needed, the schema might need update or they belong elsewhere.
      // For now omitting them as they create type errors if not in schema.
    },
  });

  return caregiver;
}

export async function getCaregiverById(id: number) {
  const caregiver = await prisma.caregiverProfile.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          lineId: true,
          role: true,
          isActive: true
        },
      },
    },
  });

  return caregiver;
}

export async function getCaregiversByUserId(userId: number) {
  const profile = await prisma.caregiverProfile.findUnique({
    where: {
      userId,
    }
  });

  return profile;
}

export async function updateCaregiver(id: number, data: Partial<{
  firstName: string;
  lastName: string;
  birthday: Date;
  phone: string;
  gender: Gender;
  marital: MaritalStatus;
}>) {
  const caregiver = await prisma.caregiverProfile.update({
    where: { id },
    data,
  });

  return caregiver;
}

// Removing deleteCaregiver as it was trying to set isActive on profile which doesn't exist.
// User deletion handles profile deletion via Cascade.