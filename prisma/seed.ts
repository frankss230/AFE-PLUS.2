import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import { UserRole, Gender, MaritalStatus, BorrowStatus, AlertStatus, ZoneStatus, HealthStatus } from '@prisma/client';

const connectionString = `${process.env.DATABASE_URL}`;

// 1. สร้าง Pool
const pool = new Pool({ connectionString });
// 2. สร้าง Adapter
const adapter = new PrismaPg(pool);
// 3. ยัด Adapter เข้า PrismaClient
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('--- 🌱 Start Seeding (via PG Adapter) ---');

  // ===========================================================
  // 1. สร้าง Admin
  // ===========================================================
  const adminPassword = await bcrypt.hash('admin123', 10);
  
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: adminPassword,
      role: UserRole.ADMIN,
      isActive: true,
      lineId: 'admin_mock_id', 
      
      adminProfile: {
        create: {
          firstName: 'System',
          lastName: 'Admin',
          phone: '020000000',
          position: 'Super Admin'
        }
      }
    },
  });
  console.log(`✅ Admin created: ${admin.username}`);

  // ===========================================================
  // 2. สร้าง Caregiver (ผู้ดูแล)
  // ===========================================================
  const caregiverPassword = await bcrypt.hash('user123', 10);
  
  const caregiver = await prisma.user.upsert({
    where: { username: 'caregiver' },
    update: {},
    create: {
      username: 'caregiver',
      password: caregiverPassword,
      role: UserRole.CAREGIVER,
      isActive: true,
      lineId: 'U_CAREGIVER_MOCK_ID', 
      
      caregiverProfile: {
        create: {
          firstName: 'สมชาย',
          lastName: 'ใจดี',
          gender: Gender.MALE,
          marital: MaritalStatus.MARRIED,
          phone: '0812345678',
          birthday: new Date('1980-01-01'),
          houseNumber: '99/9',
          village: '1',
          subDistrict: 'ลาดพร้าว',
          district: 'ลาดพร้าว',
          province: 'กรุงเทพมหานคร',
          postalCode: '10230',
          road: 'ลาดพร้าว'
        }
      }
    },
    include: { caregiverProfile: true }
  });
  console.log(`✅ Caregiver created: ${caregiver.username}`);

  // ===========================================================
  // 3. สร้าง Dependent (ผู้สูงอายุ)
  // ===========================================================
  if (!caregiver.caregiverProfile) {
    throw new Error("❌ Caregiver profile creation failed!");
  }

  const watchPassword = await bcrypt.hash('watch123', 10);

  const dependent = await prisma.user.upsert({
    where: { username: 'watch_user_51' },
    update: {},
    create: {
      username: 'watch_user_51',
      password: watchPassword,
      role: UserRole.DEPENDENT,
      isActive: true,
      
      dependentProfile: {
        create: {
          firstName: 'คุณยาย',
          lastName: 'ศรีนวล',
          gender: Gender.FEMALE,
          pin: '1234',
          phone: '0899999999',
          
          birthday: new Date('1950-01-01'),
          houseNumber: '10',
          village: '2',
          subDistrict: 'บางเขน',
          district: 'เมือง',
          province: 'นนทบุรี',
          postalCode: '11000',
          road: 'ติวานนท์',

          // เชื่อม Caregiver
          caregiver: {
            connect: { id: caregiver.caregiverProfile.id } 
          },

          // Settings
          safeZones: {
            create: {
                radiusLv1: 100,
                radiusLv2: 500,
                latitude: 13.7563,
                longitude: 100.5018
            }
          },
          heartRateSetting: {
             create: { maxBpm: 120, minBpm: 50 }
          },
          tempSetting: {
             create: { maxTemperature: 37.5 }
          }
        }
      }
    },
  });
  console.log(`✅ Dependent created: ${dependent.username}`);

  // ===========================================================
  // 4. สร้างอุปกรณ์ (Equipment)
  // ===========================================================
  await prisma.equipment.createMany({
    data: [
        { name: 'Samsung Galaxy Watch 4', code: 'SW-001', isActive: true },
        { name: 'Apple Watch SE', code: 'SW-002', isActive: true },
        { name: 'Xiaomi Mi Band 7', code: 'SW-003', isActive: true },
    ],
    skipDuplicates: true
  });
  console.log('✅ Equipment seeded');

  console.log('--- 🎉 Seeding completed! ---');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });