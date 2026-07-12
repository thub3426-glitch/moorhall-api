# Dynamic Menu Implementation - Technical Architecture

## Overview
This document details the implementation of a production-ready, database-driven dynamic menu system for the Moor Hall Restaurant public home page. The system ensures zero hardcoded data, real-time database synchronization, and optimal performance through intelligent caching.

---

## Architecture Overview

### Technology Stack
- **Backend**: Node.js/Express + TypeScript
- **Database**: PostgreSQL (via Prisma ORM)
- **Caching**: Redis (with graceful fallback if unavailable)
- **Frontend**: React + Redux Toolkit
- **API Protocol**: RESTful JSON

### System Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                      USER'S BROWSER                              │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │           DynamicMenu React Component                      │ │
│  │  - Dispatch fetchHomePageMenu() on mount                  │ │
│  │  - Display loading/error/content states                   │ │
│  │  - Lazy load images for performance                       │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                            │
                            │ HTTP GET
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│                    FRONTEND API LAYER                            │
│  Redux Thunk: fetchHomePageMenu()                               │
│  Endpoint: GET /api/v1/menu-items/public/home                  │
└─────────────────────────────────────────────────────────────────┘
                            │
                            │ HTTP Request
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│                    BACKEND LAYER                                 │
│                                                                  │
│  Routes: /api/v1/menu-items/public/home                        │
│  Controller: getHomePageMenu()                                  │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │              CACHE LAYER (Redis)                        │  │
│  │  - Key: v1:home:menu:full                              │  │
│  │  - TTL: 3600 seconds (1 hour)                          │  │
│  │  - On Cache HIT: Return cached data (fast)             │  │
│  │  - On Cache MISS: Query database                       │  │
│  └─────────────────────────────────────────────────────────┘  │
│           ↓ (if cache miss)                                     │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │         DATABASE QUERY LAYER (Prisma)                  │  │
│  │  Service: getHomePageMenu()                            │  │
│  │                                                          │  │
│  │  1. Fetch all ACTIVE categories (displayOrder ASC)     │  │
│  │  2. Include AVAILABLE items per category               │  │
│  │  3. Filter empty categories                            │  │
│  │  4. Normalize prices (Decimal → Number)                │  │
│  │  5. Return hierarchical structure                       │  │
│  └─────────────────────────────────────────────────────────┘  │
│           ↓                                                      │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │         DATABASE (PostgreSQL)                           │  │
│  │  Tables:                                                │  │
│  │  - MenuCategory (id, name, displayOrder, isActive)     │  │
│  │  - MenuItem (id, categoryId, name, price, isAvailable) │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                  │
│  CACHE INVALIDATION HOOKS:                                      │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  Triggered on:                                          │  │
│  │  - createMenuItem() → invalidate 'menu:items' tag       │  │
│  │  - updateMenuItem() → invalidate + delete specific key  │  │
│  │  - toggleAvailability() → invalidate + delete specific  │  │
│  │  - deleteMenuItem() → invalidate + delete specific      │  │
│  └─────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Backend Implementation

### 1. Database Schema (Prisma)

#### MenuCategory Model
```prisma
model MenuCategory {
  id           Int          @id @default(autoincrement())
  name         String       @unique
  slug         String       @unique
  description  String?
  type         CategoryType
  displayOrder Int          @default(0)      # Controls display sequence
  isActive     Boolean      @default(true)   # Controls visibility
  createdAt    DateTime     @default(now())
  updatedAt    DateTime     @updatedAt

  items MenuItem[]
}
```

#### MenuItem Model
```prisma
model MenuItem {
  id               Int         @id @default(autoincrement())
  categoryId       Int
  name             String
  slug             String      @unique
  shortDescription String?
  description      String?
  productType      ProductType
  price            Decimal     @db.Decimal(10, 2)
  imageUrl         String?
  images           Json?       # Array of additional images
  isAvailable      Boolean     @default(true)   # Hidden from public if false
  isFeatured       Boolean     @default(false)  # Visual highlighting
  preparationTime  Int?        # Minutes to prepare
  sku              String?     @unique
  createdAt        DateTime    @default(now())
  updatedAt        DateTime    @updatedAt

  category   MenuCategory @relation(fields: [categoryId], references: [id])
  orderItems OrderItem[]

  @@index([categoryId])
  @@index([isAvailable])
}
```

