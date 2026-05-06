import { prisma } from '../database/prisma.js';
import { LessonsRepository } from '../repositories/lessons.repository.js';
import { StudentsRepository } from '../repositories/students.repository.js';
import { TrajectoryService } from './trajectory.service.js';

let timer = null;
let inflight = false;

/**
 * Sweep planned lessons whose end_time has passed, flipping them to
 * 'completed' and consuming one paid-lesson credit from the student's
 * balance when the lesson was unpaid. Idempotent.
 *
 * MVP assumption (see deploy/docker-compose): the backend runs as a single
 * instance, so the in-process `inflight` flag is enough to serialise sweeps.
 * If we ever scale horizontally, gate this with `pg_try_advisory_lock` on
 * a long-lived connection — see §12.3 of the SaaS migration spec.
 *
 * Returns the number of lessons transitioned in this pass.
 */
export const runLessonCompletionSweep = async () => {
  if (inflight) return 0;
  inflight = true;

  try {
    const expired = await prisma.lesson.findMany({
      where: { status: 'planned', endTime: { lt: new Date() } },
      select: { id: true, userId: true, studentId: true, isPaid: true },
    });

    let completed = 0;
    for (const row of expired) {
      try {
        // Canonical completion path: updates status + advances trajectory +
        // consumes scheduled template. Handles its own transaction.
        // eslint-disable-next-line no-await-in-loop
        await TrajectoryService.handleLessonCompleted(row.userId, row.id);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error(`[completion-worker] handleLessonCompleted failed for ${row.id}:`, err);
        // eslint-disable-next-line no-continue
        continue;
      }

      if (!row.isPaid) {
        try {
          // eslint-disable-next-line no-await-in-loop
          await prisma.$transaction(async (tx) => {
            const student = await StudentsRepository.findById(tx, row.userId, row.studentId);
            if (!student || (student.paidLessonsCount ?? 0) <= 0) return;
            await LessonsRepository.updateById(tx, row.userId, row.id, { isPaid: true });
            await StudentsRepository.decrementPaidLessons(tx, row.userId, row.studentId, 1);
          });
        } catch (err) {
          // eslint-disable-next-line no-console
          console.error(`[completion-worker] balance settlement failed for ${row.id}:`, err);
        }
      }

      completed += 1;
    }

    return completed;
  } finally {
    inflight = false;
  }
};

export const startLessonCompletionWorker = (intervalMs = 60_000) => {
  if (timer) return;

  const tick = async () => {
    try {
      const n = await runLessonCompletionSweep();
      if (n > 0) {
        // eslint-disable-next-line no-console
        console.log(`[completion-worker] завершено занятий: ${n}`);
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[completion-worker] tick failed:', err);
    }
  };

  // Run once immediately on start so a cold boot picks up any lessons that
  // expired while the server was down.
  void tick();
  timer = setInterval(tick, intervalMs);
};

export const stopLessonCompletionWorker = () => {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
};
