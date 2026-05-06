// CLI to mint invite codes for /api/auth/register.
//
// Usage:
//   npm run create-invite                                       # 1 use, never expires
//   npm run create-invite -- --max-uses=3
//   npm run create-invite -- --expires-at=2026-12-31
//   npm run create-invite -- --note="for Lena"
//   npm run create-invite -- --code=tutor-mycustomcode
//
// Prints the code to stdout (single line) on success so it can be piped.

import { randomBytes } from 'crypto';
import { initDatabase, closeDatabase, prisma } from '../database/prisma.js';

const BASE32 = 'abcdefghijklmnopqrstuvwxyz234567'; // RFC 4648 base32 lowercase

const generateCode = () => {
  // 10 chars × 5 bits ≈ 50 bits of entropy.
  const bytes = randomBytes(7);
  let bits = 0n;
  for (const b of bytes) bits = (bits << 8n) | BigInt(b);
  const out = [];
  for (let i = 0; i < 10; i += 1) {
    out.push(BASE32[Number(bits & 0x1fn)]);
    bits >>= 5n;
  }
  return `tutor-${out.join('')}`;
};

const parseArgs = (argv) => {
  const opts = { maxUses: 1, expiresAt: null, note: null, code: null };
  for (const arg of argv) {
    const [k, ...rest] = arg.split('=');
    const v = rest.join('=');
    if (k === '--max-uses') opts.maxUses = Number.parseInt(v, 10);
    else if (k === '--expires-at') opts.expiresAt = new Date(v);
    else if (k === '--note') opts.note = v;
    else if (k === '--code') opts.code = v;
  }
  if (!Number.isFinite(opts.maxUses) || opts.maxUses <= 0) {
    throw new Error('--max-uses должен быть положительным целым');
  }
  if (opts.expiresAt && Number.isNaN(opts.expiresAt.getTime())) {
    throw new Error('--expires-at должен быть валидной датой (YYYY-MM-DD)');
  }
  return opts;
};

const run = async () => {
  const opts = parseArgs(process.argv.slice(2));
  await initDatabase();

  const code = opts.code ?? generateCode();
  await prisma.inviteCode.create({
    data: {
      code,
      maxUses: opts.maxUses,
      expiresAt: opts.expiresAt,
      note: opts.note,
    },
  });

  process.stdout.write(`${code}\n`);
  await closeDatabase();
};

run().catch(async (err) => {
  process.stderr.write(`${err.message ?? err}\n`);
  await closeDatabase().catch(() => {});
  process.exit(1);
});
