# Test Pages - Usage Guide

## Overview

The Social-Feed app includes interactive test pages to demonstrate and measure GraphQL optimization patterns. These pages help you understand **when** and **why** to use each pattern.

## Accessing Test Pages

1. Start the app: `npm run dev`
2. Open browser: `http://localhost:3000`
3. Use navigation buttons at the top of the page

## Test Page Details

### 1. 📱 Feed (Main Application)

**Purpose**: Shows all patterns working together in a real application.

**What to observe:**
- Open DevTools Network tab → filter "graphql"
- Watch server console for DataLoader batching logs
- See how fragments compose in the query

**Key files:**
- `client/src/components/Feed.tsx`
- `client/src/components/PostCard.tsx`
- `server/src/dataloaders/index.ts`

---

### 2. ⚡ HTTP Batching Test

**Purpose**: Compare performance with and without HTTP batching.

**What you'll see:**
- Two side-by-side scenarios
- Performance metrics (duration in milliseconds)
- Analysis of when batching helps

**How to test:**
1. Click "Start Performance Test"
2. Watch the Network tab (F12 → Network)
3. Compare request counts:
   - No batching: Multiple separate requests
   - With batching: Single request with array

**Expected results:**
- 3-5 queries: ~40% improvement with batching
- HTTP/1.1: More improvement
- HTTP/2: Less improvement (multiplexing)

**What to look for in Network tab:**
```javascript
// Without batching: Multiple requests
POST /graphql  (Query 1)
POST /graphql  (Query 2)
POST /graphql  (Query 3)

// With batching: Single request
POST /graphql  ([Query 1, Query 2, Query 3])
```

---

### 3. 🧩 useFragment Test

**Purpose**: Demonstrate how useFragment prevents unnecessary re-renders.

**What you'll see:**
- Left side: Components using useFragment
- Right side: Traditional props-based components
- Render count tracking for each component

**How to test:**
1. Open Console (F12 → Console)
2. Click "Force Parent Re-render"
   - useFragment components: No re-render ✅
   - Props components: Re-render ❌
3. Click "Like Post" (simulated update)
   - Only stats components should re-render

**Expected console output:**
```
🔄 PostContentWithFragment rendered 1
🔄 PostStatsWithFragment rendered 1

[User clicks "Force Parent Re-render"]

🔄 PostStatsWithProps rendered 2  ← Props version re-renders
// useFragment versions stay at render count 1
```

**When to use useFragment:**
- ✅ Complex UIs with frequent updates
- ✅ Real-time features (likes, views)
- ✅ Reusable component libraries
- ❌ Simple static pages

---

### 4. 🔄 DataLoader Test

**Purpose**: Visualize how DataLoader solves the N+1 query problem.

**What you'll see:**
- Expected vs actual query behavior
- Server-side batching logs
- Configurable test scenarios

**How to test:**

**Test 1: Basic (Posts + Authors)**
1. Set "Number of posts" to 5
2. Click "Test Basic (Posts + Authors)"
3. Watch server console for DataLoader logs

**Expected server logs:**
```
[DataLoader] Batched post load for 5 IDs
[DataLoader] Batched user load for 5 IDs
```

**Without DataLoader (N+1 problem):**
```
Query 1: Get 5 posts
Query 2: Get author for post 1
Query 3: Get author for post 2
...
Total: 6 queries
```

**With DataLoader:**
```
Query 1: Get 5 posts
Query 2: Get authors WHERE id IN [1,2,3,4,5]
Total: 2 queries
```

**Test 2: Nested (Posts + Comments + Authors)**
1. Click "Test Nested"
2. Watch for multiple DataLoader batches

**Expected behavior:**
```
Batch 1: Load posts
Batch 2: Load post authors
Batch 3: Load comments for all posts
Batch 4: Load comment authors
Total: ~4-5 queries (vs 50+ without DataLoader!)
```

---

## Using Browser DevTools

### Network Tab (HTTP Batching)

1. Open DevTools: `F12` or `Cmd+Option+I`
2. Go to "Network" tab
3. Filter by "graphql"
4. Look for:
   - Request count (fewer = better)
   - Request payload size
   - Time to complete

### Console Tab (DataLoader)

Server logs appear here:
```
[DataLoader] Batched user load for 10 IDs: [...]
[DataLoader] Batched comment count for 10 posts
```

These logs prove DataLoader is batching database queries.

### React DevTools Profiler (useFragment)

1. Install React DevTools extension
2. Go to "Profiler" tab
3. Click record button
4. Interact with the page
5. See which components re-rendered

---

## Common Observations

### "I don't see any improvement!"

**Possible reasons:**
1. **Network too fast**: On localhost, batching benefits are minimal. Test on real network conditions.
2. **Too few queries**: Batching helps most with 3+ simultaneous queries.
3. **HTTP/2**: If your connection uses HTTP/2, multiplexing reduces batching benefits.

### "DataLoader logs not showing"

**Check:**
1. Server is running (`npm run dev`)
2. Console shows server logs, not just client logs
3. You're executing a query that loads related entities

### "useFragment components still re-render"

**This is expected if:**
1. The fragment data actually changed
2. Parent forces re-render via key change
3. useFragment not properly configured with cache

---

## Performance Expectations

### DataLoader
- **Improvement**: 85-98% fewer database queries
- **Always beneficial**: Yes
- **When to skip**: Never (for production apps)

### HTTP Batching
- **Improvement**: 35-50% faster (HTTP/1.1, high latency)
- **Test first**: Results vary by network
- **When to skip**: HTTP/2 or single queries per page

### useFragment
- **Improvement**: 95% fewer re-renders (complex UIs)
- **Use for**: Real-time updates, reusable components
- **When to skip**: Simple static pages

---

## Troubleshooting

### Test pages not loading

1. Check both client and server are running
2. MongoDB must be running: `brew services start mongodb-community`
3. Check for port conflicts (3000, 4000)

### No data showing

1. Seed the database with sample data
2. Check MongoDB connection in server logs
3. Verify GraphQL server is responding

### Console errors

1. Clear cache and reload
2. Check for TypeScript errors: `npm run type-check`
3. Review browser console for client-side errors

---

## Next Steps

After exploring the test pages:

1. **Read the docs**:
   - Start: `docs/QUICK_REFERENCE.md`
   - Deep dive: `docs/RESEARCH_FINDINGS.md`
   - Decision: `docs/adr/0001-usefragment-vs-httpbatch-dataloader.md`

2. **Apply to your project**:
   - Always add DataLoader
   - Test HTTP batching on your network
   - Use useFragment for complex UIs

3. **Measure results**:
   - Monitor database query counts
   - Track HTTP request counts
   - Measure component re-renders

---

## Questions?

- **"Which pattern should I start with?"** → DataLoader (always)
- **"Do I need all three?"** → Depends on your app complexity
- **"How do I know if it's working?"** → Use these test pages!

**Read more**: [Quick Reference](../docs/QUICK_REFERENCE.md)
