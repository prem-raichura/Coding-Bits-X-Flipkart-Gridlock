import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import bcrypt from 'bcryptjs';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL! });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const adminHash = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: { password: adminHash },
    create: {
      name: 'Admin',
      email: 'admin@officerapp.local',
      number: '0000000000',
      police_station: 'HQ',
      username: 'admin',
      password: adminHash,
      role: 'admin',
      is_active: true,
    },
  });
  console.log(`admin → id: ${admin.id}`);

  const officerHash = await bcrypt.hash('officer123', 12);
  const officer = await prisma.user.upsert({
    where: { username: 'officer' },
    update: { password: officerHash },
    create: {
      name: 'Ravi Kumar',
      email: 'ravi.kumar@btp.karnataka.gov.in',
      number: '9876543210',
      police_station: 'Koramangala PS',
      username: 'officer',
      password: officerHash,
      role: 'officer',
      is_active: true,
    },
  });
  console.log(`officer → id: ${officer.id}`);

  console.log('\nDone. DB has only admin + officer. All other tables empty.');
}

main().catch(console.error).finally(async () => {
  await prisma.$disconnect();
  await pool.end();
});
