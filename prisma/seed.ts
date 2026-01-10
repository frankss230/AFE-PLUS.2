import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import { UserRole } from '@prisma/client'; 


const connectionString = "postgresql://postgres:optHvDsHheyBYgDvbpAkhtNdnpolhZZC@crossover.proxy.rlwy.net:20206/railway"; 

console.log(" Connecting to:", connectionString); 


const pool = new Pool({ connectionString });

const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('---  Start Seeding (Admin Only) ---');

  
  
  
  
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
  console.log(` Admin created: ${admin.username}`);
  console.log(` Password: admin123`);

  console.log('---  Seeding completed! ---');
}

main()
  .catch((e) => {
    console.error(' Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });