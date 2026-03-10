const staticContent = {
  quran: 'Indeed, with hardship comes ease. (94:6)',
  hadith: 'Actions are judged by intentions.',
  health: 'Consistency beats intensity. Build sustainable habits.',
  study: 'Deep work blocks beat long distracted study sessions.',
  sleep: 'Fixed sleep and wake times improve recovery quality.',
};

const fetchWithTimeout = async (url, timeoutMs = 7000) => {
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

const getRandomAyah = async () => {
  const randomAyahNo = Math.floor(Math.random() * 6236) + 1;
  const base = process.env.QURAN_API_BASE_URL || 'https://api.alquran.cloud/v1/ayah';
  const data = await fetchWithTimeout(`${base}/${randomAyahNo}/en.asad`);
  const text = data?.data?.text;
  const surah = data?.data?.surah?.englishName;
  const numberInSurah = data?.data?.numberInSurah;

  if (!text) throw new Error('Quran API returned no ayah text');
  if (surah && numberInSurah) return `${text} (${surah} ${numberInSurah})`;
  return text;
};

const getRandomHadith = async () => {
  const hadithNumber = Math.floor(Math.random() * 300) + 1;
  const base = process.env.HADITH_API_BASE_URL || 'https://api.hadith.sutanlab.id/books/muslim';
  const data = await fetchWithTimeout(`${base}/${hadithNumber}`);

  const text =
    data?.data?.contents?.arab ||
    data?.data?.contents?.id ||
    data?.data?.contents?.en ||
    data?.data?.contents?.text ||
    data?.data?.hadith;

  if (!text) throw new Error('Hadith API returned no text');
  return text;
};

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

const getDailyContentBundle = async () => {
  const healthPool = [
    'Drink at least 2 liters of water daily.',
    'Keep protein in every main meal for satiety and recovery.',
  ];
  const studyPool = [
    'Start with the hardest topic during your peak focus window.',
    'Practice with past questions before reading new notes.',
  ];
  const sleepPool = [
    'Keep a fixed bedtime for at least 5 days a week.',
    'Avoid caffeine 6-8 hours before sleep.',
  ];

  const [quran, hadith] = await Promise.allSettled([getRandomAyah(), getRandomHadith()]);

  return {
    quran: quran.status === 'fulfilled' ? quran.value : staticContent.quran,
    hadith: hadith.status === 'fulfilled' ? hadith.value : staticContent.hadith,
    health: pick(healthPool),
    study: pick(studyPool),
    sleep: pick(sleepPool),
  };
};

module.exports = {
  getDailyContentBundle,
};
