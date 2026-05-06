// `trial_results` doesn't carry `userId` — it's scoped through its parent
// student_trial. Tenant isolation goes via `studentTrial.userId`.

const enrichedInclude = {
  studentTrial: {
    select: {
      studentId: true,
      completedAt: true,
      deadline: true,
      trial: { select: { title: true, difficultyLevel: true } },
    },
  },
};

const flattenEnriched = (row) => {
  if (!row) return row;
  const { studentTrial, ...rest } = row;
  return {
    ...rest,
    studentId: studentTrial?.studentId ?? null,
    completedAt: studentTrial?.completedAt ?? null,
    deadline: studentTrial?.deadline ?? null,
    trialTitle: studentTrial?.trial?.title ?? null,
    trialDifficultyLevel: studentTrial?.trial?.difficultyLevel ?? null,
  };
};

export const TrialResultsRepository = {
  findByStudentTrialId: (client, userId, studentTrialId) =>
    client.trialResult.findMany({
      where: { studentTrialId, studentTrial: { userId } },
      orderBy: { createdAt: 'asc' },
    }),

  findEnriched: async (client, userId, { studentId } = {}) => {
    const rows = await client.trialResult.findMany({
      where: {
        studentTrial: {
          userId,
          ...(studentId ? { studentId } : {}),
        },
      },
      orderBy: { createdAt: 'asc' },
      include: enrichedInclude,
    });
    return rows.map(flattenEnriched);
  },

  findById: (client, userId, id) =>
    client.trialResult.findFirst({
      where: { id, studentTrial: { userId } },
    }),

  insert: (client, userId, data) =>
    client.trialResult.create({ data }),

  updateById: (client, userId, id, data) =>
    client.trialResult.updateMany({
      where: { id, studentTrial: { userId } },
      data,
    }),

  deleteById: (client, userId, id) =>
    client.trialResult.deleteMany({
      where: { id, studentTrial: { userId } },
    }),
};
