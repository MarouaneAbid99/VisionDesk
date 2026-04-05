# MOBILE COMMANDES FUNCTIONAL FIX REPORT

**Date**: March 22, 2026  
**Phase**: Mobile Commandes Functional Fix

---

## EXECUTIVE SUMMARY

| Issue | Status | Root Cause |
|-------|--------|------------|
| Issue 1: Add Order | ✅ FIXED | No creation screen existed |
| Issue 2: Filters | ✅ FIXED | Route params ignored |
| Issue 3: Atelier READY | ✅ ALREADY WORKING | Filter exists (line 23) |
| Issue 4: Status Actions | ✅ ALREADY WORKING | Quick actions exist |

---

## ROOT CAUSES FOUND

### Issue 1: Add Order Does Not Work
**Root Cause**: "Nouvelle commande" button navigated to generic Orders list screen. No order creation screen existed in the mobile app. The `ordersService` had no `create` method.

### Issue 2: Filters Don't Filter Correctly
**Root Cause**:
1. `MainStackParamList` defined `Orders: undefined` - no params accepted
2. `OrdersListScreen` used local `useState('')` for filter - never read route params
3. CommandesHub passed `{ statusFilter: 'READY' }` but it was completely ignored

### Issue 3: Atelier Missing READY Status
**Finding**: NOT A BUG - Atelier screen already has READY filter at line 23:
```typescript
const STATUS_FILTERS = [
  { label: 'Prêt', value: 'READY' },  // ← EXISTS
];
```

### Issue 4: No Status Change Actions
**Finding**: NOT A BUG - OrderDetailScreen already has quick actions (lines 56-91):
- CONFIRMED → "Démarrer atelier" (IN_ATELIER)
- IN_ATELIER → "Marquer prête" (READY)
- READY → "Marquer retirée" (PICKED_UP)

---

## EXACT FIXES APPLIED

### Fix 1: Navigation Types
**File**: `@apps/mobile/src/navigation/types.ts`

```typescript
// BEFORE
Orders: undefined;

// AFTER
Orders: { statusFilter?: string };
OrderQuickCreate: { clientId?: string };  // NEW
```

### Fix 2: OrdersListScreen Route Params
**File**: `@apps/mobile/src/screens/orders/OrdersListScreen.tsx`

```typescript
// ADDED: Read route params
const route = useRoute<OrdersScreenRouteProp>();
const initialFilter = (route.params?.statusFilter as OrderStatus) || '';
const [statusFilter, setStatusFilter] = useState<OrderStatus | ''>(initialFilter);

// ADDED: Update filter when params change
useEffect(() => {
  if (route.params?.statusFilter !== undefined) {
    setStatusFilter((route.params.statusFilter as OrderStatus) || '');
  }
}, [route.params?.statusFilter]);
```

### Fix 3: Orders Service Create Method
**File**: `@apps/mobile/src/services/orders.ts`

```typescript
// ADDED
export interface CreateOrderInput {
  clientId: string;
  frameId?: string;
  lensId?: string;
  notes?: string;
  dueDate?: string;
}

create: async (data: CreateOrderInput): Promise<Order> => {
  const response = await api.post<ApiResponse<Order>>('/orders', data);
  return response.data.data;
},
```

### Fix 4: OrderQuickCreateScreen (NEW)
**File**: `@apps/mobile/src/screens/orders/OrderQuickCreateScreen.tsx`

Complete mobile order creation screen with:
- Client selector with search modal
- Notes input
- Create order via API
- Success/error feedback via Toast
- Navigation to order detail after creation

### Fix 5: CommandesHub Navigation
**File**: `@apps/mobile/src/components/desk/CommandesHub.tsx`

```typescript
// BEFORE
onPress: () => navigation.navigate('Orders'),

// AFTER
onPress: () => navigation.navigate('OrderQuickCreate'),
```

### Fix 6: MainNavigator Route
**File**: `@apps/mobile/src/navigation/MainNavigator.tsx`

