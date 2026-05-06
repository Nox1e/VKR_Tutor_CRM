export const HomeworkTagsRepository = {
  findAll: (client, userId) =>
    client.homeworkTag.findMany({
      where: { userId },
      orderBy: { name: 'asc' },
    }),

  findById: (client, userId, id) =>
    client.homeworkTag.findFirst({
      where: { id, userId },
    }),

  findByName: (client, userId, name) =>
    client.homeworkTag.findFirst({
      where: { userId, name },
    }),

  insert: (client, userId, data) =>
    client.homeworkTag.create({
      data: { ...data, userId },
    }),

  updateById: (client, userId, id, data) =>
    client.homeworkTag.updateMany({
      where: { id, userId },
      data,
    }),

  deleteById: (client, userId, id) =>
    client.homeworkTag.deleteMany({
      where: { id, userId },
    }),
};
