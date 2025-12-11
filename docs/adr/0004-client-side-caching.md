# ADR 0004: Client-Side Caching with Apollo Client

**Status**: Accepted  
**Date**: 2025-12-10  
**Author**: Social Feed Team  
**Related**: [ADR 0001](0001-usefragment-vs-httpbatch-dataloader.md), [ADR 0003](0003-permission-aware-caching.md)

## Context and Problem Statement

Client-side caching is critical for responsive user experiences and reducing server load. Apollo Client provides a sophisticated normalized cache, but many developers struggle with:

- **Cache policy selection**: When to use `cache-first`, `network-only`, `cache-and-network`, etc.
- **Security concerns**: How to prevent caching sensitive data (SSN, passwords, tokens)
- **Varying field selections**: How Apollo merges queries requesting different fields
- **Permission-aware caching**: Handling data visibility based on user roles
- **Cache invalidation**: Keeping cached data fresh after mutations
- **Tooling proficiency**: Using Apollo DevTools and browser tools effectively

This ADR provides comprehensive guidance on implementing effective client-side caching patterns with Apollo Client, with special emphasis on security and field-level access control.

**Live Demo**: See `client/src/demos/05-client-cache/ClientCacheDemo.tsx` for interactive examples demonstrating:
1. Varying field selections and cache merge behavior
2. Field-level security with SSN masking
3. Cache policy comparison (cache-first vs network-only)
4. useFragment integration with client cache

## Decision Drivers

- **Performance**: Minimize network requests and server load
- **Security**: Never expose sensitive data in client cache
- **User Experience**: Instant UI updates with optimistic responses
- **Data Freshness**: Balance caching with real-time requirements
- **Developer Experience**: Clear patterns that scale with team size
- **Debugging**: Visibility into cache behavior for troubleshooting

## Considered Options

### 0. Apollo Client vs Alternative Caching Solutions

Before diving into Apollo Client specifics, we evaluated alternative client-side caching approaches:

#### Option A: Apollo Client (Chosen)
**Normalized, GraphQL-aware cache**

**Pros**:
- ✅ **Automatic normalization**: `User:123` cached once, shared across queries
- ✅ **GraphQL-first**: Built-in support for fragments, type policies, subscriptions
- ✅ **Fine-grained reactivity**: useFragment enables component-level cache reads
- ✅ **Excellent DevTools**: Apollo DevTools provide cache inspection, query history
- ✅ **Optimistic updates**: Built-in support for instant UI feedback
- ✅ **Field policies**: Transform/mask data at read time (e.g., SSN masking)

**Cons**:
- ❌ **Learning curve**: Normalization, cache keys, type policies require understanding
- ❌ **GraphQL-only**: Can't easily cache REST API responses
- ❌ **Bundle size**: ~33 KB minified + gzipped (heavier than alternatives)

#### Option B: TanStack Query (React Query)
**Generic, query-based caching**

**Pros**:
- ✅ **Protocol-agnostic**: Works with REST, GraphQL, gRPC, WebSockets
- ✅ **Simpler mental model**: Cache keyed by query string, no normalization
- ✅ **Smaller bundle**: ~13 KB minified + gzipped
- ✅ **Great DX**: Excellent DevTools, automatic background refetching

**Cons**:
- ❌ **No normalization**: Same entity fetched by different queries = duplicated in cache
- ❌ **Manual cache updates**: Invalidation requires explicit cache key management
- ❌ **No GraphQL-specific features**: No fragment composition or type policies

**When to use**: REST APIs, simpler apps, or when bundle size is critical

#### Option C: SWR (Stale-While-Revalidate)
**Lightweight, hook-based caching**

**Pros**:
- ✅ **Minimal bundle**: ~5 KB minified + gzipped
- ✅ **Simple API**: `useSWR(key, fetcher)` is intuitive
- ✅ **Automatic revalidation**: Background refetch on focus/reconnect

**Cons**:
- ❌ **No normalization**: Same limitations as React Query
- ❌ **Limited tooling**: No official DevTools
- ❌ **Less mature**: Smaller ecosystem than Apollo or React Query

**When to use**: Small apps, simple data requirements, or Next.js projects (built by Vercel)

#### Option D: Redux + RTK Query
**Redux-integrated caching**

