-- ============================================
-- DATA CLEANUP: Orders ↔ Atelier Synchronization
-- Run this script ONCE to fix existing data
-- ============================================

-- 1. Show orphan AtelierJobs (orders that are PICKED_UP, DELIVERED, or CANCELLED)
-- These should NOT appear in Atelier anymore (handled by new query filter)
SELECT 
  aj.id AS atelier_job_id,
  o.order_number,
  o.status AS order_status,
  aj.status AS atelier_status
FROM atelier_jobs aj
JOIN orders o ON aj.order_id = o.id
WHERE o.status IN ('PICKED_UP', 'DELIVERED', 'CANCELLED');

-- 2. Show status mismatches (AtelierJob status doesn't match Order status)
-- Expected mappings:
--   Order CONFIRMED -> Atelier PENDING
--   Order IN_ATELIER -> Atelier IN_PROGRESS  
--   Order READY -> Atelier READY
SELECT 
  aj.id AS atelier_job_id,
  o.order_number,
  o.status AS order_status,
  aj.status AS atelier_status,
  CASE 
    WHEN o.status = 'CONFIRMED' THEN 'PENDING'
    WHEN o.status = 'IN_ATELIER' THEN 'IN_PROGRESS'
    WHEN o.status = 'READY' THEN 'READY'
    ELSE 'N/A'
  END AS expected_atelier_status
FROM atelier_jobs aj
JOIN orders o ON aj.order_id = o.id
WHERE o.status IN ('CONFIRMED', 'IN_ATELIER', 'READY')
AND aj.status != CASE 
    WHEN o.status = 'CONFIRMED' THEN 'PENDING'
    WHEN o.status = 'IN_ATELIER' THEN 'IN_PROGRESS'
    WHEN o.status = 'READY' THEN 'READY'
  END;

-- 3. Fix BLOCKED status -> convert to IN_PROGRESS (mapped to IN_ATELIER order status)
-- Note: With new architecture, status is derived from Order, but we clean up old data
UPDATE atelier_jobs aj
JOIN orders o ON aj.order_id = o.id
SET aj.status = 'IN_PROGRESS'
WHERE aj.status = 'BLOCKED';

-- 4. Sync Order status from AtelierJob status for active jobs
-- This ensures Order status matches the Atelier display
-- PENDING -> CONFIRMED (if order was incorrectly set)
UPDATE orders o
JOIN atelier_jobs aj ON o.id = aj.order_id
SET o.status = 'CONFIRMED'
WHERE aj.status = 'PENDING' 
AND o.status NOT IN ('CONFIRMED', 'PICKED_UP', 'DELIVERED', 'CANCELLED');

-- IN_PROGRESS -> IN_ATELIER
UPDATE orders o
JOIN atelier_jobs aj ON o.id = aj.order_id
SET o.status = 'IN_ATELIER'
WHERE aj.status = 'IN_PROGRESS'
AND o.status NOT IN ('IN_ATELIER', 'READY', 'PICKED_UP', 'DELIVERED', 'CANCELLED');

-- READY -> READY
UPDATE orders o
JOIN atelier_jobs aj ON o.id = aj.order_id
SET o.status = 'READY', o.ready_at = COALESCE(o.ready_at, aj.completed_at, NOW())
WHERE aj.status = 'READY'
AND o.status NOT IN ('READY', 'PICKED_UP', 'DELIVERED', 'CANCELLED');

-- 5. Verification: Count jobs by status after cleanup
SELECT 
  o.status AS order_status,
  COUNT(*) AS count
FROM atelier_jobs aj
JOIN orders o ON aj.order_id = o.id
GROUP BY o.status
ORDER BY 
  CASE o.status
    WHEN 'CONFIRMED' THEN 1
    WHEN 'IN_ATELIER' THEN 2
    WHEN 'READY' THEN 3
    WHEN 'PICKED_UP' THEN 4
    WHEN 'DELIVERED' THEN 5
    WHEN 'CANCELLED' THEN 6
    ELSE 7
  END;

-- 6. Final verification: Jobs that should NOT appear in Atelier
-- (This query should return 0 rows after the new backend filter is applied)
SELECT COUNT(*) AS orphan_jobs_count
FROM atelier_jobs aj
JOIN orders o ON aj.order_id = o.id
WHERE o.status NOT IN ('CONFIRMED', 'IN_ATELIER', 'READY');
