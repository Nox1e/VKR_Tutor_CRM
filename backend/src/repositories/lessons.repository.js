// See ADR-007: explicit Prisma client must be passed to every method.
//
// Frontend cards expect `studentName`, `preparationTitle`, `homeworkTitle`
// alongside the lesson row. We include the related entities and flatten.

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

export const LessonsRepository = {
  findAll: async (client, userId) => {
    const rows = await client.lesson.findMany({
      where: { userId },
      orderBy: { startTime: 'desc' },
      include: detailedInclude,
    });
    return rows.map(flatten);
  },

  findByStudentId: async (client, userId, { studentId, limit, offset, status } = {}) => {
    const rows = await client.lesson.findMany({
      where: {
        userId,
        studentId,
        ...(status ? { status } : {}),
      },
      orderBy: { startTime: 'desc' },
      ...(typeof limit === 'number' ? { take: limit } : {}),
      ...(typeof offset === 'number' ? { skip: offset } : {}),
      include: detailedInclude,
    });
    return rows.map(flatten);
  },

  findById: (client, userId, id) =>
    client.lesson.findFirst({
      where: { id, userId },
    }),

  insert: (client, userId, data) =>
    client.lesson.create({
      data: { ...data, userId },
    }),

  updateById: (client, userId, id, data) =>
    client.lesson.updateMany({
      where: { id, userId },
      data,
    }),

  deleteById: (client, userId, id) =>
    client.lesson.deleteMany({
      where: { id, userId },
    }),

  // Picks up to `limit` earliest unpaid lessons for the student and marks them
  // paid. Uses `FOR UPDATE SKIP LOCKED` (raw SQL) to make concurrent payments
  // safe — see ADR-008.
  markNextUnpaidLessonsAsPaid: async (client, userId, studentId, limit) => {
    const numericLimit = Number.parseInt(limit, 10);
    if (!numericLimit || numericLimit <= 0) {
      return 0;
    }

    const updated = await client.$queryRaw`
      WITH picked AS (
        SELECT id
        FROM lessons
        WHERE user_id = ${userId}
          AND student_id = ${studentId}
          AND is_paid = false
        ORDER BY start_time ASC
        LIMIT ${numericLimit}
        FOR UPDATE SKIP LOCKED
      )
      UPDATE lessons
      SET is_paid = true
      WHERE id IN (SELECT id FROM picked)
      RETURNING id
    `;
    return Array.isArray(updated) ? updated.length : 0;
  },
};