**Pros**:
- ✅ **Redux integration**: Natural fit if already using Redux
- ✅ **Normalized cache**: Supports entity normalization like Apollo
- ✅ **Protocol-agnostic**: REST, GraphQL, or custom

**Cons**:
- ❌ **Boilerplate heavy**: More configuration than Apollo or React Query
- ❌ **Redux required**: Can't use standalone
- ❌ **GraphQL support limited**: No fragment composition or type policies

**When to use**: Existing Redux apps, or when Redux is a project requirement

#### Decision: Apollo Client
**Rationale**: For a GraphQL-first project with complex data relationships (posts, users, comments), Apollo's normalized cache and GraphQL-specific features (fragments, field policies, type policies) provide the best developer experience and performance. The bundle size trade-off is acceptable given the productivity gains.

### 1. Cache Policies

Apollo Client offers multiple fetch policies, each with different trade-offs:

#### Option A: `cache-first` (Default)
**When to use**: Public, static, or infrequently changing data

```typescript
useQuery(GET_PRODUCT_CATALOG, {
  fetchPolicy: 'cache-first', // Read from cache, only fetch if cache miss
});
```

**Pros**:
- ✅ Instant response for cached data
- ✅ Minimizes network requests
- ✅ Best performance for static content

**Cons**:
- ❌ May serve stale data if server updates
- ❌ Requires manual cache invalidation

**Use cases**: Product catalogs, blog posts, public user profiles, reference data

#### Option B: `network-only`
**When to use**: Sensitive, dynamic, or real-time data

```typescript
useQuery(GET_BANK_BALANCE, {
  fetchPolicy: 'network-only', // Always fetch fresh data, never cache
});
```

**Pros**:
- ✅ Always fresh data
- ✅ No stale data risk
- ✅ Appropriate for sensitive data

**Cons**:
- ❌ Network request on every render
- ❌ Slower UX (loading states)
- ❌ Higher server load

**Use cases**: Bank balances, private messages, OTPs, real-time dashboards

#### Option C: `cache-and-network`
**When to use**: Data that needs freshness but benefits from instant UI

```typescript
useQuery(GET_USER_FEED, {
  fetchPolicy: 'cache-and-network', // Show cached instantly, refresh in background
});
```

**Pros**:
- ✅ Instant UI from cache
- ✅ Background refresh ensures freshness
- ✅ Best of both worlds

**Cons**:
- ❌ Two renders (cached + fresh)
- ❌ Potential for UI "flash" if data changes
- ❌ Still makes network request

**Use cases**: Social feeds, dashboards, shopping carts

#### Option D: `no-cache`
**When to use**: Data that should NEVER be cached

```typescript
useQuery(GET_PASSWORD_RESET_TOKEN, {
  fetchPolicy: 'no-cache', // Bypasses cache entirely
});
```

**Pros**:
- ✅ Zero cache exposure
- ✅ Ideal for single-use data

**Cons**:
- ❌ No performance benefit
- ❌ Repeated queries = repeated fetches

**Use cases**: OTP codes, password reset tokens, CSRF tokens

### 2. Field-Level Cache Policies

For sensitive fields that should never be exposed in cache:

```typescript
const cache = new InMemoryCache({
  typePolicies: {
    User: {
      fields: {
        ssn: {
          read() {
            // Always return redacted value, even if server sends real data
            return '***-**-****';
          },
        },
        creditCard: {
          read(existing, { canRead }) {
            // Permission-based masking
            return canRead() ? existing : null;
          },
        },
      },
    },
  },
});
```

**Security benefits**:
- Defense-in-depth: Even if server accidentally sends sensitive data, client masks it
- Cache inspector safety: SSN never visible in Apollo DevTools
- Log safety: Redacted values in error logs

### 3. Varying Field Selections

Apollo's normalized cache merges queries requesting different fields:

**Query A (minimal)**:
```graphql
query GetUserCard {
  user(id: "1") {
    id
    displayName
  }
}
```

**Query B (full)**:
```graphql
query GetUserProfile {
  user(id: "1") {
    id
    displayName
    email
    avatarUrl
    createdAt
  }
}
```

**Cache behavior**:
1. Query A runs first → caches `{ id, displayName }`
2. Query B runs → **merges** `email`, `avatarUrl`, `createdAt` into existing `User:1` entry
3. Query A runs again → **reads from cache** including newly merged fields

