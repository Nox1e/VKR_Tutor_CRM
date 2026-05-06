// See ADR-007: explicit Prisma client must be passed to every method.

const tagsInclude = { tags: { select: { id: true, name: true, color: true } } };

const buildWhere = (userId, { tagIds } = {}) => {
  const where = { userId };
  if (Array.isArray(tagIds) && tagIds.length > 0) {
    where.tags = { some: { id: { in: tagIds } } };
  }
  return where;
};

export const TrialsRepository = {
  findAll: (client, userId, filter = {}) =>
    client.trial.findMany({
      where: buildWhere(userId, filter),
      orderBy: { orderNumber: 'asc' },
      include: tagsInclude,
    }),

  findById: (client, userId, id) =>
    client.trial.findFirst({
      where: { id, userId },
      include: tagsInclude,
    }),

  insert: (client, userId, data, { tagIds } = {}) =>
    client.trial.create({
      data: {
        ...data,
        userId,
        ...(tagIds ? { tags: { connect: tagIds.map((id) => ({ id })) } } : {}),
      },
      include: tagsInclude,
    }),

  updateById: (client, userId, id, data, { tagIds } = {}) =>
    client.trial.updateMany({
      where: { id, userId },
      data,
    }).then(async (res) => {
      if (res.count === 0) return res;
      if (tagIds !== undefined) {
        await client.trial.update({
          where: { id },
          data: { tags: { set: tagIds.map((tid) => ({ id: tid })) } },
        });
      }
      return res;
    }),

  deleteById: (client, userId, id) =>
    client.trial.deleteMany({
      where: { id, userId },
    }),
};
