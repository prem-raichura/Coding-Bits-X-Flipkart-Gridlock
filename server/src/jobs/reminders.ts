import cron from 'node-cron';
import { prisma } from '../lib/prisma.js';
import { env } from '../config/env.js';
import { sendEmail } from '../utils/email.js';
import { sendPush } from '../utils/push.js';

/**
 * Find active assignments whose time_limit has lapsed without a submitted report,
 * and that have not already been reminded, then nudge the officer by mail + push.
 * Returns the number of reminders sent.
 */
export async function runReminders(): Promise<number> {
  const now = new Date();
  const overdue = await prisma.assignment.findMany({
    where: { status: 'active', time_limit: { lt: now }, validation: { is: null } },
    include: {
      user: { select: { id: true, name: true, email: true, push_token: true } },
      cell: { select: { h3_index: true } },
      notifications: { where: { type: 'reminder' }, select: { notification_id: true } },
    },
  });

  let sent = 0;
  for (const a of overdue) {
    if (a.notifications.length > 0) continue; // already reminded once

    const zone = a.cell.h3_index;
    await prisma.notification.create({
      data: {
        user_id: a.user_id,
        assignment_id: a.id,
        type: 'reminder',
        title: 'Patrol report overdue',
        body: `Your assigned time for zone ${zone} has ended. Please submit your field report now.`,
      },
    });
    await sendEmail(
      a.user.email,
      'Patrol report overdue',
      [
        `Hello ${a.user.name},`,
        '',
        `Your assigned patrol time for zone ${zone} has ended and no report has been submitted.`,
        'Please open the Officer App and submit your field report immediately.',
      ].join('\n'),
    ).catch((e) => console.error('[reminders] email failed:', e));
    await sendPush(a.user.push_token, 'Patrol report overdue', `Submit your report for zone ${zone}.`, {
      assignment_id: a.id,
    });
    sent++;
  }
  if (sent) console.log(`[reminders] sent ${sent} overdue reminder(s).`);
  return sent;
}

export function startReminderCron() {
  if (!cron.validate(env.REMINDER_CRON)) {
    console.warn(`[reminders] invalid REMINDER_CRON "${env.REMINDER_CRON}", skipping scheduler.`);
    return;
  }
  cron.schedule(env.REMINDER_CRON, () => {
    runReminders().catch((e) => console.error('[reminders] run failed:', e));
  });
  console.log(`[reminders] scheduled (${env.REMINDER_CRON}).`);
}