**Key insight**: Broader queries populate cache for narrower queries. Order matters!

### 4. useFragment for Cache Reads

**Pattern**: Read cached data without executing a query

```typescript
// Parent component fetches full data
const { data } = useQuery(GET_POSTS);

// Child reads from cache
function PostCard({ id }: { id: string }) {
  const { complete, data } = useFragment({
    fragment: POST_CARD_FRAGMENT,
    from: { __typename: 'Post', id },
  });

  if (!complete) return null; // Not in cache yet

  return <div>{data.content}</div>; // Auto-updates when cache changes
}
```

**Benefits**:
- ✅ Zero network overhead
- ✅ Component subscribes to specific cache entry (live updates)
- ✅ Avoids prop drilling

**Comparison to ADR 0001**: Section 1 focused on re-render optimization. Section 4 emphasizes cache subscription and data availability.

### 5. Optimistic Updates

**Pattern**: Update UI instantly before server confirms

```typescript
const [likePost] = useMutation(LIKE_POST, {
  optimisticResponse: {
    likePost: {
      __typename: 'Post',
      id: postId,
      likeCount: currentLikeCount + 1, // Optimistic increment
    },
  },
  update(cache, { data }) {
    // Manually update cache after server responds
    cache.modify({
      id: cache.identify({ __typename: 'Post', id: postId }),
      fields: {
        likeCount() {
          return data.likePost.likeCount; // Real count from server
        },
      },
    });
  },
});
```

**Flow**:
1. User clicks "Like" → UI updates instantly (optimistic)
2. Mutation sent to server in background
3. Server responds → cache updated with real data
4. If server fails → Apollo **automatically rolls back** optimistic update

**Use cases**: Likes, favorites, toggles, increments

## Decision

**Adopt a tiered caching strategy based on data sensitivity and freshness requirements**:

### Tier 1: Public/Static Data → `cache-first`
- Product catalogs
- Blog posts
- Public user profiles
- Reference data (countries, categories)
- TTL: Long (hours to days)

### Tier 2: User-Specific Non-Sensitive → `cache-and-network`
- Social feeds
- Shopping carts
- User preferences
- Dashboard widgets
- TTL: Medium (minutes to hours)

### Tier 3: Sensitive/Dynamic → `network-only`
- Account balances
- Private messages
- Personal health data
- Financial transactions
- TTL: None (always fresh)

### Tier 4: Highly Sensitive → `no-cache`
- Passwords
- Credit card numbers
- OTP codes
- CSRF tokens
- Social Security Numbers
- TTL: None (never cache)

### Field-Level Policies
**Always mask these fields** regardless of fetch policy:
- `User.ssn` → `'***-**-****'`
- `User.creditCard` → `'**** **** **** 1234'`
- `User.password` → Never expose (should be excluded from schema)

### Optimistic Updates
**Use for mutations with predictable outcomes**:
- Like/unlike
- Follow/unfollow
- Star/unstar
- Increment/decrement counters

**Do NOT use for**:
- Complex server-side validation
- Transactions (payments, transfers)
- Operations with unpredictable side effects

## Implementation Guide

### Step 1: Configure Apollo Client

```typescript
import { ApolloClient, InMemoryCache } from '@apollo/client';

const cache = new InMemoryCache({
  typePolicies: {
    Query: {
      fields: {
        feed: {
          keyArgs: false,
          merge(existing, incoming, { args }) {
            // Handle pagination
            if (!args?.after) return incoming;
            return {
              ...incoming,
              edges: [...(existing?.edges || []), ...incoming.edges],
            };
          },
        },
      },
    },
    User: {
      keyFields: ['id'],
      fields: {
        // Mask SSN field
        ssn: {
          read() {
            return '***-**-****';
          },
        },
      },
    },
    Post: {
      keyFields: ['id'],
    },
  },
});

const client = new ApolloClient({
  uri: 'http://localhost:4000/graphql',
  cache,
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-and-network', // Default for most queries
    },
  },
});
```

### Step 2: Query with Appropriate Policy

```typescript
// Public data: cache-first
const { data: products } = useQuery(GET_PRODUCTS, {
  fetchPolicy: 'cache-first',
});

// User data: cache-and-network
const { data: feed } = useQuery(GET_FEED, {
  fetchPolicy: 'cache-and-network',
});

// Sensitive data: network-only
const { data: balance } = useQuery(GET_BALANCE, {
  fetchPolicy: 'network-only',
});
```

