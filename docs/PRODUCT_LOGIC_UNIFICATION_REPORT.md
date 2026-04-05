# PRODUCT LOGIC UNIFICATION REPORT

**Date:** March 25, 2026  
**Phase:** Critical Product Logic Unification  
**Status:** ✅ COMPLETED

---

## 1. BUSINESS LOGIC TABLE

### Order Status Definitions

| Status | French Label | Category | Active? | Atelier? | Completed? |
|--------|-------------|----------|---------|----------|------------|
| `DRAFT` | Brouillon | Not started | ❌ | ❌ | ❌ |
| `CONFIRMED` | Confirmée | En attente | ✅ | ✅ (pending) | ❌ |
| `IN_ATELIER` | En atelier | En cours | ✅ | ✅ (active) | ❌ |
| `READY` | Prête | À retirer | ✅ | ❌ | ❌ |
| `READY_FOR_PICKUP` | À retirer | À retirer | ✅ | ❌ | ❌ |
| `PICKED_UP` | Retirée | Completed | ❌ | ❌ | ✅ |
| `DELIVERED` | Livrée | Completed | ❌ | ❌ | ✅ |
| `CANCELLED` | Annulée | Closed | ❌ | ❌ | ❌ |

### Category Definitions

| Category | Statuses Included | Description |
|----------|-------------------|-------------|
| **Active Orders** | CONFIRMED, IN_ATELIER, READY, READY_FOR_PICKUP | Orders currently in progress |
| **Pending Orders** | CONFIRMED | Orders waiting to enter atelier |
| **Atelier Workload** | CONFIRMED, IN_ATELIER | Orders in atelier pipeline |
| **Ready for Pickup** | READY, READY_FOR_PICKUP | Orders waiting for client |
| **Completed Orders** | PICKED_UP, DELIVERED | Fulfilled orders |
| **Closed Orders** | PICKED_UP, DELIVERED, CANCELLED | No longer active |

### Atelier Status Mapping (Derived from Order Status)

| Order Status | Atelier Display Status |
|--------------|----------------------|
| CONFIRMED | PENDING (En attente) |
| IN_ATELIER | IN_PROGRESS (En cours) |
| READY | READY (Prêt) |

**Key Principle:** Order.status is the SINGLE SOURCE OF TRUTH. Atelier status is always derived from it.

---

## 2. DASHBOARD SECTION AUDIT

### Sections Analyzed

| Section | Purpose | Status | Action Taken |
|---------|---------|--------|--------------|
| **Actions prioritaires** | Critical alerts (overdue, blocked) | ✅ Kept | Uses correct alert logic |
| **Quick Stats Row** | RDV, Stock bas, Aujourd'hui | ✅ Kept | Informational metrics |
| **CommandesHub** | Main orders control center | ✅ Fixed | Now uses correct counts |
| **Business Intelligence** | Revenue, analytics | ✅ Kept | Business metrics |
| **Charge Atelier** | Atelier workload summary | ✅ Fixed | Uses unified logic |
| **Actions Rapides** | Quick action buttons | ✅ Kept | Navigation shortcuts |
| **Meilleures Ventes** | Best sellers | ✅ Kept | Analytics |
| **Commandes récentes** | Recent order activity | ✅ Fixed | Excludes CANCELLED |
| **Rendez-vous aujourd'hui** | Today's appointments | ✅ Kept | Relevant info |
| **File atelier** | Atelier queue list | ❌ **REMOVED** | Redundant with Charge Atelier |
| **Alertes stock** | Low stock warnings | ✅ Kept | Important alerts |

### Redundancy Removed

**"File atelier" section was REMOVED** because:
- It duplicated information already shown in "Charge Atelier" card
- Both showed atelier queue with similar data
- Created visual clutter and confusion
- "Charge Atelier" card provides better summary with counts

---

## 3. COMMANDES LOGIC FIXES

### Before (Problems)

```
CommandesHub received:
- totalOrders = analytics.totalOrders (ALL orders ever - WRONG)
- pendingOrders = ordersToday - ordersReady (nonsensical calculation)
- "En cours" showed total historical orders, not active ones
```

### After (Fixed)

```
CommandesHub now receives:
- activeOrders = summary.activeOrders (CONFIRMED + IN_ATELIER + READY + READY_FOR_PICKUP)
- pendingOrders = summary.ordersPending (CONFIRMED only)
- "En cours" shows only truly active orders
```

### Count Definitions

| Metric | Old Logic | New Logic |
|--------|-----------|-----------|
| **En cours** | All orders ever | CONFIRMED + IN_ATELIER + READY + READY_FOR_PICKUP |
| **En attente** | ordersToday - ordersReady | CONFIRMED only |
| **Prêtes** | READY only | READY + READY_FOR_PICKUP |
| **En atelier** | IN_ATELIER | IN_ATELIER (unchanged) |

### Filter Alignment

