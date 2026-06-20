import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import bcrypt from 'bcryptjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL! });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Stable ids so a DB reset doesn't invalidate previously-issued JWTs.
const ADMIN_ID = '00000000-0000-4000-a000-000000000001';
const OFFICER_ID = '00000000-0000-4000-a000-000000000002';

async function main() {
  // Load the station master first so the demo officer can be tied to a REAL
  // station name (otherwise they never appear in the station-officer picker).
  const stationsPath = path.join(__dirname, 'stations_seed.json');
  const stations: Array<{ name: string; latitude: number; longitude: number }> = fs.existsSync(stationsPath)
    ? JSON.parse(fs.readFileSync(stationsPath, 'utf-8'))
    : [];
  const officerStation = stations[0]?.name ?? 'HQ';

  const adminHash = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: { id: ADMIN_ID, password: adminHash },
    create: {
      id: ADMIN_ID,
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
    update: { id: OFFICER_ID, password: officerHash, police_station: officerStation },
    create: {
      id: OFFICER_ID,
      name: 'Ravi Kumar',
      email: 'ravi.kumar@btp.karnataka.gov.in',
      number: '9876543210',
      police_station: officerStation,
      username: 'officer',
      password: officerHash,
      role: 'officer',
      is_active: true,
    },
  });
  console.log(`officer → id: ${officer.id} | station: ${officerStation}`);

  // Station master (centroids derived from raw CSV via serving_v6/make_stations.py)
  if (stations.length) {
    const res = await prisma.station.createMany({ data: stations, skipDuplicates: true });
    console.log(`stations → seeded ${res.count} (of ${stations.length})`);
  } else {
    console.log('stations → stations_seed.json not found; run serving_v6/make_stations.py first');
  }

  console.log('\nDone. DB has admin + officer + station master. Operational tables empty.');
}

main().catch(console.error).finally(async () => {
  await prisma.$disconnect();
  await pool.end();
});
