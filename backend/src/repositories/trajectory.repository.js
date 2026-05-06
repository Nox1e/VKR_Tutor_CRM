// See ADR-007: explicit Prisma client must be passed to every method.

const detailedInclude = {
  preparation: {
    select: { title: true, taskNumber: true, method: true },
  },
  homework: { select: { title: true } },
};

const flatten = (row) => {
  if (!row) return row;
  const { preparation, homework, ...rest } = row;
  return {
    ...rest,
    preparationTitle: preparation?.title ?? null,
    preparationTaskNumber: preparation?.taskNumber ?? null,
    preparationMethod: preparation?.method ?? null,
    homeworkTitle: homework?.title ?? null,
  };
};

export const TrajectoryRepository = {
  findByStudentId: async (client, userId, studentId) => {
    const rows = await client.trajectoryItem.findMany({
      where: { userId, studentId },
      orderBy: { position: 'asc' },
      include: detailedInclude,
    });
    return rows.map(flatten);
  },

  findById: async (client, userId, id) => {
    const row = await client.trajectoryItem.findFirst({
      where: { id, userId },
      include: detailedInclude,
    });
    return flatten(row);
  },

  findNextQueued: (client, userId, studentId) =>
    client.trajectoryItem.findFirst({
      where: { userId, studentId, status: 'queued' },
      orderBy: { position: 'asc' },
    }),

  findAssignedForLesson: (client, userId, lessonId) =>
    client.trajectoryItem.findFirst({
      where: { userId, assignedToLessonId: lessonId, status: 'assigned' },
    }),

  findAssignedByStudentId: (client, userId, studentId) =>
    client.trajectoryItem.findMany({
      where: { userId, studentId, status: 'assigned' },
      orderBy: { position: 'asc' },
    }),

  getMaxPosition: async (client, userId, studentId) => {
    const row = await client.trajectoryItem.aggregate({
      where: { userId, studentId },
      _max: { position: true },
    });
    return row._max.position ?? -1;
  },

  insert: (client, userId, data) =>
    client.trajectoryItem.create({
      data: { ...data, userId },
    }),

  updateStatus: (client, userId, id, status, extra = {}) => {
    const data = { status };
    if (extra.assignedToLessonId !== undefined) data.assignedToLessonId = extra.assignedToLessonId;
    if (extra.assignedAt !== undefined) data.assignedAt = extra.assignedAt;
    if (extra.consumedAt !== undefined) data.consumedAt = extra.consumedAt;
    return client.trajectoryItem.updateMany({
      where: { id, userId },
      data,
    });
  },

  updatePositions: async (client, userId, studentId, orderedIds) => {
    // Caller is responsible for wrapping this in a transaction.
    for (let i = 0; i < orderedIds.length; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      await client.trajectoryItem.updateMany({
        where: { id: orderedIds[i], userId, studentId },
        data: { position: i },
      });
    }
  },

  deleteById: (client, userId, id) =>
    client.trajectoryItem.deleteMany({
      where: { id, userId },
    }),

  deleteByStudentId: (client, userId, studentId) =>
    client.trajectoryItem.deleteMany({
      where: { userId, studentId },
    }),
};