### 2. Redis Cache Service

**File**: `src/services/cache.service.ts`

**Features**:
- Automatic TTL management (default 1 hour)
- Tag-based invalidation for bulk operations
- Graceful degradation if Redis unavailable
- Memory-efficient JSON serialization
- Error logging without blocking requests

**Cache Keys**:
```typescript
cacheKeys = {
  homePageMenu: () => 'v1:home:menu:full',
  publicMenuItems: (categoryId?, productType?) => 'v1:menu:public:cat:X:type:Y',
  menuItemById: (id) => 'v1:menu:item:X',
  menuCategories: () => 'v1:menu:categories:all',
  menuCategoryWithItems: (id) => 'v1:menu:cat:X:items',
}

cacheTags = {
  menuItems: 'menu:items',
  menuCategories: 'menu:categories',
  homePageMenu: 'home:menu',
}
```

### 3. Menu Service Layer

**File**: `src/services/menuItem.service.ts`

**Public Methods** (no auth required):

#### `getHomePageMenu()`
```typescript
/**
 * Returns complete menu organized by active categories
 * - Only includes active categories (isActive = true)
 * - Only includes available items (isAvailable = true)
 * - Sorted by category displayOrder
 * - Items sorted alphabetically within each category
 * - Prices normalized from Decimal to Number
 */
Response Structure:
[
  {
    id: number,
    name: string,
    slug: string,
    description?: string,
    type: CategoryType,
    displayOrder: number,
    items: [
      {
        id: number,
        name: string,
        price: number,
        imageUrl?: string,
        isAvailable: boolean,
        isFeatured: boolean,
        preparationTime?: number,
        // ... all other fields
      }
    ]
  }
]
```

#### `getCategoryWithItems(categoryId: number)`
Returns a specific category with its available items, useful for category-specific pages.

#### `getActiveCategories()`
Returns minimal category data (no items) for navigation/filtering.

### 4. Controller Layer

**File**: `src/controllers/menuItem.controller.ts`

#### `getHomePageMenu(req, res)`
```
1. Extract cache key: cacheKeys.homePageMenu()
2. Try cache.get(cacheKey)
3. If FOUND: return cached data + 200 OK
4. If NOT FOUND:
   a. Call menuItemService.getHomePageMenu()
   b. Store in cache with TTL=3600s and tags
   c. Return fresh data + 200 OK
5. On ERROR: return 500 with error message
```

**Response Format**:
```json
{
  "success": true,
  "data": [...categories],
  "message": "Home page menu retrieved successfully",
  "meta": {
    "categories": 5,
    "items": 47
  }
}
```

### 5. Cache Invalidation Strategy

**Implemented in**: Menu item update/create/delete endpoints

**Trigger Points**:
```
createMenuItem()
  ↓
  await cacheService.invalidateTag('menu:items')
  await cacheService.invalidateTag('home:menu')
  
updateMenuItem()
  ↓
  await cacheService.invalidateTag('menu:items')
  await cacheService.invalidateTag('home:menu')
  await cacheService.del(cacheKeys.menuItemById(id))
  
toggleAvailability()
  ↓
  await cacheService.invalidateTag('menu:items')
  await cacheService.invalidateTag('home:menu')
  
deleteMenuItem()
  ↓
  await cacheService.invalidateTag('menu:items')
  await cacheService.invalidateTag('home:menu')
```

**Result**: Menu cache is automatically refreshed within seconds of any database changes.

### 6. API Endpoints

| Endpoint | Method | Auth | Description | Cache |
|----------|--------|------|-------------|-------|
| `/api/v1/menu-items/public/home` | GET | None | Home page menu (hierarchical) | 1 hour |
| `/api/v1/menu-items/public/categories` | GET | None | All active categories | 1 hour |
| `/api/v1/menu-items/public/categories/:id` | GET | None | Category with items | 1 hour |
| `/api/v1/menu-items/:id` | GET | None | Individual menu item | 1 hour |
| `/api/v1/menu-items` | GET | None | Public menu items (flat) | 1 hour |

---

## Frontend Implementation

### 1. Redux State Management

**File**: `src/redux/slices/menuSlice.ts`

