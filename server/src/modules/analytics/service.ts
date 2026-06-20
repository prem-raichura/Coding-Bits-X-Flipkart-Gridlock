import { prisma } from '../../lib/prisma.js';

async function latestRun() {
  return prisma.predictionRun.findFirst({
    where: { status: 'done' },
    orderBy: { run_at: 'desc' },
    include: { analytics: true },
  });
}

export async function getDashboard() {
  const run = await latestRun();
  if (!run?.analytics) return null;
  const dash = run.analytics.dashboard as Record<string, unknown>;
  // Override pending_approvals with live count
  const pending = await prisma.registrationRequest.count({ where: { status: 'pending' } });
  return { ...dash, pending_approvals: pending };
}

export async function getHotspots() {
  const run = await latestRun();
  return run?.analytics?.hotspots ?? [];
}

export async function getStations() {
  const run = await latestRun();
  return run?.analytics?.stations ?? [];
}

export async function getOfficers() {
  const run = await latestRun();
  return run?.analytics?.officers ?? [];
}

export async function getPendingOfficers() {
  const reqs = await prisma.registrationRequest.findMany({
    where: { status: 'pending' },
    orderBy: { created_at: 'desc' },
  });
  return reqs.map((r: typeof reqs[number]) => ({
    id: r.request_id,
    name: r.name,
    badge_id: `BTP-${r.request_id.slice(-4).toUpperCase()}`,
    requested_station: r.police_station,
    phone: r.number,
    email: r.email,
    applied_on: r.created_at.toISOString().split('T')[0],
    experience_years: 0,
    status: r.status,
  }));
}

export async function getTimeseries() {
  const run = await latestRun();
  return run?.analytics?.timeseries ?? { monthly: [], daily: [], hourly: [], daily_trend: [] };
}

export async function getFunnel() {
  const run = await latestRun();
  return run?.analytics?.funnel ?? { total: 0, reviewed: 0, approved: 0, rejected: 0, processing: 0, duplicate: 0, never_reviewed: 0 };
}

export async function getViolations() {
  const run = await latestRun();
  return run?.analytics?.violations ?? [];
}

export async function getVehicles() {
  const run = await latestRun();
  return run?.analytics?.vehicles ?? [];
}

export async function getEdi() {
  const run = await latestRun();
  return run?.analytics?.edi ?? [];
}

export async function getActivity() {
  const run = await latestRun();
  return run?.analytics?.activity ?? [];
}

export async function approveOfficer(id: string, adminId: string) {
  const { approve } = await import('../registrationRequests/service.js');
  return approve(id, adminId);
}

export async function rejectOfficer(id: string, adminId: string) {
  const { reject } = await import('../registrationRequests/service.js');
  return reject(id, adminId);
}

export async function assignOfficer(data: { user_id: string; cell_id: string; run_id: string; time_limit?: string }) {
  const { create } = await import('../assignments/service.js');
  return create(data);
}
