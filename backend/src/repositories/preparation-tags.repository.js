// User-scoped tags for preparations. Pattern mirrors other repositories: every
// method accepts an explicit Prisma client (ADR-007).

export const PreparationTagsRepository = {
  findAll: (client, userId) =>
    client.preparationTag.findMany({
      where: { userId },
      orderBy: { name: 'asc' },
    }),

  findById: (client, userId, id) =>
    client.preparationTag.findFirst({
      where: { id, userId },
    }),

  findByName: (client, userId, name) =>
    client.preparationTag.findFirst({
      where: { userId, name },
    }),

  insert: (client, userId, data) =>
    client.preparationTag.create({
      data: { ...data, userId },
    }),

  updateById: (client, userId, id, data) =>
    client.preparationTag.updateMany({
      where: { id, userId },
      data,
    }),

  deleteById: (client, userId, id) =>
    client.preparationTag.deleteMany({
      where: { id, userId },
    }),
};
