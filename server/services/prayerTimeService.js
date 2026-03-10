const fetchWithTimeout = async (url, timeoutMs = 8000) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return response.json();
  } finally {
    clearTimeout(timer);
  }
};

const normalizeTiming = (value = '') => {
  // Aladhan returns "05:12 (BDT)" sometimes; keep only HH:mm
  return String(value).split(' ')[0];
};

const getPrayerTimes = async ({ date, city, country, method, timezone }) => {
  const base = process.env.PRAYER_API_BASE_URL || 'https://api.aladhan.com/v1/timingsByCity';
  const params = new URLSearchParams({
    date,
    city,
    country,
    method: String(method || 2),
  });

  const data = await fetchWithTimeout(`${base}/${date}?${params.toString()}`);
  const timings = data?.data?.timings || {};
  const metaTz = data?.data?.meta?.timezone || timezone || 'UTC';

  return {
    date,
    timezone: metaTz,
    timings: {
      Fajr: normalizeTiming(timings.Fajr),
      Dhuhr: normalizeTiming(timings.Dhuhr),
      Asr: normalizeTiming(timings.Asr),
      Maghrib: normalizeTiming(timings.Maghrib),
      Isha: normalizeTiming(timings.Isha),
    },
  };
};

module.exports = {
  getPrayerTimes,
};
