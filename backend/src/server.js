import { createApp } from './app.js';
import { config, validateRuntimeConfig } from './config/index.js';
import { initDatabase, closeDatabase } from './database/prisma.js';
import {
  startLessonCompletionWorker,
  stopLessonCompletionWorker,
} from './services/lesson-completion-worker.js';

export const startServer = async () => {
  try {
    validateRuntimeConfig();
    await initDatabase();

    const app = createApp();
    const server = app.listen(config.port, () => {
      // eslint-disable-next-line no-console
      console.log(`Сервер запущен на порту ${config.port}`);
      // eslint-disable-next-line no-console
      console.log('База данных подключена (Postgres / Prisma)');
    });

    startLessonCompletionWorker();

    const gracefulShutdown = async (signal) => {
      if (signal) {
        // eslint-disable-next-line no-console
        console.log(`\nПолучен сигнал ${signal}, закрываю сервер...`);
      }

      stopLessonCompletionWorker();

      server.close(async () => {
        try {
          await closeDatabase();
          // eslint-disable-next-line no-console
          console.log('База данных закрыта');
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error('Ошибка закрытия базы данных:', error);
        } finally {
          process.exit(0);
        }
      });
    };

    process.on('SIGINT', gracefulShutdown);
    process.on('SIGTERM', gracefulShutdown);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Ошибка инициализации сервера:', error);
    process.exit(1);
  }
};

export default startServer;
