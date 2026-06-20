import fs from 'fs';
import path from 'path';
import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../middleware/error.js';
import { callAnalytics } from '../../lib/pyClient.js';
import { cellToLatLng } from 'h3-js';
import type { RiskLevel } from '@prisma/client';

const RISK_MAP: Record<string, RiskLevel> = {
  low: 'low', Low: 'low',
  medium: 'medium', Medium: 'medium',
  high: 'high', High: 'high',
  critical: 'critical', Critical: 'critical',
};

interface PredRow {
  h3_id: string;
  severity: string;
  risk_score: number;
  pred_24h: number;
  pred_48h: number;
  dominant_violation: string;
  dominant_vehicle: string;
  congestion_score: number;
  blockage_rate: number;
  confidence: number;
  location: string;
  forecast_date_24h: string;
  forecast_date_48h: string;
}

export async function createRun(file: Express.Multer.File, userId: string) {
  return prisma.predictionRun.create({
    data: {
      csv_path: file.path,
      original_filename: file.originalname,
      uploaded_by: userId,
      model_version: 'v6',
      prediction_window: 'H24',
      h3_resolution: 9,
      status: 'pending',
    },
  });
}

export async function process(runId: string): Promise<void> {
  const run = await prisma.predictionRun.findUnique({ where: { run_id: runId } });
  if (!run) return;

  await prisma.predictionRun.update({ where: { run_id: runId }, data: { status: 'processing' } });

  try {
    const buf = fs.readFileSync(run.csv_path);
    const bundle = await callAnalytics(buf, run.original_filename ?? 'upload.csv');

    const predictions = (bundle.predictions as PredRow[]) ?? [];
    const hotspots    = (bundle.hotspots as Array<{ id: string }>) ?? [];

    // Build HOT-NNN lookup: h3_id → hotspot_code
    const hotspotMap = new Map<string, string>();
    for (let i = 0; i < Math.min(predictions.length, hotspots.length); i++) {
      hotspotMap.set(predictions[i].h3_id, hotspots[i]?.id ?? `HOT-${String(i + 1).padStart(3, '0')}`);
    }

    const CHUNK = 500;
    for (let i = 0; i < predictions.length; i += CHUNK) {
      const slice = predictions.slice(i, i + CHUNK);
      await prisma.predictionCell.createMany({
        data: slice.map((row) => {
          let lat: number | undefined, lon: number | undefined;
          try {
            [lat, lon] = cellToLatLng(row.h3_id);
          } catch { /* ignore bad h3 */ }

          const riskLevelRaw = row.severity ?? 'low';
          const risk_level: RiskLevel = RISK_MAP[riskLevelRaw] ?? 'low';

          return {
            run_id: runId,
            h3_index: row.h3_id,
            h3_resolution: 9,
            prediction_window: 'H24',
            latitude: lat,
            longitude: lon,
            predicted_violations: row.pred_24h ?? null,
            pred_48h: row.pred_48h ?? null,
            dominant_vehicle_type: row.dominant_vehicle ?? null,
            dominant_violation: row.dominant_violation ?? null,
            congestion_score: row.congestion_score ?? null,
            blockage_rate: row.blockage_rate ?? null,
            risk_level,
            risk_score: row.risk_score ?? null,
            confidence: row.confidence ?? null,
            location: row.location ?? null,
            forecast_date_24h: row.forecast_date_24h ? new Date(row.forecast_date_24h) : null,
            forecast_date_48h: row.forecast_date_48h ? new Date(row.forecast_date_48h) : null,
            hotspot_code: hotspotMap.get(row.h3_id) ?? null,
          };
        }),
      });
    }

    // Store analytics blob
    const summary = bundle.summary as Record<string, unknown>;
    await prisma.runAnalytics.create({
      data: {
        run_id: runId,
        dashboard:   bundle.dashboard   as object,
        hotspots:    bundle.hotspots    as object,
        stations:    bundle.stations    as object,
        officers:    bundle.officers    as object,
        violations:  bundle.violations  as object,
        vehicles:    bundle.vehicles    as object,
        timeseries:  bundle.timeseries  as object,
        funnel:      bundle.funnel      as object,
        edi:         bundle.edi_explanations as object,
        activity:    bundle.activity    as object,
      },
    });

    const rowsIn = typeof summary?.rows_in === 'number' ? summary.rows_in : predictions.length;
    await prisma.predictionRun.update({
      where: { run_id: runId },
      data: { status: 'done', run_at: new Date(), rows_in: rowsIn },
    });
  } catch (err) {
    await prisma.predictionRun.update({ where: { run_id: runId }, data: { status: 'failed' } });
    console.error(`[csvUpload] run ${runId} failed:`, err);
  }
}

export async function history() {
  const runs = await prisma.predictionRun.findMany({
    orderBy: { created_at: 'desc' },
    take: 50,
  });

  const statusMap: Record<string, string> = {
    done: 'completed', pending: 'processing', processing: 'processing', failed: 'failed',
  };

  return runs.map((r: typeof runs[number]) => ({
    id: r.run_id,
    filename: r.original_filename ?? 'upload.csv',
    uploaded_on: r.created_at.toISOString().replace('T', ' ').slice(0, 16),
    rows: r.rows_in ?? 0,
    status: statusMap[r.status] ?? r.status,
    uploaded_by: r.uploaded_by ?? 'admin',
  }));
}
