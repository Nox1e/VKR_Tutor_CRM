import { prisma } from '../database/prisma.js';

const userSelect = {
  id: true,
  email: true,
  role: true,
  status: true,
  createdAt: true,
};

export const AuthRepository = {
  findByEmail: (email) =>
    prisma.user.findUnique({
      where: { email },
      select: { ...userSelect, passwordHash: true },
    }),

  findById: (id) =>
    prisma.user.findUnique({
      where: { id },
      select: userSelect,
    }),

  countAll: () => prisma.user.count(),

  insert: ({ email, passwordHash, role = 'tutor' }) =>
    prisma.user.create({
      data: { email, passwordHash, role },
      select: userSelect,
    }),
};
