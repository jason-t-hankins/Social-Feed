# GraphQL Optimization Patterns - Demo Guide

## Quick Start

```bash
npm run dev
# Visit http://localhost:3000
```

## What This Project Demonstrates

This app shows **three GraphQL techniques** optimizing different layers. **Two are performance wins, one is code organization:**

### 🏆 1. DataLoader (Database Optimization) - THE BIGGEST WIN
**Layer:** Server ↔ Database  
**Performance Impact:** 99% reduction in database queries!

**What it does:**
- Batches multiple database queries into single queries
- Eliminates N+1 query problem (the #1 GraphQL performance killer)
- Caches results per-request

**Real Numbers:**
- 10 posts: 11 queries → 2 queries (82% reduction)
- 100 posts: 301 queries → 4 queries (99% reduction)
- 1000 posts: 3001 queries → 4 queries (99.9% reduction)

**When to use:**
- ✅ **ALWAYS** - Non-negotiable for production!
- ✅ Any GraphQL server with relational data
- ✅ Development/staging (catch N+1 issues early)

### 🚀 2. HTTP Batching (Network Optimization) - REAL PERFORMANCE
**Layer:** Client ↔ Server Communication  
**Performance Impact:** 80% reduction in HTTP overhead

**What it does:**
- Combines multiple independent GraphQL queries into a single HTTP request
- Reduces HTTP overhead (headers, TCP handshakes, etc.)
- Most effective on HTTP/1.1 or high-latency networks

**Real Numbers:**
- 5 independent widgets = 5 HTTP requests → 1 batched request
- Visible in DevTools Network tab!

**When to use:**
- ✅ Dashboards with 10+ independent queries (executing simultaneously)
- ✅ Admin panels with multiple data tables
- ✅ Mobile apps on slow networks
- ❌ Single query per page
- ⚠️ Less impactful with HTTP/2 (multiplexing)

### 🎯 3. Fragment Colocation (Code Organization) - NOT PERFORMANCE
**Layer:** Component Architecture  
**Performance Impact:** 0% (This is about maintainability!)

**What it does:**
- Components declare their own data requirements via fragments
- Parent queries automatically include nested fragments
- Prevents breaking changes when components evolve

**When to use:**
- ✅ Reusable component libraries
- ✅ Large teams (5+ developers)
- ✅ Complex nested components
- ❌ Performance optimization (it doesn't help speed!)
- ❌ Prototypes/MVPs

---

## Demo Pages (Ranked by Performance Impact)

### 🏆 DataLoader Demo - THE BIGGEST WIN
**Database optimization** showing 99% query reduction:
- Explains the N+1 problem with visual examples
- Shows server logs of DataLoader batching in action
- Performance comparison table (10 posts → 1000 posts)
- **Real Impact:** 3001 queries → 4 queries for 1000 posts!

**What you'll learn:**
- Why N+1 is the #1 GraphQL performance killer
- How DataLoader batches database queries
- Real server logs showing batching in action

### 🚀 HTTP Batching Demo - REAL PERFORMANCE
**Network optimization** showing 5 requests → 1:
- **LEFT (red):** 5 unique widgets = 5 HTTP requests
- **RIGHT (green):** Same 5 widgets = 1 batched HTTP request
- **Visible in DevTools Network tab!**

**How to test:**
1. Open DevTools → Network tab
2. Filter by "graphql"
3. Click "Run Test"
4. Watch: Left = 5 requests, Right = 1 request

### 🎯 Fragment Colocation Demo - MAINTAINABILITY ONLY
**Code organization** (NOT performance):
- **LEFT (red):** Parent hardcodes fields (tightly coupled)
- **RIGHT (green):** Components declare needs (loosely coupled)
- **Same speed, better code!**

**What it solves:**
- WITHOUT: Add field to `UserAvatar` → update 50+ queries manually
- WITH: Add to fragment → all queries updated automatically

### 📱 Feed Demo
**Production example** with all patterns:
- DataLoader batching (check server logs)
- Fragment colocation (maintainable code)
- Clean component architecture

### ⚡ Full Comparison
**Side-by-side** of all techniques

---

## Key Takeaways

### Performance Impact (Ranked):
1. **DataLoader:** 🥇 99% fewer database queries - THE GAME CHANGER
2. **HTTP Batching:** 🥈 80% less network overhead - Real wins for dashboards
3. **Fragment Colocation:** 🎯 0% performance gain - Code quality only!

### What Each Pattern IS For:
- **DataLoader:** Database optimization - Eliminates N+1 (3001 → 4 queries)
- **HTTP Batching:** Network optimization - Multiple queries → 1 request
- **Fragment Colocation:** Code organization - Maintainable components

### What Each Pattern is NOT For:
- **DataLoader:** ❌ NOT optional - Required for production!
- **HTTP Batching:** ❌ NOT for single queries, less useful with HTTP/2
- **Fragment Colocation:** ❌ NOT for performance - Zero speed improvement!

### Production Checklist (By Priority):
1. ✅ **DataLoader** - ALWAYS (99% DB query reduction)
2. ⚠️ **HTTP Batching** - If 10+ concurrent queries (dashboards)
3. 📝 **Fragment Colocation** - If large team / reusable components (maintainability)

---

## Architecture Overview

```
Client (React + Apollo Client)
├── Fragment Colocation: Component data requirements
└── HTTP Batching: Combines queries into 1 request
    ↓
    HTTP Request
    ↓
Server (Apollo Server)
├── Query Parsing: Processes batched operations
├── Resolvers: Fetch data for each field
└── DataLoader: Batches database queries
    ↓
    Database Queries (optimized)
    ↓
Database (MongoDB)
```

---

## Further Reading

- **ADR:** See `docs/adr/0001-usefragment-vs-httpbatch-dataloader.md`
- **Apollo Docs:** https://www.apollographql.com/docs/
- **DataLoader:** https://github.com/graphql/dataloader
- **Fragment Colocation:** https://www.apollographql.com/docs/react/data/fragments/

---

## Common Questions

**Q: Does useFragment prevent re-renders?**  
A: No! `useFragment` is for reading data from cache, not preventing re-renders. Fragment colocation is about code organization.

**Q: Should I always use HTTP batching?**  
A: Not always. It's most valuable for dashboards with 10+ independent queries. Single-query pages don't benefit.

**Q: Is DataLoader optional?**  
A: **NO.** DataLoader is required for any production GraphQL server with relational data. N+1 queries will kill your database.

**Q: Which pattern has the biggest performance impact?**  
A: **DataLoader** by far. It can reduce database queries from 1000s to 10s. The other patterns are valuable but scenario-dependent.
