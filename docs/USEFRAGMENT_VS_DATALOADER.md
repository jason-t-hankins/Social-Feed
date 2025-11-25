# UseFragment vs HTTP Batching + DataLoader: Comprehensive Guide

This document provides comprehensive guidance on when and how to use `useFragment` (Apollo Client) versus HTTP Batching combined with Facebook's DataLoader pattern in Apollo Server.

## Table of Contents

1. [Overview](#overview)
2. [UseFragment Pattern](#usefragment-pattern)
3. [DataLoader Pattern](#dataloader-pattern)
4. [HTTP Batching](#http-batching)
5. [When to Use What](#when-to-use-what)
6. [Implementation Examples](#implementation-examples)
7. [Performance Considerations](#performance-considerations)
8. [Best Practices](#best-practices)

---

## Overview

### The Problem Space

When building GraphQL applications, performance optimization occurs at multiple layers:

| Layer | Optimization | Tool/Pattern |
|-------|--------------|--------------|
| Client → Server | Reduce HTTP requests | HTTP Batching |
| Client Cache | Efficient re-renders | useFragment |
| Server → Database | Reduce database queries | DataLoader |

These optimizations are **complementary**, not mutually exclusive. Understanding when and how to use each is crucial for building performant applications.

---

## UseFragment Pattern

### What is useFragment?

`useFragment` is an Apollo Client hook that allows components to read data from the cache using a fragment definition, enabling:

- **Component isolation**: Components re-render only when their specific fragment data changes
- **Fragment colocation**: Data requirements live next to the components that use them
- **Cache efficiency**: Reads directly from the normalized cache

### Example

```tsx
// Fragment colocated with component
const USER_AVATAR_FRAGMENT = gql`
  fragment UserAvatarFragment on User {
    id
    displayName
    avatarUrl
  }
`;

function UserAvatar({ userRef }) {
  const { data } = useFragment({
    fragment: USER_AVATAR_FRAGMENT,
    from: userRef,
  });
  
  return (
    <img src={data.avatarUrl} alt={data.displayName} />
  );
}
```

### Benefits

1. **Targeted Re-renders**: Component only re-renders when its specific data changes
2. **Type Safety**: Fragments provide strong typing for component props
3. **Modularity**: Components are self-contained and portable
4. **Maintainability**: Easy to see what data a component needs

### Limitations

- Requires careful cache configuration
- Fragment must match cached data structure
- Initial data must come from a query that includes the fragment

---

## DataLoader Pattern

### What is DataLoader?

DataLoader is a utility for batching and caching database requests within a single GraphQL operation. It solves the **N+1 query problem**.

### The N+1 Problem

```graphql
query {
  posts(first: 10) {
    author { name }  # Without DataLoader: 10 separate queries!
  }
}
```

Without DataLoader:
```
Query 1: Get 10 posts
Query 2: Get author for post 1
Query 3: Get author for post 2
... (10 more queries!)
Total: 11 queries
```

With DataLoader:
```
Query 1: Get 10 posts
Query 2: Get authors WHERE id IN [1, 2, 3, ...] (batched!)
Total: 2 queries
```

### Example

```typescript
// DataLoader creation
const userLoader = new DataLoader(async (userIds) => {
  const users = await db.users.findMany({
    where: { id: { in: userIds } }
  });
  return userIds.map(id => users.find(u => u.id === id));
});

// Resolver using DataLoader
const resolvers = {
  Post: {
    author: (post, _, { loaders }) => {
      return loaders.userLoader.load(post.authorId);
    }
  }
};
```

### Key Characteristics

1. **Per-Request Scoping**: Create new DataLoader instances per request
2. **Automatic Batching**: Collects loads within a single tick
3. **Request-Level Caching**: Deduplicates identical loads within a request
4. **Order Preservation**: Returns results in the same order as input keys

---

## HTTP Batching

### What is HTTP Batching?

HTTP Batching combines multiple GraphQL operations into a single HTTP request, reducing network overhead.

### Client Configuration (Apollo Client)

```typescript
import { BatchHttpLink } from '@apollo/client/link/batch-http';

const batchLink = new BatchHttpLink({
  uri: '/graphql',
  batchMax: 10,        // Max operations per batch
  batchInterval: 20,   // Wait time to collect operations (ms)
});
```

### Server Configuration (Apollo Server)

Apollo Server 4 supports batching out of the box. No additional configuration required.

### Benefits

- Reduces HTTP connection overhead
- Fewer round trips to server
- Better utilization of HTTP/1.1 connections

### Limitations

- Slight latency increase (batching window)
- All operations in batch fail/succeed together
- Less beneficial with HTTP/2 multiplexing

---

## When to Use What

### Decision Matrix

| Scenario | UseFragment | DataLoader | HTTP Batching |
|----------|:-----------:|:----------:|:-------------:|
| Component isolation/re-renders | ✅ | - | - |
| N+1 query resolution | - | ✅ | - |
| Multiple independent queries | ⚠️ | - | ✅ |
| Nested related data loading | - | ✅ | - |
| Cache-first rendering | ✅ | - | - |
| Real-time updates | ✅ | - | - |

### Use UseFragment When:

1. **Multiple components read the same entity data**
   ```tsx
   // Both components read from same User cache entry
   <UserAvatar user={user} />
   <UserName user={user} />
   ```

2. **You want fine-grained re-render control**
   ```tsx
   // UserAvatar won't re-render when likeCount changes
   <PostCard>
     <UserAvatar />
     <LikeCount />  {/* Only this re-renders on like */}
   </PostCard>
   ```

3. **Building reusable component libraries**
   - Components declare their data needs
   - Parent queries compose fragments automatically

### Use DataLoader When:

1. **Loading related entities in resolvers**
   ```typescript
   // Batch load authors for all posts
   Post: {
     author: (post, _, { loaders }) => loaders.userLoader.load(post.authorId)
   }
   ```

2. **Aggregating counts or statistics**
   ```typescript
   // Batch count queries
   Post: {
     commentCount: (post, _, { loaders }) => loaders.commentCountLoader.load(post.id)
   }
   ```

3. **Complex nested queries**
   ```graphql
   query {
     posts {
       author { ... }      # Batched
       comments {
         author { ... }    # Also batched!
       }
     }
   }
   ```

### Use HTTP Batching When:

1. **Components fetch data independently**
   ```tsx
   // Multiple useQuery hooks in different components
   function Dashboard() {
     return (
       <>
         <UserProfile />    {/* Has own useQuery */}
         <RecentPosts />    {/* Has own useQuery */}
         <Notifications />  {/* Has own useQuery */}
       </>
     );
   }
   ```

2. **Using HTTP/1.1 connections**
   - HTTP/2 multiplexing makes batching less critical

3. **High-latency networks**
   - Batching reduces round-trip overhead

---

## Implementation Examples

### Complete Example: Social Feed

#### Server with DataLoader

```typescript
// dataloaders.ts
export function createDataLoaders(db) {
  return {
    userLoader: new DataLoader(async (ids) => {
      console.log(`Batched user load: ${ids.length} users`);
      const users = await db.users.findMany({ where: { id: { in: ids } } });
      return ids.map(id => users.find(u => u.id === id));
    }),
    
    commentCountLoader: new DataLoader(async (postIds) => {
      console.log(`Batched comment count: ${postIds.length} posts`);
      const counts = await db.comments.groupBy({
        by: ['postId'],
        where: { postId: { in: postIds } },
        _count: true
      });
      return postIds.map(id => 
        counts.find(c => c.postId === id)?._count || 0
      );
    }),
  };
}

// resolvers.ts
const resolvers = {
  Post: {
    author: (post, _, { loaders }) => 
      loaders.userLoader.load(post.authorId),
    commentCount: (post, _, { loaders }) => 
      loaders.commentCountLoader.load(post.id),
  }
};
```

#### Client with Fragments and useFragment

```tsx
// PostCard.tsx
const POST_CARD_FRAGMENT = gql`
  fragment PostCard on Post {
    id
    content
    createdAt
    author {
      ...UserAvatar
    }
    commentCount
    likeCount
  }
  ${USER_AVATAR_FRAGMENT}
`;

function PostCard({ postRef }) {
  const { data } = useFragment({
    fragment: POST_CARD_FRAGMENT,
    from: postRef,
  });
  
  return (
    <article>
      <UserAvatar userRef={{ __typename: 'User', id: data.author.id }} />
      <p>{data.content}</p>
      <span>{data.commentCount} comments</span>
    </article>
  );
}
```

---

## Performance Considerations

### DataLoader: Timing Matters

DataLoader batches within a single tick of the event loop:

```typescript
// These will be batched (same tick)
const [user1, user2] = await Promise.all([
  userLoader.load('1'),
  userLoader.load('2'),
]);

// These will NOT be batched (different ticks)
const user1 = await userLoader.load('1');
const user2 = await userLoader.load('2');  // Separate query!
```

### HTTP Batching: Trade-offs

```
┌─────────────────────────────────────────────────────────┐
│ Without Batching                                         │
├─────────────────────────────────────────────────────────┤
│ Query 1 ─────────────────────────────► Response 1       │
│ Query 2 ─────────────────────────────► Response 2       │
│ Query 3 ─────────────────────────────► Response 3       │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ With Batching (20ms window)                             │
├─────────────────────────────────────────────────────────┤
│ Query 1 ─┐                                              │
│ Query 2 ─┼─[wait 20ms]─► Batch Request ─► All Responses│
│ Query 3 ─┘                                              │
└─────────────────────────────────────────────────────────┘
```

### UseFragment: Cache Considerations

```typescript
// Cache configuration for fragments
const cache = new InMemoryCache({
  typePolicies: {
    Post: {
      // Ensure proper normalization
      keyFields: ['id'],
    },
    User: {
      keyFields: ['id'],
    },
  },
});
```

---

## Best Practices

### 1. Always Use DataLoader Server-Side

Every GraphQL server should use DataLoader for related entity loading. The N+1 problem is universal.

```typescript
// ✅ Always create per-request loaders
context: async () => ({
  loaders: createDataLoaders(db)
})
```

### 2. Colocate Fragments with Components

Keep data requirements close to where they're used:

```tsx
// ✅ Fragment in same file as component
// UserAvatar.tsx
const USER_AVATAR_FRAGMENT = gql`...`;
export function UserAvatar() { ... }
```

### 3. Use useFragment for Isolated Updates

When components need independent re-rendering:

```tsx
// ✅ Only LikeButton re-renders when likes change
<Post>
  <Content />     {/* Static */}
  <LikeButton />  {/* Uses useFragment */}
</Post>
```

### 4. Profile Before Optimizing

Use Apollo DevTools and server logging to identify actual bottlenecks:

```typescript
// Add logging to DataLoaders
const userLoader = new DataLoader(async (ids) => {
  console.log(`[DataLoader] Loading ${ids.length} users`);
  // ...
});
```

### 5. Consider HTTP/2 Before Batching

With HTTP/2, multiple requests are multiplexed over single connection. HTTP batching provides less benefit.

### 6. Combine All Three for Optimal Performance

The most performant GraphQL applications use all three patterns:

```
Client                              Server                    Database
┌─────────────────────────────────────────────────────────────────────┐
│ Component A ──┐                                                      │
│               ├─► HTTP Batch ──► Resolvers ──► DataLoader ──► Query │
│ Component B ──┘    (fewer        (batched     (batched              │
│                    requests)      execution)   DB calls)            │
│                                                                      │
│ UseFragment ←────── Apollo Cache ←───────────────── Responses       │
│ (targeted                                                            │
│  re-renders)                                                         │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Summary

| Pattern | Layer | Problem Solved | When Essential |
|---------|-------|----------------|----------------|
| **useFragment** | Client | Excessive re-renders | Complex UIs with shared data |
| **DataLoader** | Server | N+1 queries | Always (any GraphQL server) |
| **HTTP Batching** | Network | HTTP overhead | High-latency, HTTP/1.1 |

These patterns are complementary. A well-optimized GraphQL application typically uses:
- **DataLoader** on every server (non-negotiable)
- **Fragment colocation** for maintainable client code
- **useFragment** for performance-critical UI components
- **HTTP batching** when network conditions warrant it

---

## References

- [Apollo Client useFragment](https://www.apollographql.com/docs/react/data/fragments/#usefragment)
- [DataLoader GitHub](https://github.com/graphql/dataloader)
- [Apollo HTTP Batching](https://www.apollographql.com/docs/react/api/link/apollo-link-batch-http/)
- [GraphQL N+1 Problem](https://shopify.engineering/solving-the-n-1-problem-for-graphql-through-batching)
