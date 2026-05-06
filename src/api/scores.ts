export const calculateEgeScores = {
  primaryToSecondary: (primaryScore: number): number => {
    const scale: Record<number, number> = {
      1: 7,
      2: 14,
      3: 20,
      4: 27,
      5: 34,
      6: 40,
      7: 43,
      8: 46,
      9: 48,
      10: 51,
      11: 54,
      12: 56,
      13: 59,
      14: 62,
      15: 64,
      16: 67,
      17: 70,
      18: 72,
      19: 75,
      20: 78,
      21: 80,
      22: 83,
      23: 85,
      24: 88,
      25: 90,
      26: 93,
      27: 95,
      28: 98,
      29: 100,
    };

    return scale[primaryScore] ?? 0;
  },

  calculatePrimaryScore: (taskScores: number[]): number =>
    taskScores.reduce((sum, score) => sum + score, 0),

  calculateSecondaryScore: (taskScores: number[]): number =>
    calculateEgeScores.primaryToSecondary(calculateEgeScores.calculatePrimaryScore(taskScores)),

  validateTaskScores: (taskScores: number[]): boolean => {
    if (taskScores.length !== 27) {
      return false;
    }

    for (let i = 0; i < 25; i += 1) {
      if (taskScores[i] < 0 || taskScores[i] > 1) {
        return false;
      }
    }

    for (let i = 25; i < 27; i += 1) {
      if (taskScores[i] < 0 || taskScores[i] > 2) {
        return false;
      }
    }

    return true;
  },

  initializeTaskScores: (): number[] => new Array(27).fill(0),
};
