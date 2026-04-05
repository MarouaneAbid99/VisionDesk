-- Mismatches: deposit vs sum(payments). Expect 0 rows after backfill + normal use.

SELECT
  o.`id`,
  o.`order_number`,
  o.`deposit` AS order_deposit,
  COALESCE(SUM(p.`amount`), 0) AS sum_payments,
  ABS(o.`deposit` - COALESCE(SUM(p.`amount`), 0)) AS diff
FROM `orders` o
LEFT JOIN `payments` p ON p.`order_id` = o.`id`
GROUP BY o.`id`, o.`order_number`, o.`deposit`
HAVING ABS(o.`deposit` - COALESCE(SUM(p.`amount`), 0)) > 0.01
ORDER BY diff DESC;
