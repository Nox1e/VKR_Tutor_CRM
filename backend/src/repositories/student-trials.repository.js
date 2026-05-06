// See ADR-007: explicit Prisma client must be passed to every method.
//
// The frontend needs `trialTitle`, `trialLink`, `trialDifficultyLevel` on each
// row. Prisma include + a flatten step keeps the existing API shape.

const detailedInclude = {
  trial: {
    select: { title: true, link: true, difficultyLevel: true },
  },
};

const flattenDetailed = (row) => {
  if (!row) return row;
  const { trial, ...rest } = row;
  return {
    ...rest,
    trialTitle: trial?.title ?? null,
    trialLink: trial?.link ?? null,
    trialDifficultyLevel: trial?.difficultyLevel ?? null,
  };
};

export const StudentTrialsRepository = {
  findAll: async (client, userId, { studentId } = {}) => {
    const rows = await client.studentTrial.findMany({
      where: {
        userId,
        ...(studentId ? { studentId } : {}),
      },
      orderBy: { deadline: 'asc' },
      include: detailedInclude,
    });
    return rows.map(flattenDetailed);
  },

  findById: (client, userId, id) =>
    client.studentTrial.findFirst({
      where: { id, userId },
    }),

  findDetailedById: async (client, userId, id) => {
    const row = await client.studentTrial.findFirst({
      where: { id, userId },
      include: detailedInclude,
    });
    return flattenDetailed(row);
  },

  insert: (client, userId, data) =>
    client.studentTrial.create({
      data: { ...data, userId },
    }),

  updateById: (client, userId, id, data) =>
    client.studentTrial.updateMany({
      where: { id, userId },
      data,
    }),

  deleteById: (client, userId, id) =>
    client.studentTrial.deleteMany({
      where: { id, userId },
    }),
};
