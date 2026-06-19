import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../middleware/error.js';

export async function generate(monthStr: string, modelVersion: string) {
  const monthDate = new Date(monthStr.length === 7 ? `${monthStr}-01` : monthStr);
  monthDate.setDate(1);
  monthDate.setHours(0, 0, 0, 0);
  if (isNaN(monthDate.getTime())) throw new AppError(400, 'Invalid month format');

  const nextMonth = new Date(monthDate);
  nextMonth.setMonth(nextMonth.getMonth() + 1);

  const validations = await prisma.fieldValidation.findMany({
    where: { submitted_at: { gte: monthDate, lt: nextMonth } },
    include: {
      cell: { select: { predicted_violations: true, risk_level: true } },
    },
  });

  let tp = 0, fp = 0, fn = 0;
  for (const v of validations) {
    const predictedCongestion =
      (v.cell.predicted_violations ?? 0) > 0 ||
      ['high', 'critical'].includes(v.cell.risk_level);
    if (predictedCongestion && v.has_congestion) tp++;
    else if (predictedCongestion && !v.has_congestion) fp++;
    else if (!predictedCongestion && v.has_congestion) fn++;
  }

  const total = validations.length;
  const accuracy = total > 0 ? tp / total : 0;

  return prisma.modelFeedbackBatch.upsert({
    where: { month: monthDate },
    create: {
      month: monthDate,
      model_version: modelVersion,
      total_validations: total,
      true_positives: tp,
      false_positives: fp,
      false_negatives: fn,
      accuracy_score: Math.round(accuracy * 10000) / 10000,
    },
    update: {
      model_version: modelVersion,
      total_validations: total,
      true_positives: tp,
      false_positives: fp,
      false_negatives: fn,
      accuracy_score: Math.round(accuracy * 10000) / 10000,
    },
  });
}

export async function list() {
  return prisma.modelFeedbackBatch.findMany({ orderBy: { month: 'desc' } });
}

export async function submit(batchId: string) {
  const batch = await prisma.modelFeedbackBatch.findUnique({ where: { batch_id: batchId } });
  if (!batch) throw new AppError(404, 'Batch not found');
  if (batch.status === 'submitted') throw new AppError(400, 'Already submitted');
  return prisma.modelFeedbackBatch.update({
    where: { batch_id: batchId },
    data: { status: 'submitted', submitted_at: new Date() },
  });
}
