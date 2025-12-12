import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import { UserRole } from '@prisma/client'; // เหลือแค่ UserRole

// 👇 ใส่ URL ตรงๆ ไปเลย จะได้ชัวร์ว่าไม่อ่านค่าผิด
const connectionString = "postgresql://postgres:optHvDsHheyBYgDvbpAkhtNdnpolhZZC@crossover.proxy.rlwy.net:20206/railway"; 

console.log("🔗 Connecting to:", connectionString); // สั่งให้มันโชว์ URL ก่อนรันด้วย

// 1. สร้าง Pool
const pool = new Pool({ connectionString });
// 2. สร้าง Adapter
const adapter = new PrismaPg(pool);
// 3. ยัด Adapter เข้า PrismaClient
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('--- 🌱 Start Seeding (Admin Only) ---');

  // ===========================================================
  // 1. สร้าง Admin (ระบบ)
  // ===========================================================
  // รหัสผ่านคือ: admin123
  const adminPassword = await bcrypt.hash('admin123', 10);
  
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {}, // ถ้ามีอยู่แล้ว ไม่ต้องทำอะไร
    create: {
      username: 'admin',
      password: adminPassword,
      role: UserRole.ADMIN,
      isActive: true,
      lineId: 'admin_mock_id', // ใส่ไว้กัน error (เพราะ schema อาจบังคับ unique)
      
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
  console.log(`🔑 Password: admin123`);

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