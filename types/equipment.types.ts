export interface Equipment {
  id: number;
  name: string;
  code: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface BorrowEquipment {
  id: number;
  borrowerId: number;
  name: string;
  address: string;
  phone: string;
  objective: string;
  borrowDate: Date;
  returnDate?: Date;
  status: number;
  createdAt: Date;
}