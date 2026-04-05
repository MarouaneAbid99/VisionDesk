# Backfill legacy payment rows (deposit without `payments`)

## Goal

Some older orders have `orders.deposit > 0` but no rows in `payments`. The app now treats the **ledger** (`payments`) as the source of traceability. This script adds **one** `Payment` per affected order so:

`SUM(payments.amount)` matches `orders.deposit` for those orders.

## Safety

- **Idempotent**: if a payment already exists for an order, that order is **skipped**.
- **No order field changes**: does not update `total_price`, `deposit`, or `status`.
- **`created_by_id`**: uses the order’s `created_by_id` (creator of the order).
- **`created_at`**: aligned with `orders.created_at` for historical consistency.

## Before you run

1. **Backup the database** (full dump or snapshot).
2. Run on **staging** first if available.
3. Optional dry-run (count only):

```sql
SELECT COUNT(*) AS orders_to_fix
FROM orders o
WHERE o.deposit > 0
  AND NOT EXISTS (SELECT 1 FROM payments p WHERE p.order_id = o.id);
```

## Execution (MySQL CLI)

Replace user, host, database:

From the repository root (or adjust paths):

```bash
mysql -u YOUR_USER -p -h YOUR_HOST YOUR_DATABASE < apps/api/scripts/sql/backfill-legacy-deposit-payments.sql
```

If your shell is already in `apps/api`:

```bash
mysql -u YOUR_USER -p -h YOUR_HOST YOUR_DATABASE < scripts/sql/backfill-legacy-deposit-payments.sql
```

Or paste the file contents into your SQL client and run in a transaction (the script includes `START TRANSACTION` / `COMMIT`).

## Verify

```bash
mysql -u YOUR_USER -p -h YOUR_HOST YOUR_DATABASE < apps/api/scripts/sql/verify-payment-ledger-vs-deposit.sql
```

- **No rows** → ledger matches deposits (within 0.01 MAD).
- **Rows returned** → investigate before production (manual edits, old bugs, or orders updated without ledger).

## Rollback

If you must undo **only** the backfill rows (same session unlikely — use backup restore for production):

```sql
DELETE FROM payments WHERE notes = 'Backfill - initial deposit';
```

Only run if no legitimate payment used that exact note string.

## Related

- Runtime enforcement: `ordersService.addPayment` uses a DB transaction and requires an authenticated user.
- App-created initial deposits use note `Acompte initial` (new orders).
