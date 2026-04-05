import { PrismaClient } from '@prisma/client';

/**
 * One-time normalization script.
 *
 * Purpose:
 * - READY_FOR_PICKUP is treated as a legacy alias.
 * - Unify all "ready" orders under READY to keep status logic unambiguous.
 *
 * Safety:
 * - Updates ONLY orders currently in READY_FOR_PICKUP → READY.
 * - Does not touch auth, schema, or any other statuses.
 */

const prisma = new PrismaClient();

async function main() {
  const result = await prisma.order.updateMany({
    where: { status: 'READY_FOR_PICKUP' },
    data: { status: 'READY' },
  });

  console.log(`Normalized ${result.count} order(s): READY_FOR_PICKUP → READY`);
}

main()
  .catch((e) => {
    console.error('Normalization error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

