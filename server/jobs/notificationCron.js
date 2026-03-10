const cron = require('node-cron');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { getDailyContentBundle } = require('../services/dailyContentService');

const getLocalParts = (date, timezone) => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date);

  const get = (type) => parts.find((p) => p.type === type)?.value;
  return {
    year: get('year'),
    month: get('month'),
    day: get('day'),
    hour: get('hour'),
    minute: get('minute'),
  };
};

const toMinutes = (hhmm) => {
  if (!/^\d{2}:\d{2}$/.test(hhmm || '')) return null;
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

const runNotificationCron = () => {
  // Run every minute and fire reminders based on each user's preferred time/timezone.
  cron.schedule('* * * * *', async () => {
    try {
      const users = await User.find(
        {
          $or: [
            { 'preferences.notificationEnabled': { $exists: false } },
            { 'preferences.notificationEnabled': true },
          ],
        },
        '_id preferences.notificationTime preferences.notificationTimezone'
      );
      if (!users.length) return;

      const now = new Date();
      const dailyContent = await getDailyContentBundle();
      let createdCount = 0;

      for (const user of users) {
        const notificationTime = user.preferences?.notificationTime || '08:00';
        const timezone = user.preferences?.notificationTimezone || 'UTC';
        let local;
        try {
          local = getLocalParts(now, timezone);
        } catch (error) {
          continue;
        }
        const currentHHMM = `${local.hour}:${local.minute}`;
        const currentMinutes = toMinutes(currentHHMM);
        const targetMinutes = toMinutes(notificationTime);
        if (currentMinutes === null || targetMinutes === null) {
          continue;
        }

        // Catch-up safe: if server/app starts after scheduled minute,
        // still generate today's notification once.
        if (currentMinutes < targetMinutes) {
          continue;
        }

        const localDate = `${local.year}-${local.month}-${local.day}`;
        const alreadyExists = await Notification.exists({
          user: user._id,
          module: 'system',
          type: 'reminder',
          'meta.localDate': localDate,
        });

        if (alreadyExists) continue;

        await Notification.create({
          user: user._id,
          module: 'system',
          type: 'reminder',
          title: 'Daily Motivation & Habit Check-in',
          message: `${dailyContent.quran} | ${dailyContent.hadith}`,
          meta: {
            localDate,
            timezone,
          },
        });
        createdCount += 1;
      }

      if (createdCount > 0) {
        console.log(`[cron] notifications generated: ${createdCount}`);
      }
    } catch (error) {
      console.error('[cron] notification job error:', error.message);
    }
  });
};

module.exports = runNotificationCron;
