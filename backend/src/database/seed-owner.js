import { initDatabase, closeDatabase, prisma } from './prisma.js';
import { config } from '../config/index.js';
import { AuthService } from '../auth/auth.service.js';

const run = async () => {
  await initDatabase();

  const email = config.seed.ownerEmail.trim();
  const password = config.seed.ownerPassword;

  if (!email || !password) {
    console.error('INITIAL_OWNER_EMAIL и INITIAL_OWNER_PASSWORD должны быть заданы в backend/.env');
    process.exit(1);
  }
  if (password.length < 8) {
    console.error('INITIAL_OWNER_PASSWORD: минимум 8 символов');
    process.exit(1);
  }

  const count = await prisma.user.count();
  if (count > 0) {
    console.log(`В БД уже ${count} пользователь(ей). Создание owner'а пропущено.`);
    await closeDatabase();
    return;
  }

  const user = await AuthService.createOwner({ email, password });
  console.log(`Owner создан: #${user.id} ${user.email}`);
  await closeDatabase();
};

run().catch(async (err) => {
  console.error('Сид owner\'а провалился:', err);
  await closeDatabase().catch(() => {});
  process.exit(1);
});