**State Structure**:
```typescript
interface MenuState {
  homePageMenu: HomePageMenuCategory[];
  homePageMenuLoading: boolean;
  homePageMenuError: string | null;
  // ... other menu state
}

interface HomePageMenuCategory {
  id: number;
  name: string;
  slug: string;
  description?: string;
  type: string;
  displayOrder: number;
  items: MenuItem[];
}
```

**Thunk**: `fetchHomePageMenu()`
```typescript
export const fetchHomePageMenu = createAsyncThunk(
  'menu/fetchHomePageMenu',
  async (_, { rejectWithValue }) => {
    const response = await fetch('/api/v1/menu-items/public/home')
    // Handle errors
    // Return data.data or throw rejectWithValue
  }
)
```

**Reducer Cases**:
```typescript
.addCase(fetchHomePageMenu.pending, state => {
  state.homePageMenuLoading = true
  state.homePageMenuError = null
})
.addCase(fetchHomePageMenu.fulfilled, (state, action) => {
  state.homePageMenuLoading = false
  state.homePageMenu = action.payload
})
.addCase(fetchHomePageMenu.rejected, (state, action) => {
  state.homePageMenuLoading = false
  state.homePageMenuError = action.payload
})
```

### 2. DynamicMenu Component

**File**: `src/components/menu/DynamicMenu.tsx`

**Features**:
- ✅ Auto-fetches menu on mount via Redux thunk
- ✅ Loading state with spinner animation
- ✅ Error state with retry button and troubleshooting guide
- ✅ Empty state message
- ✅ Responsive grid layout (1-4 columns)
- ✅ Lazy image loading for performance
- ✅ Image error fallback (hides broken images)
- ✅ Featured item badges
- ✅ Unavailable item styling
- ✅ Preparation time display
- ✅ Order buttons (integrated for next phase)
- ✅ Database refresh timestamp

**Component Props**: None (all data from Redux)

**Performance Optimizations**:
- Lazy loading images: `loading="lazy"` attribute
- CSS containment for rendering performance
- Memoization-ready (can add React.memo)
- Proper event handling (no inline functions)

**Error Handling**:
```typescript
if (loading) → Show spinner
if (error) → Show error with retry button + troubleshooting
if (empty) → Show empty state message
else → Show menu
```

### 3. Styling

**File**: `src/components/menu/DynamicMenu.css`

