// All methods take an explicit Prisma client as the first argument:
//   - In normal calls pass the singleton `prisma`.
//   - Inside `prisma.$transaction(async (tx) => …)` pass `tx`.
// This is what makes transactions actually atomic — going through the global
// singleton from inside a transaction would silently auto-commit. See ADR-007.

export const StudentsRepository = {
  findAll: (client, userId) =>
    client.student.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    }),

  findById: (client, userId, id) =>
    client.student.findFirst({
      where: { id, userId },
    }),

  insert: (client, userId, data) =>
    client.student.create({
      data: { ...data, userId },
    }),

  updateById: (client, userId, id, data) =>
    client.student.updateMany({
      where: { id, userId },
      data,
    }),

  deleteById: (client, userId, id) =>
    client.student.deleteMany({
      where: { id, userId },
    }),

  incrementPaidLessons: (client, userId, studentId, value) =>
    client.student.updateMany({
      where: { id: studentId, userId },
      data: { paidLessonsCount: { increment: value } },
    }),

  decrementPaidLessons: (client, userId, studentId, value) =>
    client.student.updateMany({
      where: { id: studentId, userId },
      data: { paidLessonsCount: { decrement: value } },
    }),

  setPaidLessonsCount: (client, userId, studentId, value) =>
    client.student.updateMany({
      where: { id: studentId, userId },
      data: { paidLessonsCount: value },
    }),
};