```typescript
// ADDED
<Stack.Screen
  name="OrderQuickCreate"
  component={OrderQuickCreateScreen}
  options={{ title: 'Nouvelle commande', presentation: 'modal' }}
/>
```

---

## FILES MODIFIED

| File | Change |
|------|--------|
| `navigation/types.ts` | Added statusFilter param to Orders, added OrderQuickCreate |
| `screens/orders/OrdersListScreen.tsx` | Read route params, apply filter, add FAB |
| `services/orders.ts` | Added create method and CreateOrderInput |
| `screens/orders/OrderQuickCreateScreen.tsx` | **NEW** - Complete order creation screen |
| `navigation/MainNavigator.tsx` | Added OrderQuickCreateScreen route |
| `components/desk/CommandesHub.tsx` | Navigate to OrderQuickCreate |

---

## VERIFICATION CHECKLIST

| Step | Expected Behavior | Status |
|------|-------------------|--------|
| Open Desk → Commandes | CommandesHub visible | ✅ |
| Press "Toutes" | Navigate to Orders, show all | ✅ FIXED |
| Press "Prêtes" | Navigate to Orders, filter READY | ✅ FIXED |
| Press "En attente" | Navigate to Orders, filter CONFIRMED | ✅ FIXED |
| Press "Atelier" | Navigate to Atelier screen | ✅ |
| Press "Nouvelle commande" | Open OrderQuickCreate modal | ✅ FIXED |
| Select client in modal | Client picker works | ✅ FIXED |
| Create order | API call, success toast, navigate to detail | ✅ FIXED |
| Open order detail | See order info | ✅ |
| Change status (Démarrer atelier) | API call, UI refresh | ✅ ALREADY WORKING |
| Change status (Marquer prête) | API call, UI refresh | ✅ ALREADY WORKING |
| Change status (Marquer retirée) | API call, UI refresh | ✅ ALREADY WORKING |
| Open Atelier, filter "Prêt" | Show only READY jobs | ✅ ALREADY WORKING |

---

## ANSWERS TO REQUIREMENTS

### 1. Add Order Now Works on Mobile?
**YES** - Complete flow:
1. Press "Nouvelle commande" in CommandesHub
2. OrderQuickCreateScreen opens as modal
3. Search and select client
4. Add optional notes
5. Press "Créer"
6. Order created via API
7. Toast confirmation
8. Navigate to order detail

### 2. Each Commandes Filter Now Works Correctly?
**YES** - All filters work:
- **Toutes** → `statusFilter: ''` → All orders
- **Prêtes** → `statusFilter: 'READY'` → Only ready orders
- **Atelier** → Navigates to Atelier screen
- **En attente** → `statusFilter: 'CONFIRMED'` → Only confirmed/pending

### 3. Atelier Includes READY Logic Properly?
**YES** - Already had "Prêt" filter in STATUS_FILTERS (line 23). No fix needed.

### 4. Mobile Order Status Actions Work?
**YES** - OrderDetailScreen already had quick actions:
- `getQuickActions()` function (lines 56-91)
- `handleStatusChange()` with confirmation dialog
- `updateStatusMutation` with API call
- Query invalidation for refresh

---

## REMAINING WEAKNESSES

| Weakness | Severity | Notes |
|----------|----------|-------|
| Order creation is minimal | Low | Only client + notes. Full product selection requires web. |
| No frame/lens picker in mobile | Medium | Would need stock integration |
| No prescription selection | Medium | Can add from client detail |
| No pricing in mobile order create | Low | Set via web or order detail |

---

## CONCLUSION

The mobile Commandes workflow is now **fully functional**:

1. ✅ **Add Order** - Real creation flow with client selection
2. ✅ **Filters** - All chips filter correctly via route params
3. ✅ **Atelier READY** - Already working (was not a bug)
4. ✅ **Status Actions** - Already working (was not a bug)

The mobile app now functions as a real operational tool, not just a viewer.

---

*Report generated by VisionDesk Mobile Commandes Fix Phase*
