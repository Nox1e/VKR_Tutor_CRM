export const TrialTagsRepository = {
  findAll: (client, userId) =>
    client.trialTag.findMany({
      where: { userId },
      orderBy: { name: 'asc' },
    }),

  findById: (client, userId, id) =>
    client.trialTag.findFirst({
      where: { id, userId },
    }),

  findByName: (client, userId, name) =>
    client.trialTag.findFirst({
      where: { userId, name },
    }),

  insert: (client, userId, data) =>
    client.trialTag.create({
      data: { ...data, userId },
    }),

  updateById: (client, userId, id, data) =>
    client.trialTag.updateMany({
      where: { id, userId },
      data,
    }),

  deleteById: (client, userId, id) =>
    client.trialTag.deleteMany({
      where: { id, userId },
    }),
};
