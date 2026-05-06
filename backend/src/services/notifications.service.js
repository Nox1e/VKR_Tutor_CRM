import { prisma } from '../database/prisma.js';
import { generateId } from '../utils/generate-id.js';
import { notificationRules } from '../notifications/registry.js';
import { NotificationStatesRepository } from '../repositories/notification-states.repository.js';

const evaluateAll = async (userId) => {
  // Run rules in parallel; if one fails, log and continue so a single broken
  // rule doesn't take down the whole notification feed.
  const results = await Promise.all(
    notificationRules.map(async (rule) => {
      try {
        return await rule.evaluate(userId);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error(`[notifications] rule "${rule.name}" failed:`, err);
        return [];
      }
    }),
  );
  return results.flat();
};

const attachReadState = (items, states) => {
  const stateMap = new Map(states.map((s) => [s.notificationId, s]));
  return items
    .map((n) => {
      const state = stateMap.get(n.id);
      return {
        ...n,
        readAt: state?.readAt ?? null,
      };
    })
    .sort((a, b) => {
      // Unread first, then most recent.
      const aRead = !!a.readAt;
      const bRead = !!b.readAt;
      if (aRead !== bRead) return aRead ? 1 : -1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
};

// Drop read-states whose notifications are no longer emitted by any rule.
// This is what makes a notification re-fire as "fresh unread" the next time
// its underlying condition recurs (e.g. student goes to zero balance again
// after a payment cycle). Orphan cleanup is the only mechanism — there is
// no expiry timer.
const cleanupOrphanStates = async (userId, currentItemIds) => {
  await prisma.notificationState.deleteMany({
    where: {
      userId,
      ...(currentItemIds.length > 0 ? { notificationId: { notIn: currentItemIds } } : {}),
    },
  });
};

export const NotificationsService = {
  list: async (userId) => {
    const items = await evaluateAll(userId);
    const itemIds = items.map((i) => i.id);
    await cleanupOrphanStates(userId, itemIds);
    if (items.length === 0) return [];
    const states = await NotificationStatesRepository.findByIds(prisma, userId, itemIds);
    return attachReadState(items, states);
  },

  unreadCount: async (userId) => {
    const items = await evaluateAll(userId);
    if (items.length === 0) return 0;
    const states = await NotificationStatesRepository.findByIds(
      prisma,
      userId,
      items.map((i) => i.id),
    );
    const readSet = new Set(states.filter((s) => s.readAt).map((s) => s.notificationId));
    return items.filter((i) => !readSet.has(i.id)).length;
  },

  markRead: async (userId, notificationId) => {
    const now = new Date();
    await NotificationStatesRepository.upsert(
      prisma,
      userId,
      notificationId,
      { readAt: now },
      generateId('notif'),
    );
    return { ok: true };
  },

  markAllRead: async (userId) => {
    const items = await evaluateAll(userId);
    if (items.length === 0) return { ok: true, count: 0 };
    const now = new Date();
    await prisma.$transaction(
      items.map((n) =>
        prisma.notificationState.upsert({
          where: { userId_notificationId: { userId, notificationId: n.id } },
          update: { readAt: now },
          create: { id: generateId('notif'), userId, notificationId: n.id, readAt: now },
        }),
      ),
    );
    return { ok: true, count: items.length };
  },
};