OrdersListScreen filters now include all statuses:
- Toutes, Brouillons, Confirmées, En atelier, Prêtes, À retirer, Retirées, Livrées, Annulées

---

## 4. ATELIER LOGIC FIXES

### Visibility Rules

**Orders visible in Atelier module:**
- `CONFIRMED` - Pending, waiting to start
- `IN_ATELIER` - Currently being worked on

**Orders NOT visible in Atelier:**
- `READY` - Work completed, waiting for pickup
- `PICKED_UP` - Already collected
- `DELIVERED` - Already delivered
- `CANCELLED` - Cancelled

### Atelier Queue Fix

```typescript
// OLD: Filtered by AtelierJob.status
where: { status: { in: ['PENDING', 'IN_PROGRESS', 'BLOCKED'] } }

// NEW: Filtered by Order.status (source of truth)
where: { order: { status: { in: ['CONFIRMED', 'IN_ATELIER'] } } }
```

### Workload Calculation

| Metric | Definition |
|--------|------------|
| **Atelier Workload** | Count of orders with status CONFIRMED or IN_ATELIER |
| **En attente** | CONFIRMED orders (waiting to start) |
| **En cours** | IN_ATELIER orders (being worked on) |
| **Prêts** | READY orders (work completed) |

---

## 5. DATA CONSISTENCY FIXES

### Delivered/Completed Orders Handling

**Rule:** DELIVERED and PICKED_UP orders are COMPLETED and must NOT:
- Appear in "En cours" counts
- Appear in active workload metrics
- Appear in atelier queue
- Inflate dashboard operational metrics

### Active Workload Calculation

```typescript
// Correct active orders query
const activeOrders = await prisma.order.count({
  where: { 
    shopId, 
    status: { in: ['CONFIRMED', 'IN_ATELIER', 'READY', 'READY_FOR_PICKUP'] }
  }
});
```

### Recent Orders

- Now excludes CANCELLED orders from recent activity
- Shows meaningful recent activity, not noise

---

## 6. FILES MODIFIED

### API (Backend)

| File | Changes |
|------|---------|
| `apps/api/src/lib/businessLogic.ts` | **NEW** - Unified business logic constants |
| `apps/api/src/modules/desk/desk.service.ts` | Fixed all counts, imports unified logic |
| `apps/api/src/modules/atelier/atelier.service.ts` | Imports unified logic constants |

### Mobile (Frontend)

| File | Changes |
|------|---------|
| `apps/mobile/src/types/index.ts` | Updated DeskSummary interface |
| `apps/mobile/src/components/desk/CommandesHub.tsx` | Fixed props, uses correct counts |
| `apps/mobile/src/screens/desk/DeskScreen.tsx` | Uses new API fields, removed redundant section |
| `apps/mobile/src/screens/orders/OrdersListScreen.tsx` | Added missing status filters |

---

## 7. FINAL RESULT

### ✅ What Was Achieved

1. **Single Source of Truth** - All status logic defined in `businessLogic.ts`
2. **Correct Counts** - "En cours" now shows only active orders, not all historical orders
3. **Unified Categories** - Same definitions used across API, mobile, and all components
4. **No Redundancy** - Removed duplicate "File atelier" section
5. **Data Integrity** - DELIVERED/CANCELLED orders no longer inflate active metrics
6. **Atelier Consistency** - Queue filtered by Order.status, not AtelierJob.status
7. **Complete Filters** - OrdersListScreen now includes all status options

### ✅ Business Logic Now Coherent

| Before | After |
|--------|-------|
| "17 en cours" included delivered orders | "En cours" = only active orders |
| "En attente" = random calculation | "En attente" = CONFIRMED only |
| Atelier showed completed orders | Atelier shows only CONFIRMED + IN_ATELIER |
| Duplicate sections | Clean, non-redundant layout |
| Inconsistent definitions | Single businessLogic.ts source |

### Remaining Considerations

1. **READY vs READY_FOR_PICKUP** - Both are treated as "ready for pickup" but are separate statuses. Consider consolidating if business doesn't need distinction.

2. **Testing Required** - After deployment, verify:
   - Dashboard counts match database reality
   - Atelier queue shows only active jobs
   - Filters work correctly on Orders page
   - No delivered orders appear in active sections

---

## VERIFICATION CHECKLIST

- [ ] Open Desk - counts should reflect only active orders
- [ ] Compare "En cours" count vs actual CONFIRMED+IN_ATELIER+READY orders
- [ ] Open Commandes - filters should match dashboard counts
- [ ] Open Atelier - only CONFIRMED and IN_ATELIER orders visible
- [ ] Verify DELIVERED orders don't appear in any active section
- [ ] Verify CANCELLED orders don't appear in recent activity
- [ ] Verify "En attente" shows only CONFIRMED orders
- [ ] Verify "Prêtes" shows READY + READY_FOR_PICKUP orders

---

**The app now follows ONE coherent business logic across all operational sections.**
