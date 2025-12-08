export interface Caregiver {
  id: number;
  userId: number;
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
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CaregiverFormData {
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
}