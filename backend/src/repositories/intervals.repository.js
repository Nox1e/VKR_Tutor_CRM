// `intervals` rows don't carry `userId` directly — they're scoped through their
// parent lesson. We always include `lesson.userId` in the WHERE clause to keep
// tenant isolation. Prisma turns this into a JOIN automatically.

export const IntervalsRepository = {
  findByLessonId: (client, userId, lessonId) =>
    client.interval.findMany({
      where: { lessonId, lesson: { userId } },
      orderBy: { startTime: 'asc' },
    }),

  findById: (client, userId, id) =>
    client.interval.findFirst({
      where: { id, lesson: { userId } },
    }),

  insert: (client, userId, data) =>
    client.interval.create({
      // We don't denormalize userId — but we trust the service layer to have
      // already verified the parent lesson belongs to userId.
      data,
    }),

  updateById: (client, userId, id, data) =>
    client.interval.updateMany({
      where: { id, lesson: { userId } },
      data,
    }),

  deleteById: (client, userId, id) =>
    client.interval.deleteMany({
      where: { id, lesson: { userId } },
    }),
};
