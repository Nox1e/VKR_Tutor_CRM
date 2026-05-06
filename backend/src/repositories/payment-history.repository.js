// See ADR-007: explicit Prisma client must be passed to every method.

const includeStudentName = {
  student: { select: { name: true } },
};

const flatten = (rows) =>
  rows.map(({ student, ...row }) => ({
    ...row,
    studentName: student?.name ?? null,
  }));

export const PaymentHistoryRepository = {
  findAll: async (client, userId) => {
    const rows = await client.paymentHistory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: includeStudentName,
    });
    return flatten(rows);
  },

  findById: (client, userId, id) =>
    client.paymentHistory.findFirst({
      where: { id, userId },
    }),

  findByStudentId: (client, userId, studentId) =>
    client.paymentHistory.findMany({
      where: { userId, studentId },
      orderBy: { createdAt: 'desc' },
    }),

  insert: (client, userId, data) =>
    client.paymentHistory.create({
      data: { ...data, userId },
    }),

  deleteById: (client, userId, id) =>
    client.paymentHistory.deleteMany({
      where: { id, userId },
    }),
};
