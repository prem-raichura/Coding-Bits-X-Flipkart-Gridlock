import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL! });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const stations: Array<{ name: string; latitude: number; longitude: number }> = JSON.parse(
    fs.readFileSync(path.join(__dirname, 'stations_seed.json'), 'utf-8'),
  );

  // Replace the station master with the freshly derived list.
  await prisma.station.deleteMany();
  const res = await prisma.station.createMany({ data: stations, skipDuplicates: true });

  console.log(`stations seeded: ${res.count} (of ${stations.length})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
