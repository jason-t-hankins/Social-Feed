# Public GraphQL Caching for CDN and Network Providers

## Context and Problem Statement

Many GraphQL applications serve both authenticated (private) and unauthenticated (public) content. Public content could benefit from caching by CDNs (Cloudflare, Fastly) and network providers (ISPs like Comcast), but traditional GraphQL implementations pose challenges:

1. **JWT tokens in requests**: Authentication headers prevent public caching
2. **POST requests**: GraphQL typically uses POST, which CDNs don't cache by default
3. **Query size**: Full query strings in requests increase bandwidth
4. **Token leakage risk**: Accidentally caching authenticated requests exposes sensitive data

**Goal**: Develop actionable guidance for enabling public (shared) caching of unauthenticated GraphQL queries while maintaining security and performance.

## Decision Drivers

- **Security**: Prevent JWT token leakage and accidental caching of sensitive data
- **Performance**: Reduce server load and improve response times for public content
- **Compatibility**: Work with existing GraphQL tooling (Apollo Client/Server)
- **Maintainability**: Clear separation between public and private queries
- **Measurability**: Validate caching effectiveness through monitoring

## Considered Options

### Option 1: Separate Endpoints (Public + Authenticated)

Create two distinct GraphQL endpoints:
- `/graphql` - Authenticated, requires JWT, POST requests
- `/graphql-public` - No auth, GET requests with APQ

### Option 2: Same Endpoint with Conditional Auth

Use a single endpoint with conditional authentication based on query/operation.

### Option 3: Client-Side Query Splitting

Client decides which queries go to which endpoint based on operation name.

### Option 4: No Public Caching

Continue with current approach - all queries authenticated, no public caching.

## Decision Outcome

**Chosen option: "Option 1 - Separate Endpoints"**

### Rationale

1. **Security**: Physical separation eliminates token leakage risk
   - Public endpoint never sees Authorization headers
   - Impossible to accidentally cache authenticated requests
   - Clear audit trail for public vs private access

2. **Performance**: Optimized for each use case
   - Public: GET requests + APQ + HTTP caching
   - Authenticated: POST + HTTP batching + DataLoader

3. **Compatibility**: Standard HTTP caching
   - No custom CDN configuration needed
   - Works with any HTTP cache (CDN, ISP, browser)
   - Standard Cache-Control headers

4. **Maintainability**: Clear boundaries
   - Public queries explicitly defined in separate schema subset
   - No ambiguity about what can be cached
   - Easy to audit and validate

## Implementation Details

### Server Architecture

```typescript
// Two separate Apollo Server instances/endpoints

// 1. Authenticated endpoint - /graphql
app.use(
  '/graphql',
  cors(),
  express.json(),
  authenticateJWT, // Require JWT
  expressMiddleware(authenticatedServer, {
    context: async ({ req }) => ({
      user: req.user,
      loaders: createDataLoaders(...),
    }),
  })
);

// 2. Public endpoint - /graphql-public
app.use(
  '/graphql-public',
  cors(),
  express.json(),
  expressMiddleware(publicServer, {
    context: async () => ({
      loaders: createDataLoaders(...),
      // No user context - public only
    }),
  })
);
```

### Client Configuration

```typescript
// Authenticated Apollo Client
const authenticatedClient = new ApolloClient({
  link: from([
    setContext((_, { headers }) => ({
      headers: {
        ...headers,
        authorization: `Bearer ${getToken()}`,
      },
    })),
    new HttpLink({ uri: '/graphql' }),
  ]),
  cache: new InMemoryCache(),
});

// Public Apollo Client with APQ
const publicClient = new ApolloClient({
  link: createPersistedQueryLink({ sha256 }).concat(
    new HttpLink({
      uri: '/graphql-public',
      useGETForQueries: true, // Enable HTTP caching
    })
  ),
  cache: new InMemoryCache(),
});
```

### Schema Design

