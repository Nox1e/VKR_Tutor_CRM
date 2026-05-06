import { prisma } from '../database/prisma.js';
import { exportPayloadSchema, importPayloadSchema } from '../../../shared/api/contracts.js';

const TABLES_IN_DELETE_ORDER = [
  'trialResult',
  'studentTrial',
  'paymentHistory',
  'interval',
  'trajectoryItem',
  'lesson',
  'scheduledLesson',
  'preparation',
  'homework',
  'trial',
  'student',
];

const deleteUserData = async (tx, userId) => {
  // intervals don't carry userId — wipe them via lesson FK first.
  await tx.interval.deleteMany({ where: { lesson: { userId } } });
  // trial_results don't carry userId either — wipe via studentTrial FK.
  await tx.trialResult.deleteMany({ where: { studentTrial: { userId } } });
  for (const model of TABLES_IN_DELETE_ORDER) {
    if (model === 'interval' || model === 'trialResult') continue;
    // eslint-disable-next-line no-await-in-loop
    await tx[model].deleteMany({ where: { userId } });
  }
};

export const AdminService = {
  exportData: async (userId) => {
    const [
      students,
      lessons,
      scheduledLessons,
      intervals,
      preparations,
      homeworks,
      trials,
      studentTrials,
      trialResults,
      paymentHistory,
    ] = await Promise.all([
      prisma.student.findMany({ where: { userId } }),
      prisma.lesson.findMany({ where: { userId } }),
      prisma.scheduledLesson.findMany({ where: { userId } }),
      prisma.interval.findMany({ where: { lesson: { userId } } }),
      prisma.preparation.findMany({ where: { userId } }),
      prisma.homework.findMany({ where: { userId } }),
      prisma.trial.findMany({ where: { userId } }),
      prisma.studentTrial.findMany({ where: { userId } }),
      prisma.trialResult.findMany({ where: { studentTrial: { userId } } }),
      prisma.paymentHistory.findMany({ where: { userId } }),
    ]);

    const payload = {
      students,
      lessons,
      scheduledLessons,
      intervals,
      preparations,
      homeworks,
      trials,
      studentTrials,
      trialResults,
      paymentHistory,
      exportDate: new Date().toISOString(),
    };

    return exportPayloadSchema.parse(payload);
  },

  importData: async (userId, payload) => {
    const data = importPayloadSchema.parse(payload);

    await prisma.$transaction(async (tx) => {
      await deleteUserData(tx, userId);

      const insertMany = async (model, items, build) => {
        if (!items || items.length === 0) return;
        for (const item of items) {
          // eslint-disable-next-line no-await-in-loop
          await tx[model].create({ data: build(item) });
        }
      };

      await insertMany('student', data.students, (s) => ({
        id: s.id,
        userId,
        name: s.name,
        createdAt: s.createdAt ? new Date(s.createdAt) : new Date(),
      }));

      await insertMany('lesson', data.lessons, (l) => ({
        id: l.id,
        userId,
        studentId: l.studentId,
        startTime: new Date(l.startTime),
        endTime: new Date(l.endTime),
        meetLink: l.meetLink ?? null,
        comment: l.comment ?? null,
        isScheduled: Boolean(l.isScheduled),
        status: l.status ?? 'planned',
        preparationId: l.preparationId ?? null,
        homeworkId: l.homeworkId ?? null,
        isPaid: Boolean(l.isPaid),
        createdAt: l.createdAt ? new Date(l.createdAt) : new Date(),
      }));

      await insertMany('scheduledLesson', data.scheduledLessons, (sl) => ({
        id: sl.id,
        userId,
        studentId: sl.studentId,
        dayOfWeek: sl.dayOfWeek,
        startTime: sl.startTime,
        endTime: sl.endTime,
        meetLink: sl.meetLink ?? null,
        comment: sl.comment ?? null,
        preparationId: sl.preparationId ?? null,
        homeworkId: sl.homeworkId ?? null,
        createdAt: sl.createdAt ? new Date(sl.createdAt) : new Date(),
      }));

      await insertMany('interval', data.intervals, (i) => ({
        id: i.id,
        lessonId: i.lessonId,
        startTime: new Date(i.startTime),
        endTime: i.endTime ? new Date(i.endTime) : null,
        createdAt: i.createdAt ? new Date(i.createdAt) : new Date(),
      }));

      await insertMany('preparation', data.preparations, (p) => ({
        id: p.id,
        userId,
        taskNumber: p.taskNumber,
        method: p.method,
        title: p.title,
        message: p.message,
        createdAt: p.createdAt ? new Date(p.createdAt) : new Date(),
        updatedAt: p.updatedAt ? new Date(p.updatedAt) : new Date(),
      }));

      await insertMany('homework', data.homeworks, (h) => ({
        id: h.id,
        userId,
        taskNumber: h.taskNumber,
        title: h.title,
        link: h.link ?? null,
        createdAt: h.createdAt ? new Date(h.createdAt) : new Date(),
        updatedAt: h.updatedAt ? new Date(h.updatedAt) : new Date(),
      }));

      await insertMany('trial', data.trials, (t) => ({
        id: t.id,
        userId,
        orderNumber: t.orderNumber,
        difficultyLevel: t.difficultyLevel,
        title: t.title,
        link: t.link,
        createdAt: t.createdAt ? new Date(t.createdAt) : new Date(),
        updatedAt: t.updatedAt ? new Date(t.updatedAt) : new Date(),
      }));

      await insertMany('studentTrial', data.studentTrials, (st) => ({
        id: st.id,
        userId,
        studentId: st.studentId,
        trialId: st.trialId,
        deadline: new Date(st.deadline),
        comment: st.comment ?? null,
        complications: st.complications ?? null,
        status: st.status ?? 'assigned',
        completedAt: st.completedAt ? new Date(st.completedAt) : null,
        createdAt: st.createdAt ? new Date(st.createdAt) : new Date(),
        updatedAt: st.updatedAt ? new Date(st.updatedAt) : new Date(),
      }));

      await insertMany('trialResult', data.trialResults, (r) => ({
        id: r.id,
        studentTrialId: r.studentTrialId,
        taskScores: typeof r.taskScores === 'string' ? JSON.parse(r.taskScores) : r.taskScores,
        primaryScore: r.primaryScore,
        secondaryScore: r.secondaryScore,
        createdAt: r.createdAt ? new Date(r.createdAt) : new Date(),
        updatedAt: r.updatedAt ? new Date(r.updatedAt) : new Date(),
      }));

      await insertMany('paymentHistory', data.paymentHistory, (p) => ({
        id: p.id,
        userId,
        studentId: p.studentId,
        lessonsCount: p.lessonsCount,
        amount: p.amount,
        createdAt: p.createdAt ? new Date(p.createdAt) : new Date(),
      }));
    });

    return { message: 'Данные успешно импортированы' };
  },

  clearAllData: async (userId) => {
    await prisma.$transaction(async (tx) => {
      await deleteUserData(tx, userId);
    });
    return { message: 'Все данные очищены' };
  },
};
