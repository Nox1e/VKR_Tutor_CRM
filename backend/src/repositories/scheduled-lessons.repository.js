// See ADR-007: explicit Prisma client must be passed to every method.

const detailedInclude = {
  student: { select: { name: true } },
  preparation: { select: { title: true } },
  homework: { select: { title: true } },
};

const flatten = (row) => {
  if (!row) return row;
  const { student, preparation, homework, ...rest } = row;
  return {
    ...rest,
    studentName: student?.name ?? null,
    preparationTitle: preparation?.title ?? null,
    homeworkTitle: homework?.title ?? null,
  };
};

export const ScheduledLessonsRepository = {
  findAll: async (client, userId) => {
    const rows = await client.scheduledLesson.findMany({
      where: { userId },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
      include: detailedInclude,
    });
    return rows.map(flatten);
  },

  findByStudentId: async (client, userId, studentId) => {
    const rows = await client.scheduledLesson.findMany({
      where: { userId, studentId },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
      include: detailedInclude,
    });
    return rows.map(flatten);
  },

  findById: (client, userId, id) =>
    client.scheduledLesson.findFirst({
      where: { id, userId },
    }),

  insert: (client, userId, data) =>
    client.scheduledLesson.create({
      data: { ...data, userId },
    }),

  updateById: (client, userId, id, data) =>
    client.scheduledLesson.updateMany({
      where: { id, userId },
      data,
    }),

  deleteById: (client, userId, id) =>
    client.scheduledLesson.deleteMany({
      where: { id, userId },
    }),
};
