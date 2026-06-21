import { env } from './config/env.js';
import app from './app.js';
import { startReminderCron } from './jobs/reminders.js';

// Local / long-running server. On Vercel the app is served via api/index.ts.
app.listen(env.PORT, () => {
  console.log(`\n🚀 Officer App Server → http://localhost:${env.PORT}/api\n`);
  startReminderCron();
});

export default app;
