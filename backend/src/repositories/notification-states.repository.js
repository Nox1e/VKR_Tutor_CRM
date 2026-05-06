// User-scoped notification read-state. The notification body is computed
// live from the rule registry — only (userId, notificationId, readAt) is
// persisted here.

export const NotificationStatesRepository = {
  findByIds: (client, userId, notificationIds) =>
    client.notificationState.findMany({
      where: { userId, notificationId: { in: notificationIds } },
    }),

  findAllForUser: (client, userId) =>
    client.notificationState.findMany({ where: { userId } }),

  upsert: (client, userId, notificationId, data, fallbackId) =>
    client.notificationState.upsert({
      where: { userId_notificationId: { userId, notificationId } },
      update: data,
      create: { id: fallbackId, userId, notificationId, ...data },
    }),
};
