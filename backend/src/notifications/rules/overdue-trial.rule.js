import { prisma } from '../../database/prisma.js';

/**
 * Fires for every assigned StudentTrial whose deadline has passed and which
 * has not been marked as completed.
 */
export const overdueTrialRule = {
  name: 'overdue-trial',

  async evaluate(userId) {
    const now = new Date();
    const overdue = await prisma.studentTrial.findMany({
      where: { userId, status: 'assigned', deadline: { lt: now } },
      include: {
        student: { select: { id: true, name: true } },
        trial: { select: { id: true, title: true } },
      },
      orderBy: { deadline: 'asc' },
    });

    return overdue.map((st) => ({
      id: `overdue-trial:${st.id}`,
      type: 'overdue-trial',
      title: `Просрочен пробник «${st.trial.title}» у ${st.student.name}`,
      body: `Дедлайн был ${st.deadline.toISOString().slice(0, 10)}.`,
      meta: {
        studentId: st.studentId,
        studentName: st.student.name,
        studentTrialId: st.id,
        trialId: st.trialId,
        trialTitle: st.trial.title,
        deadline: st.deadline,
      },
      // Use the deadline as the event timestamp.
      createdAt: st.deadline,
    }));
  },
};
