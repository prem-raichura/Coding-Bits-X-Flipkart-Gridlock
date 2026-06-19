import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import bcrypt from 'bcryptjs';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL! });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const hash = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      name: 'Admin',
      email: 'admin@officerapp.local',
      number: '0000000000',
      police_station: 'HQ',
      username: 'admin',
      password: hash,
      role: 'admin',
      is_active: true,
    },
  });
  console.log(`Admin seeded → id: ${admin.id} | username: admin | password: admin123`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