**Key Styles**:
- Gold (#D4A017) accent color matching brand
- Responsive grid with CSS Grid
- Hover effects on cards
- Featured product highlighting
- Availability state indication
- Mobile-first responsive design
- Smooth animations and transitions

---

## Performance Optimization

### 1. Database Query Optimization

**Indexes**:
```sql
MenuCategory: (isActive, displayOrder)
MenuItem: (isAvailable, categoryId), (isAvailable)
```

**Query Strategy**:
- Single query with relations (no N+1)
- Eager loading: `include: { items: {...} }`
- Filtered at database level (WHERE clauses)
- Sorted at database level (ORDER BY)

**Expected Query Time**: 5-50ms (without cache)

### 2. Caching Strategy

**TTL**: 3600 seconds (1 hour)
**Cache Hit Ratio**: Expected 95%+ after first load
**Cache Size**: ~10-50KB per entry (depends on menu size)

**Memory Calculation**:
- Menu item: ~500 bytes
- With 50 items: ~25KB cached
- With 10 categories: Negligible overhead

### 3. API Response Compression

- GZIP enabled on Express middleware
- JSON response size: ~20-30KB (50-100 items)
- Compressed: ~2-5KB over network

### 4. Frontend Performance

**Rendering**:
- React reconciliation: O(n) where n = number of items
- CSS containment prevents full page reflows
- Images lazy-loaded (no blocking)

**Bundle Impact**:
- DynamicMenu component: ~5KB
- CSS: ~3KB
- Redux integration: Already present

**Load Time Targets**:
- First paint: <1s (with cache)
- Full menu render: <2s (with cache + image load)
- Without cache: <3s (DB query + serialization)

---

## Error Handling & Resilience

### 1. Database Connectivity

**Scenario**: Database unavailable
- Response: 500 error with message
- Frontend: Shows error message + retry button
- User Experience: Clear feedback, can retry

### 2. Redis Cache Unavailable

**Scenario**: Redis not running or network failure
- Fallback: All queries hit database directly
- Performance: Slightly slower (no caching)
- Functionality: Fully operational
- Logging: Warnings logged, alerts available

### 3. Network Request Failure

**Scenario**: User disconnects or request times out
- Frontend: Dispatch rejects with error
- Redux State: Updates error field
- User Experience: Error component with retry

### 4. Invalid Data

**Scenario**: Missing fields or unexpected format
- Validation: Prisma schema enforces types
- Normalization: normalizeMenuItem() handles edge cases
- Logging: Errors logged to monitoring system

---

## Monitoring & Debugging

### 1. Cache Monitoring

```typescript
// Get cache statistics
const stats = await cacheService.getStats()
// Returns: { keys: 150, memory: "2.3MB" }
```

### 2. Debug Logs

**Backend**:
```
[Cache HIT] v1:home:menu:full
[Cache MISS] v1:menu:item:42
[Cache INVALIDATED] menu:items tag (5 keys)
[DB QUERY] getHomePageMenu() - 23ms
```

**Frontend** (Redux DevTools):
- Action: `menu/fetchHomePageMenu/pending`
- Action: `menu/fetchHomePageMenu/fulfilled` with payload
- Can replay actions and inspect state changes

### 3. Performance Metrics

Track in analytics:
- Page load time
- Menu render time
- Time to first paint
- Cache hit ratio
- API response times
- Error rate

---

## Deployment Checklist

### Prerequisites
- [x] Redis server configured (or graceful fallback enabled)
- [x] Database migrations applied
- [x] Environment variables set:
  - `DATABASE_URL`
  - `REDIS_URL` (optional)
  - `CORS_ORIGINS`

### Backend Deployment
- [x] Verify cache service handles Redis failures
- [x] Enable request logging/monitoring
- [x] Configure error tracking
- [x] Set appropriate cache TTL for load

### Frontend Deployment
- [x] Redux DevTools disabled in production
- [x] Source maps generated
- [x] Image CDN/compression enabled
- [x] CSS minification verified

### Verification
```bash
# Test public endpoint
curl https://api.example.com/api/v1/menu-items/public/home

# Expected Response:
# {"success": true, "data": [...], "message": "..."}
```

---

## Future Enhancements

### Phase 2: Order Integration
- [ ] Add to cart functionality
- [ ] Real-time availability updates (WebSockets)
- [ ] Order history integration

### Phase 3: Admin Features
- [ ] Bulk category/item management
- [ ] Scheduled menu changes
- [ ] A/B testing for pricing/visibility

### Phase 4: Analytics
- [ ] Popular items tracking
- [ ] Search analytics
- [ ] Conversion funnel tracking

### Phase 5: Performance
- [ ] CDN integration for images
- [ ] GraphQL API option
- [ ] Progressive Web App support

---

## Troubleshooting

### Problem: Menu not loading
**Check**:
1. Network tab: Is `/api/v1/menu-items/public/home` returning 200?
2. Backend logs: Any database errors?
3. Redis: Is it running? (Check graceful fallback working)
4. Database: Are there active categories with available items?

### Problem: Stale data showing
**Check**:
1. Cache TTL: Is it too high? (Change in cache.service.ts)
2. Admin updated menu: Did cache invalidation trigger?
3. Browser cache: Clear and reload

### Problem: Slow loading
**Check**:
1. Database query time: Use EXPLAIN ANALYZE
2. Redis: Is caching working? (Monitor cache hits)
3. Network: Check CDN/compression enabled
4. Images: Are they optimized? (Use image service)

---

## Code References

### Key Files
- Backend Cache: `src/services/cache.service.ts`
- Backend Routes: `src/routes/publicMenuItems.routes.ts`
- Backend Controller: `src/controllers/menuItem.controller.ts` (getHomePageMenu)
- Backend Service: `src/services/menuItem.service.ts` (getHomePageMenu)
- Frontend Redux: `src/redux/slices/menuSlice.ts` (fetchHomePageMenu)
- Frontend Component: `src/components/menu/DynamicMenu.tsx`
- Frontend Styles: `src/components/menu/DynamicMenu.css`

### Related Configuration
- Redis Config: `src/config/redis.ts`
- Database Config: `src/config/db.ts`
- Prisma Schema: `prisma/schema.prisma`

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-06-08 | Initial implementation with Redis caching and error handling |

---

**Last Updated**: June 8, 2026
**Maintained By**: Senior Full-Stack Developer
**Status**: Production Ready