Define public queries explicitly:

```graphql
# Public schema subset
type Query {
  publicFeed(first: Int, after: String): PostConnection!
  publicPost(id: ID!): Post
  publicUser(username: String!): PublicUserProfile
}

# Authenticated schema (full access)
type Query {
  feed(first: Int, after: String): PostConnection!
  myFeed: PostConnection!
  myProfile: UserProfile!
  # ... all other queries
}
```

### Cache-Control Headers

```typescript
// Public endpoint - aggressive caching
res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=3600');

// Authenticated endpoint - no caching
res.setHeader('Cache-Control', 'private, no-cache, no-store');
```

## Automatic Persisted Queries (APQ)

### What is APQ?

APQ sends a SHA-256 hash of the query instead of the full query string:

```
# Without APQ (POST)
POST /graphql-public
{
  "query": "query GetFeed { feed { edges { node { id content } } } }"
}

# With APQ (GET)
GET /graphql-public?extensions={"persistedQuery":{"version":1,"sha256Hash":"abc123..."}}
```

### Benefits

1. **Reduced request size**: Hash (64 chars) vs full query (100s-1000s chars)
2. **Cacheable GET requests**: CDNs cache by URL
3. **Bandwidth savings**: Especially for mobile users

### Implementation

```typescript
import { createPersistedQueryLink } from '@apollo/client/link/persisted-queries';
import { sha256 } from 'crypto-hash';

const link = createPersistedQueryLink({ 
  sha256,
  useGETForHashedQueries: true,
}).concat(httpLink);
```

### Server Support

Apollo Server supports APQ out-of-the-box (enabled by default).

## Trade-offs and Considerations

### ✅ Benefits

1. **Reduced server load**: CDN serves 80-95% of public requests
2. **Faster response times**: Edge caching reduces latency
3. **Lower bandwidth costs**: APQ + caching reduces data transfer
4. **Scalability**: Handle traffic spikes without scaling servers
5. **Security**: Clear separation prevents token leakage

### ⚠️ Trade-offs

1. **HTTP Batching incompatible**: GET requests can't be batched
   - **Mitigation**: Only affects public queries; authenticated queries can still use batching
   
2. **Cache invalidation complexity**: Need strategy for stale data
   - **Mitigation**: Short TTLs (5-15 min) + manual purge API
   
3. **Additional complexity**: Two endpoints, two clients, two schemas
   - **Mitigation**: Clear documentation and examples
   
4. **APQ setup overhead**: Requires crypto-hash library, server config
   - **Mitigation**: Apollo Client/Server have built-in support

5. **Cannot cache personalized content**: Only truly public data
   - **Mitigation**: Clear criteria for what qualifies as "public"

## Eligibility Criteria for Public Caching

A query is eligible for public caching if **ALL** of the following are true:

✅ **No PII (Personally Identifiable Information)**
- No user-specific data (email, phone, address)
- No private user actions (likes, bookmarks, history)

✅ **No Authorization Required**
- Data is accessible to all users (logged in or not)
- Same data returned for everyone

✅ **Stable Data**
- Content doesn't change every second
- Acceptable TTL: 5-60 minutes

✅ **No Sensitive Business Data**
- No internal metrics, analytics, or proprietary data
- No draft/unpublished content

### Examples

| Query | Public? | Reason |
|-------|---------|--------|
| `publicFeed(first: 10)` | ✅ Yes | Public posts, same for everyone |
| `publicPost(id: "123")` | ✅ Yes | Single public post |
| `myFeed()` | ❌ No | User-specific, requires auth |
| `post(id: "123") { likedByMe }` | ❌ No | Contains user-specific field |
| `trendingTopics()` | ✅ Yes | Public aggregate data |
| `user(id: "123") { email }` | ❌ No | Contains PII |

## Security Checklist

Before enabling public caching:

- [ ] Audit all public queries for PII
- [ ] Ensure JWT tokens never sent to public endpoint
- [ ] Test with curl/Postman to verify no auth headers
- [ ] Monitor logs for accidental auth header usage
- [ ] Set up alerts for suspicious caching patterns
- [ ] Document which queries are public vs private
- [ ] Add tests to prevent auth queries on public endpoint
- [ ] Configure CDN to strip any auth headers (defense in depth)

## Monitoring and Validation

### Metrics to Track

1. **Cache hit rate**: % of requests served from cache
2. **Origin requests**: Number of requests reaching server
3. **Response time**: p50, p95, p99 latency
4. **Cache effectiveness**: Before/after comparison
5. **Error rate**: Ensure caching doesn't break functionality

### Tools

- **CDN Dashboard**: Cloudflare, Fastly analytics
- **Apollo Studio**: Query performance tracking
- **DataDog/New Relic**: Custom metrics and alerting
- **Browser DevTools**: Verify cache headers

### Expected Results

- Cache hit rate: 70-90% for public content
- Response time: 50-80% reduction (edge caching)
- Origin requests: 80-95% reduction

## Alternative Patterns Considered

### CDN with Custom Caching Rules

**Approach**: Use CDN rules to selectively cache POST requests

**Pros**: Single endpoint, simpler client code

**Cons**: 
- Complex CDN configuration
- Vendor-specific (not portable)
- Higher risk of misconfiguration
- POST caching not standard HTTP

**Decision**: Rejected - non-standard, vendor lock-in

### Reverse Proxy with Caching

**Approach**: Use Varnish/Nginx to cache GraphQL responses

**Pros**: Full control over caching logic

**Cons**:
- Requires dedicated infrastructure
- Complex invalidation logic
- Doesn't leverage CDN network
- More moving parts

**Decision**: Rejected - too complex for most use cases

## Implementation Phases

### Phase 1: Infrastructure (Week 1)
- [ ] Set up `/graphql-public` endpoint
- [ ] Implement JWT middleware for `/graphql`
- [ ] Add Cache-Control headers
- [ ] Deploy to staging

### Phase 2: Client Implementation (Week 1-2)
- [ ] Create public Apollo Client with APQ
- [ ] Migrate eligible queries to public endpoint
- [ ] Add authentication context/provider
- [ ] Update UI to use correct client

### Phase 3: Testing & Validation (Week 2)
- [ ] Security audit (verify no token leakage)
- [ ] Performance testing (cache hit rate)
- [ ] Load testing (CDN effectiveness)
- [ ] Documentation and examples

### Phase 4: Monitoring & Optimization (Week 3+)
- [ ] Set up metrics dashboard
- [ ] Configure alerts
- [ ] Tune cache TTLs based on data
- [ ] Community feedback and iteration

## Success Criteria

**Must Have**:
- ✅ No JWT tokens in public endpoint requests
- ✅ Cache hit rate > 70% for public queries
- ✅ Zero security incidents (token leakage)

**Should Have**:
- ✅ 50%+ reduction in origin requests
- ✅ 30%+ faster response times (p95)
- ✅ Clear documentation and examples

**Nice to Have**:
- ✅ APQ adoption > 90% of public queries
- ✅ CDN cost savings measurable
- ✅ Community adoption of pattern

## References

- [Apollo Client - Persisted Queries](https://www.apollographql.com/docs/apollo-server/performance/apq/)
- [HTTP Caching - MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/Caching)
- [GraphQL over HTTP Spec](https://graphql.github.io/graphql-over-http/)
- [CDN Caching Best Practices](https://www.cloudflare.com/learning/cdn/caching-best-practices/)

## Status

**Status**: Proposed  
**Date**: December 2025  
**Decision Makers**: Engineering Team  
**Next Review**: After Phase 3 completion

## Notes

This ADR captures the research and planning phase. Implementation will proceed through the phases outlined above, with learnings captured in follow-up ADRs or updates to this document.