### Step 3: Implement Optimistic Updates

```typescript
const [likePost, { loading }] = useMutation(LIKE_POST, {
  optimisticResponse: {
    likePost: {
      __typename: 'Post',
      id: postId,
      likeCount: currentLikeCount + 1,
    },
  },
  refetchQueries: ['GetFeed'], // Refresh feed after mutation
});
```

### Step 4: Use useFragment for Cache Reads

```typescript
const POST_FRAGMENT = gql`
  fragment PostCardData on Post {
    id
    content
    likeCount
  }
`;

function PostCard({ postId }: { postId: string }) {
  const { complete, data } = useFragment({
    fragment: POST_FRAGMENT,
    from: { __typename: 'Post', id: postId },
  });

  if (!complete) return <div>Loading...</div>;
  return <div>{data.content}</div>;
}
```

## Cache Invalidation Strategies

### Option 1: TTL-Based (Server-Side)
**Server sends cache headers**:
```typescript
res.setHeader('Cache-Control', 'public, max-age=300'); // 5 minutes
```

**Client respects TTL**:
- Apollo Client doesn't automatically honor HTTP cache headers
- Implement custom logic or use `apollo-cache-persist`

### Option 2: Mutation-Based Invalidation
**Refetch affected queries**:
```typescript
useMutation(UPDATE_POST, {
  refetchQueries: ['GetFeed', 'GetPost'],
});
```

**Manual cache update**:
```typescript
useMutation(UPDATE_POST, {
  update(cache, { data }) {
    cache.writeQuery({
      query: GET_POST,
      variables: { id: postId },
      data: { post: data.updatePost },
    });
  },
});
```

**Cache eviction**:
```typescript
useMutation(DELETE_POST, {
  update(cache, { data }) {
    cache.evict({ id: cache.identify({ __typename: 'Post', id: postId }) });
    cache.gc(); // Garbage collect dangling references
  },
});
```

### Option 3: Polling for Real-Time Updates
```typescript
useQuery(GET_NOTIFICATIONS, {
  pollInterval: 5000, // Poll every 5 seconds
});
```

**Use sparingly**: High server load, battery drain on mobile

### Option 4: Subscription-Based Updates
```typescript
useSubscription(POST_LIKED, {
  onSubscriptionData: ({ client, subscriptionData }) => {
    // Update cache when subscription fires
    client.cache.modify({
      id: cache.identify({ __typename: 'Post', id: postId }),
      fields: {
        likeCount: (prev) => prev + 1,
      },
    });
  },
});
```

## Tooling and Debugging

