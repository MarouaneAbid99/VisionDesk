import { PrismaClient } from '@prisma/client';

type ExistsRow = { count: bigint };
type ColumnRow = { column_name: string };

const prisma = new PrismaClient();

async function tableExists(schemaName: string, tableName: string): Promise<boolean> {
  const rows = await prisma.$queryRaw<ExistsRow[]>`
    SELECT COUNT(*) AS count
    FROM information_schema.tables
    WHERE table_schema = ${schemaName}
      AND table_name = ${tableName}
  `;
  return Number(rows[0]?.count ?? 0) > 0;
}

async function getColumns(schemaName: string, tableName: string): Promise<Set<string>> {
  const rows = await prisma.$queryRaw<ColumnRow[]>`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = ${schemaName}
      AND table_name = ${tableName}
  `;
  return new Set(rows.map((r) => r.column_name));
}

async function main() {
  const [{ dbName }] = await prisma.$queryRaw<{ dbName: string }[]>`SELECT DATABASE() AS dbName`;
  if (!dbName) {
    throw new Error('No active database selected (DATABASE() returned NULL).');
  }

  const required = {
    tables: ['payments', 'orders'],
    ordersColumns: ['payment_status', 'paid_at'],
    paymentsColumns: ['id', 'shop_id', 'order_id', 'amount', 'created_by_id', 'created_at'],
  };

  const checks: Array<{ check: string; ok: boolean; details?: string }> = [];

  const paymentsTable = await tableExists(dbName, 'payments');
  const ordersTable = await tableExists(dbName, 'orders');

  checks.push({
    check: 'Table exists: payments',
    ok: paymentsTable,
  });
  checks.push({
    check: 'Table exists: orders',
    ok: ordersTable,
  });

  let ordersColumns = new Set<string>();
  let paymentsColumns = new Set<string>();

  if (ordersTable) {
    ordersColumns = await getColumns(dbName, 'orders');
  }
  if (paymentsTable) {
    paymentsColumns = await getColumns(dbName, 'payments');
  }

  for (const col of required.ordersColumns) {
    checks.push({
      check: `Column exists: orders.${col}`,
      ok: ordersColumns.has(col),
    });
  }

  for (const col of required.paymentsColumns) {
    checks.push({
      check: `Column exists: payments.${col}`,
      ok: paymentsColumns.has(col),
    });
  }

  const failed = checks.filter((c) => !c.ok);

  console.log(`\nPayment schema verification (database: ${dbName})`);
  console.log('------------------------------------------------');
  for (const c of checks) {
    console.log(`${c.ok ? 'PASS' : 'FAIL'}  ${c.check}${c.details ? ` (${c.details})` : ''}`);
  }
  console.log('------------------------------------------------');
  if (failed.length === 0) {
    console.log('RESULT: PASS - all required payment-related schema pieces exist.');
    process.exit(0);
  } else {
    console.log(`RESULT: FAIL - ${failed.length} required checks missing.`);
    process.exit(1);
  }
}

main()
  .catch((error) => {
    console.error('Verification error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

