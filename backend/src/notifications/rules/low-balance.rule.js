import { prisma } from '../../database/prisma.js';

/**
 * Fires for every student whose paid-lesson balance is exhausted.
 * Notification ID is stable per student so read state persists across refreshes.
 */
export const lowBalanceRule = {
  name: 'low-balance',

  async evaluate(userId) {
    const students = await prisma.student.findMany({
      where: { userId, paidLessonsCount: { lte: 0 } },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });

    return students.map((s) => ({
      id: `low-balance:${s.id}`,
      type: 'low-balance',
      title: `У ${s.name} закончились оплаченные занятия`,
      body: 'Баланс оплаченных занятий равен нулю — пора напомнить про оплату.',
      meta: { studentId: s.id, studentName: s.name },
      // Stable timestamp so the UI can sort consistently. Use a recent date —
      // we don't track when balance hit zero, so "now" is the best proxy.
      createdAt: new Date(),
    }));
  },
};