### Apollo DevTools (Browser Extension)
**Install**: [Chrome](https://chrome.google.com/webstore) or [Firefox](https://addons.mozilla.org/en-US/firefox/)

**Features**:
1. **Cache Inspector**: View normalized cache structure
   - See all `User:1`, `Post:2` entries
   - Inspect field values (verify SSN is masked)
   - Check what data is cached vs missing

2. **Query Tracker**: Watch active queries
   - See loading states
   - Identify cache hits vs network requests
   - Monitor refetch behavior

3. **Mutation Tracker**: Debug optimistic updates
   - See optimistic response → server response flow
   - Identify rollback scenarios

### Browser Network Tab
- Filter by `graphql` to see all GraphQL requests
- Check `cache-first` queries don't hit network (unless cache miss)
- Verify `network-only` queries always fetch

### Cache Debugging Commands
```typescript
// Log entire cache
console.log(client.cache.extract());

// Check specific entity
const user = client.cache.readFragment({
  id: 'User:1',
  fragment: gql`
    fragment UserData on User {
      id
      displayName
      ssn
    }
  `,
});
console.log(user); // SSN should be '***-**-****'
```

## Trade-offs and Considerations

### Memory Usage
**Problem**: Large caches consume client memory

**Mitigations**:
- Set `cache.gc()` to run periodically
- Limit cache size with custom logic
- Evict least-recently-used entries

**Rule of thumb**: 10-50 MB cache is reasonable for most apps

### Stale Data Risk
**Problem**: Cached data becomes outdated

**Mitigations**:
- Use `cache-and-network` for data that changes frequently
- Implement mutation-based invalidation
- Set appropriate TTLs based on data volatility

**Example**: Product prices change rarely → `cache-first` with long TTL. User notifications change often → `cache-and-network` with short TTL.

### Privacy in Shared Environments
**Problem**: Cached data persists in browser (shared devices, public computers)

**Mitigations**:
- Clear cache on logout: `await client.clearStore()`
- Use `network-only` for sensitive data on public devices
- Implement field policies to mask data even in cache
- Avoid `apollo-cache-persist` for sensitive apps

### Cache Consistency
**Problem**: Multiple tabs/windows have separate caches

**Mitigations**:
- Use BroadcastChannel API to sync caches across tabs
- Implement polling for critical data
- Use GraphQL subscriptions for real-time sync

## Real-World Scenarios

### Scenario 1: E-Commerce Product Page
**Data**: Product details, reviews, inventory

**Strategy**:
- Product info: `cache-first` (changes rarely)
- Reviews: `cache-and-network` (updates periodically)
- Inventory: `network-only` (real-time stock)

```typescript
const { data: product } = useQuery(GET_PRODUCT, {
  fetchPolicy: 'cache-first',
});

const { data: reviews } = useQuery(GET_REVIEWS, {
  fetchPolicy: 'cache-and-network',
});

const { data: inventory } = useQuery(GET_INVENTORY, {
  fetchPolicy: 'network-only',
  pollInterval: 10000, // Poll every 10s
});
```

### Scenario 2: Social Media Feed
**Data**: Posts, likes, comments

**Strategy**:
- Feed: `cache-and-network` (show cached, refresh in background)
- Like mutation: Optimistic update for instant feedback

```typescript
const { data: feed } = useQuery(GET_FEED, {
  fetchPolicy: 'cache-and-network',
});

const [likePost] = useMutation(LIKE_POST, {
  optimisticResponse: {
    likePost: {
      __typename: 'Post',
      id: postId,
      likeCount: currentLikeCount + 1,
    },
  },
});
```

### Scenario 3: Banking Dashboard
**Data**: Account balance, transactions, profile

**Strategy**:
- Balance: `network-only` (always fresh, never cache)
- Transactions: `cache-and-network` (show cached, refresh)
- Profile: `cache-first` (changes rarely)

```typescript
const { data: balance } = useQuery(GET_BALANCE, {
  fetchPolicy: 'network-only',
});

const { data: transactions } = useQuery(GET_TRANSACTIONS, {
  fetchPolicy: 'cache-and-network',
});

const { data: profile } = useQuery(GET_PROFILE, {
  fetchPolicy: 'cache-first',
});
```

### Scenario 4: Admin Dashboard with Role-Based Data
**Challenge**: Same query returns different data based on user role

**Solution**: Cache key should include role (handled server-side in ADR 0003)

**Client-side**: Use `cache-and-network` to ensure data updates when user switches roles

```typescript
const { data: analytics, refetch } = useQuery(GET_ANALYTICS, {
  fetchPolicy: 'cache-and-network',
});

// On role change or logout
useEffect(() => {
  client.clearStore(); // Clear all cached data
  refetch(); // Fetch fresh data with new role
}, [user?.role]);
```

## Edge Cases and Mitigations

### Edge Case 1: Partial Data from Cache
**Problem**: Query requests fields not in cache → partial data returned

**Apollo behavior**: Returns `undefined` for missing fields

**Mitigation**:
```typescript
const { data, loading } = useQuery(GET_USER_FULL);

if (loading) return <Skeleton />;
if (!data?.user) return <Error />;

// Check for specific field availability
if (!data.user.email) {
  // Field not in cache, query may still be resolving
  return <Skeleton />;
}
```

### Edge Case 2: Cache Poisoning
**Problem**: Malicious data injected into cache

**Mitigation**:
- Validate server responses before caching
- Use field policies to sanitize data
- Clear cache on security-sensitive operations

```typescript
typePolicies: {
  User: {
    fields: {
      email: {
        read(existing) {
          // Validate email format before returning from cache
          if (existing && !isValidEmail(existing)) {
            return null; // Don't return invalid cached data
          }
          return existing;
        },
      },
    },
  },
}
```

### Edge Case 3: Large List Caching
**Problem**: Caching thousands of items consumes excessive memory

**Mitigation**:
- Implement virtual scrolling (only cache visible items)
- Use cursor-based pagination with limited cache
- Evict old pages when fetching new ones

```typescript
const { data, fetchMore } = useQuery(GET_FEED, {
  variables: { first: 20 },
});

const loadMore = () => {
  fetchMore({
    variables: { after: data.feed.pageInfo.endCursor },
    updateQuery(prev, { fetchMoreResult }) {
      // Limit cached pages to last 100 items
      const edges = [
        ...prev.feed.edges.slice(-80), // Keep last 80
        ...fetchMoreResult.feed.edges, // Add new 20
      ];
      return { feed: { ...fetchMoreResult.feed, edges } };
    },
  });
};
```

## Checklist for Implementation

- [ ] Audit all queries and categorize by data sensitivity
- [ ] Assign appropriate fetch policy to each query
- [ ] Implement field policies for sensitive fields (SSN, credit cards)
- [ ] Add optimistic updates for user interactions (likes, follows)
- [ ] Test cache behavior with Apollo DevTools
- [ ] Verify SSN/sensitive fields are masked in cache inspector
- [ ] Implement cache clearing on logout
- [ ] Add mutation-based cache invalidation for CRUD operations
- [ ] Test varying field selections (minimal vs full queries)
- [ ] Document cache policies in codebase (comments or README)
- [ ] Set up monitoring for cache hit rates (if using analytics)
- [ ] Test cache behavior in incognito/private mode (no persistence)
- [ ] Verify cache eviction works correctly after mutations

## Monitoring and Observability

### Metrics to Track
1. **Cache Hit Rate**: `cache hits / total queries`
   - Target: >70% for `cache-first` queries
2. **Cache Size**: Monitor memory consumption
   - Alert if >100 MB (potential leak)
3. **Query Latency**: Compare cached vs network requests
   - Cached should be <10ms, network 100-500ms
4. **Optimistic Update Success Rate**: `confirmed / total optimistic`
   - Target: >95% (few rollbacks)

### Logging Best Practices
```typescript
// Log cache operations in development
if (process.env.NODE_ENV === 'development') {
  client.onQueryUpdated = (observableQuery) => {
    console.log('[Cache] Query updated:', observableQuery.queryName);
  };

  client.onClearStore = () => {
    console.log('[Cache] Store cleared');
  };
}
```

## Consequences

### Good
✅ **Performance**: Instant UI for cached data, reduced server load  
✅ **Security**: Field policies prevent accidental sensitive data exposure  
✅ **UX**: Optimistic updates provide instant feedback  
✅ **Flexibility**: Multiple fetch policies for different data types  
✅ **Developer Experience**: Apollo DevTools provide excellent debugging

### Bad
❌ **Complexity**: Requires understanding of normalization and cache keys  
❌ **Stale Data Risk**: Aggressive caching can serve outdated data  
❌ **Memory Overhead**: Large caches consume client resources  
❌ **Debugging Difficulty**: Cache issues can be subtle and hard to reproduce

### Neutral
⚪ **Learning Curve**: Team needs training on cache policies and patterns  
⚪ **Maintenance**: Cache policies require periodic review as app evolves  
⚪ **Testing**: Requires testing with different cache states (empty, partial, full)

## Related Patterns

- **[ADR 0001](0001-usefragment-vs-httpbatch-dataloader.md)**: useFragment complements client caching by reading from cache without queries
- **[ADR 0003](0003-permission-aware-caching.md)**: Server-side caching handles permission-variant data, client caching optimizes per-user data
- **DataLoader (Section 1)**: Optimizes database layer, client cache optimizes network layer

## Further Reading

- [Apollo Client Caching Overview](https://www.apollographql.com/docs/react/caching/overview/)
- [Fetch Policies](https://www.apollographql.com/docs/react/data/queries/#setting-a-fetch-policy)
- [TypePolicies](https://www.apollographql.com/docs/react/caching/cache-configuration/#typepolicy-fields)
- [Optimistic Mutation UI](https://www.apollographql.com/docs/react/performance/optimistic-ui/)
- [Apollo DevTools](https://www.apollographql.com/docs/react/development-testing/developer-tooling/#apollo-client-devtools)

## Revision History

- **2025-12-10**: Initial ADR created with comprehensive caching patterns
