-- VisionDesk: backfill Payment rows for legacy orders (deposit > 0, no payments).
-- Idempotent. Uses order creator as created_by_id. See docs/BACKFILL_PAYMENTS.md

START TRANSACTION;

INSERT INTO `payments` (
  `id`,
  `shop_id`,
  `order_id`,
  `amount`,
  `method`,
  `reference`,
  `notes`,
  `created_by_id`,
  `created_at`
)
SELECT
  UUID(),
  o.`shop_id`,
  o.`id`,
  o.`deposit`,
  NULL,
  NULL,
  'Backfill - initial deposit',
  o.`created_by_id`,
  o.`created_at`
FROM `orders` o
WHERE o.`deposit` > 0
  AND NOT EXISTS (
    SELECT 1 FROM `payments` p WHERE p.`order_id` = o.`id`
  );

COMMIT;
