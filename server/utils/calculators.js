const activityMultipliers = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

const calculateBMI = (weightKg, heightCm) => {
  if (!weightKg || !heightCm) return 0;
  const heightM = heightCm / 100;
  return Number((weightKg / (heightM * heightM)).toFixed(1));
};

const calculateDailyCalories = ({
  age,
  weightKg,
  heightCm,
  gender = 'male',
  goal = 'maintain',
  activityLevel = 'moderate',
}) => {
  // Mifflin-St Jeor Equation
  const base =
    gender === 'female'
      ? 10 * weightKg + 6.25 * heightCm - 5 * age - 161
      : 10 * weightKg + 6.25 * heightCm - 5 * age + 5;

  const tdee = base * (activityMultipliers[activityLevel] || activityMultipliers.moderate);

  if (goal === 'loss') return Math.round(tdee - 400);
  if (goal === 'gain') return Math.round(tdee + 300);
  return Math.round(tdee);
};

const getSleepRecommendationByAge = (age) => {
  if (age <= 5) return { min: 10, max: 13 };
  if (age <= 12) return { min: 9, max: 12 };
  if (age <= 18) return { min: 8, max: 10 };
  if (age <= 64) return { min: 7, max: 9 };
  return { min: 7, max: 8 };
};

module.exports = {
  calculateBMI,
  calculateDailyCalories,
  getSleepRecommendationByAge,
};
