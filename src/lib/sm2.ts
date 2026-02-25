export interface CardSchedulingData {
  interval: number;
  easeFactor: number;
  reviewCount: number;
  dueDate: string;
}

export function applySM2(
  quality: number, // 1=again, 2=hard, 3=good, 4=easy
  currentInterval: number,
  currentEaseFactor: number,
  currentRepetitions: number
): CardSchedulingData {
  let interval: number;
  let easeFactor = currentEaseFactor;
  let repetitions = currentRepetitions;

  if (quality >= 3) {
    if (repetitions === 0) {
      interval = 1;
    } else if (repetitions === 1) {
      interval = 6;
    } else {
      interval = Math.round(currentInterval * easeFactor);
    }
    easeFactor = easeFactor + (0.1 - (4 - quality) * (0.08 + (4 - quality) * 0.02));
    easeFactor = Math.max(1.3, easeFactor);
    repetitions++;
  } else {
    interval = 1;
    repetitions = 0;
  }

  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + interval);

  return {
    interval,
    easeFactor,
    reviewCount: repetitions,
    dueDate: dueDate.toISOString(),
  };
}
