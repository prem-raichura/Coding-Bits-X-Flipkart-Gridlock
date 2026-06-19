import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

let transporter: nodemailer.Transporter | null = null;

async function getTransporter(): Promise<nodemailer.Transporter> {
  if (transporter) return transporter;
  if (env.EMAIL_MODE === 'smtp') {
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT ?? 587,
      auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
    });
  } else {
    const account = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      auth: { user: account.user, pass: account.pass },
    });
  }
  return transporter;
}

export async function sendCredentials(to: string, username: string, password: string) {
  const t = await getTransporter();
  const info = await t.sendMail({
    from:
      env.EMAIL_MODE === 'smtp'
        ? env.SMTP_FROM
        : '"Officer App" <noreply@officerapp.local>',
    to,
    subject: 'Your Officer App login credentials',
    text: [
      'Your registration has been approved.',
      '',
      `Username: ${username}`,
      `Password: ${password}`,
      '',
      'Please change your password after first login.',
    ].join('\n'),
  });

  if (env.EMAIL_MODE === 'stub') {
    console.log(`\n[EMAIL STUB] ─────────────────────────────`);
    console.log(`  To:       ${to}`);
    console.log(`  Username: ${username}`);
    console.log(`  Password: ${password}`);
    console.log(`  Preview:  ${nodemailer.getTestMessageUrl(info)}`);
    console.log(`───────────────────────────────────────────\n`);
  }
}
